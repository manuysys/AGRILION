"""
AGRILION — Captura en vivo del hardware real
=============================================

Arranca la AI API + los 3 bridges y espera lecturas reales del device
(smisia-cubecellab02s) que llegan por TTN → HiveMQ. Verifica:
  1. InfluxDB: lecturas nuevas del device.
  2. Firestore: sensors/{device}.lastSeen y el estado del silo.
  3. AI API: /silos/overview.

Uso (desde la raíz del repo, con la placa y el gateway funcionando):
    python scripts/live_capture.py
    python scripts/live_capture.py --minutes 5
"""

import argparse
import socket
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
BACKEND = ROOT / "Backend_Arduino"
IA = ROOT / "Inteligencia_Artificial"
LOGS = Path(tempfile.gettempdir()) / "agrilion_live_logs"
LOGS.mkdir(parents=True, exist_ok=True)

DEVICE_ID = "smisia-cubecellab02s"
AI_BASE = "http://127.0.0.1:8000/api/v1"


def parse_env(path: Path) -> dict:
    values = {}
    if not path.exists():
        return values
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip()
    return values


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--minutes", type=float, default=5.0, help="Tiempo máximo de espera")
    args = parser.parse_args()

    env = parse_env(BACKEND / ".env")

    # Guardia de puerto
    guard = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        guard.bind(("127.0.0.1", 8000))
    except OSError:
        print("❌ El puerto 8000 ya está en uso. Cerrá la AI API antes de correr esto.")
        return 1
    finally:
        guard.close()

    print("=" * 70)
    print("AGRILION — Captura en vivo del hardware real")
    print("=" * 70)

    procs: list[subprocess.Popen] = []
    handles = []

    def start(name: str, argv: list[str], cwd: Path):
        out = open(LOGS / f"live_{name}.log", "w", encoding="utf-8")
        handles.append(out)
        procs.append(subprocess.Popen(argv, cwd=str(cwd), stdout=out, stderr=subprocess.STDOUT))

    start("ai_api", [sys.executable, "-m", "uvicorn", "api.app:app", "--port", "8000"], IA)
    start("ttn_mqtt", [sys.executable, "TTN_MQTT.py"], BACKEND)
    start("processor", [sys.executable, "MQTT_INFLUXDB_FIREBASE.py"], BACKEND)
    start("ai_bridge", [sys.executable, "mqtt_to_ai_bridge.py"], BACKEND)

    results: list[tuple[str, bool, str]] = []

    def check(name: str, ok: bool, detail: str):
        results.append((name, ok, detail))
        print(f"  [{'OK' if ok else 'FALLO'}] {name}: {detail}")

    try:
        # Esperar AI API
        ready = False
        deadline = time.time() + 180
        while time.time() < deadline:
            try:
                h = requests.get(f"{AI_BASE}/health", timeout=5)
                if h.status_code == 200 and h.json().get("model_loaded"):
                    ready = True
                    break
            except Exception:
                pass
            time.sleep(3)
        check("AI API /health", ready, "model_loaded=True" if ready else "no respondió")
        if not ready:
            return 1

        print("\nEsperando lecturas reales del device (TTN → HiveMQ → Influx)...\n")

        from influxdb_client_3 import InfluxDBClient3

        client = InfluxDBClient3(
            host=env.get("INFLUX_HOST", env.get("INFLUX_URL")),
            token=env["INFLUX_TOKEN"],
            database=env.get("INFLUX_DATABASE", "silobolsas"),
        )

        last_rows = None
        deadline = time.time() + args.minutes * 60
        while time.time() < deadline:
            table = client.query(
                f"SELECT time, device, temperatura, humedad, co2, score FROM \"sensores\" "
                f"WHERE device = '{DEVICE_ID}' AND time >= NOW() - INTERVAL '15 minutes' "
                f"ORDER BY time DESC LIMIT 10"
            )
            df = table.to_pandas()
            if len(df) >= 3 and (last_rows is None or len(df) != last_rows):
                last_rows = len(df)
                if len(df) >= 3:
                    break
            time.sleep(10)

        if last_rows is None:
            check("InfluxDB lecturas del device", False, f"sin lecturas de {DEVICE_ID} en 15 min")
        else:
            check("InfluxDB lecturas del device", True, f"{len(df)} lecturas recientes")
            print(df.to_string(index=False))
        client.close()

        # Firestore
        try:
            import firebase_admin
            from firebase_admin import credentials, firestore as fb_firestore

            cred_path = BACKEND / "firebase" / "serviceAccountKey.json"
            if not firebase_admin._apps:
                firebase_admin.initialize_app(credentials.Certificate(str(cred_path)))
            fs = fb_firestore.client()

            sensor_doc = fs.collection("sensors").document(DEVICE_ID).get()
            if sensor_doc.exists:
                data = sensor_doc.to_dict()
                check(
                    "Firestore sensors/{device}",
                    data.get("lastSeen") is not None,
                    f"siloId={data.get('siloId')} lastSeen={data.get('lastSeen')}",
                )
                owner = data.get("ownerUid")
                silo = data.get("siloId")
                if owner and silo:
                    silo_doc = fs.collection("users").document(owner).collection("silos").document(silo).get()
                    if silo_doc.exists:
                        sd = silo_doc.to_dict()
                        check(
                            "Firestore silo estado",
                            sd.get("estado") is not None,
                            f"estado={sd.get('estado')} score={sd.get('score')} alerta={sd.get('alerta')}",
                        )
            else:
                check("Firestore sensors/{device}", False, "documento inexistente")
        except Exception as e:
            check("Firestore", False, str(e)[:120])

        # AI API overview
        try:
            ov = requests.get(f"{AI_BASE}/silos/overview", timeout=30).json()
            silos = {s["silo_id"]: s for s in ov.get("silos", [])}
            target = next((s for s in silos.values() if s.get("device_id") == DEVICE_ID), None)
            if target:
                check(
                    "AI API /silos/overview",
                    True,
                    f"silo={target['silo_id']} T={target['temperature']} H={target['humidity']} "
                    f"CO2={target['co2']} score={target['risk_score']} ({target['risk_level']})",
                )
            else:
                check("AI API /silos/overview", False, f"device no aparece (silos: {list(silos)})")
        except Exception as e:
            check("AI API overview", False, str(e)[:120])

    finally:
        print()
        print("Deteniendo servicios...")
        for p in procs:
            if p.poll() is None:
                p.terminate()
        for p in procs:
            try:
                p.wait(timeout=8)
            except subprocess.TimeoutExpired:
                subprocess.run(["taskkill", "/PID", str(p.pid), "/T", "/F"], capture_output=True)
                p.kill()
        for h in handles:
            h.close()
        print("Listo.")

    print()
    fails = sum(1 for _, ok, _ in results if not ok)
    print(f"{'TODO OK' if fails == 0 else f'{fails} verificaciones fallaron'}")
    return 0 if fails == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
