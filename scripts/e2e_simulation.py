"""
AGRILION — Simulación E2E sin hardware
=======================================

Valida toda la cadena:
  web (Firebase Auth + reglas) → AI API → Firestore sensor/silo
  → HiveMQ → processor (InfluxDB + Firestore) → AI bridge (/ingest)

Pasos:
  1. Sign-up/login del usuario de prueba con la Web API key (valida config web).
  2. Escritura de perfil y silo vía Firestore REST con idToken (valida reglas).
  3. Arranque de AI API + 3 bridges.
  4. Registro del sensor smisia-cubecellab02s en el silo (AI API).
  5. Publicación de 5 lecturas simuladas en HiveMQ.
  6. Verificación en InfluxDB, Firestore y AI API.

Uso (desde la raíz del repo, con Docker/InfluxDB corriendo):
    python scripts/e2e_simulation.py

Requiere: Backend_Arduino/.env y paginaweb/.env.local completos.
"""

import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import requests

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path.cwd()
BACKEND = ROOT / "Backend_Arduino"
IA = ROOT / "Inteligencia_Artificial"
LOGS = Path(tempfile.gettempdir()) / "agrilion_e2e_logs"
LOGS.mkdir(parents=True, exist_ok=True)

TEST_EMAIL = "e2e@agrilion.dev"
TEST_PASSWORD = "AgrilionE2E2026!"
SILO_ID = "SB-E2E01"
SILO_NAME = "Lanza E2E"
DEVICE_ID = "smisia-cubecellab02s"
GRAIN = "soja"

HIVE_TOPIC = f"smisia/{DEVICE_ID}"
AI_BASE = "http://127.0.0.1:8000/api/v1"


def parse_env(path: Path) -> dict:
    values = {}
    for raw in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        values[key.strip()] = value.strip()
    return values


backend_env = parse_env(BACKEND / ".env")
web_env = parse_env(ROOT / "paginaweb" / ".env.local")

WEB_API_KEY = web_env.get("NEXT_PUBLIC_FIREBASE_API_KEY", "")
PROJECT_ID = web_env.get("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "")

results: list[tuple[str, bool, str]] = []


def check(name: str, ok: bool, detail: str):
    results.append((name, ok, detail))
    print(f"  [{'OK' if ok else 'FALLO'}] {name}: {detail}")


# ─── 0. Guardia: puerto 8000 libre (evita instancias duplicadas) ─────────────
import socket

_guard = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
try:
    _guard.bind(("127.0.0.1", 8000))
except OSError:
    print("❌ El puerto 8000 ya está en uso. Cerrá la AI API u otra instancia antes de correr el E2E.")
    sys.exit(1)
finally:
    _guard.close()


# ─── 1. Web Auth (sign-up o sign-in) ─────────────────────────────────────────
print("=" * 70)
print("PASO 1 — Firebase Auth con la Web API key")
print("=" * 70)

payload = {"email": TEST_EMAIL, "password": TEST_PASSWORD, "returnSecureToken": True}
r = requests.post(
    f"https://identitytoolkit.googleapis.com/v1/accounts:signUp?key={WEB_API_KEY}",
    json=payload, timeout=30,
)
if r.status_code != 200 and "EMAIL_EXISTS" in r.text:
    r = requests.post(
        f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={WEB_API_KEY}",
        json=payload, timeout=30,
    )

if r.status_code != 200:
    check("auth", False, r.text[:200])
    print("\nNo se puede continuar sin auth.")
    sys.exit(1)

auth_data = r.json()
uid = auth_data["localId"]
id_token = auth_data["idToken"]
check("auth", True, f"uid={uid} email={TEST_EMAIL}")

# ─── 2. Firestore REST: perfil + silo (valida reglas) ────────────────────────
print()
print("=" * 70)
print("PASO 2 — Firestore REST con idToken (reglas desplegadas)")
print("=" * 70)

fs_base = f"https://firestore.googleapis.com/v1/projects/{PROJECT_ID}/databases/(default)/documents"
headers = {"Authorization": f"Bearer {id_token}", "Content-Type": "application/json"}

profile_body = {
    "fields": {
        "email": {"stringValue": TEST_EMAIL},
        "name": {"stringValue": "Usuario E2E"},
        "company": {"stringValue": "Agrilion QA"},
        "role": {"stringValue": "user"},
        "createdAt": {"timestampValue": "2026-09-26T12:00:00Z"},
    }
}
r = requests.patch(f"{fs_base}/users/{uid}", headers=headers, json=profile_body, timeout=30)
check("firestore perfil (users/{uid})", r.status_code == 200, f"HTTP {r.status_code} {r.text[:120] if r.status_code != 200 else ''}")

silo_body = {
    "fields": {
        "name": {"stringValue": SILO_NAME},
        "grainType": {"stringValue": GRAIN},
        "location": {"stringValue": "Campo E2E"},
        "ownerId": {"stringValue": uid},
        "createdAt": {"timestampValue": "2026-09-26T12:00:00Z"},
    }
}
r = requests.patch(f"{fs_base}/users/{uid}/silos/{SILO_ID}", headers=headers, json=silo_body, timeout=30)
check("firestore silo (users/{uid}/silos)", r.status_code == 200, f"HTTP {r.status_code} {r.text[:120] if r.status_code != 200 else ''}")

# ─── 3. Arranque de servicios ────────────────────────────────────────────────
print()
print("=" * 70)
print("PASO 3 — Arranque AI API + bridges")
print("=" * 70)

procs: list[subprocess.Popen] = []
handles = []


def start(name: str, args: list[str], cwd: Path):
    out = open(LOGS / f"e2e_{name}.log", "w", encoding="utf-8")
    handles.append(out)
    p = subprocess.Popen(args, cwd=str(cwd), stdout=out, stderr=subprocess.STDOUT)
    procs.append(p)
    return p


start("ai_api", [sys.executable, "-m", "uvicorn", "api.app:app", "--port", "8000"], IA)
start("ttn_mqtt", [sys.executable, "TTN_MQTT.py"], BACKEND)
start("processor", [sys.executable, "MQTT_INFLUXDB_FIREBASE.py"], BACKEND)
start("ai_bridge", [sys.executable, "mqtt_to_ai_bridge.py"], BACKEND)

try:
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

    check("AI API /health", ready, "model_loaded=True" if ready else "no respondió en 180s")
    if not ready:
        raise SystemExit(1)

    time.sleep(12)  # esperar conexiones MQTT de los bridges

    # ─── 4. Registrar sensor vía AI API ──────────────────────────────────────
    print()
    print("=" * 70)
    print("PASO 4 — Registro del sensor vía AI API (Firebase Admin)")
    print("=" * 70)

    r = requests.post(
        f"{AI_BASE}/users/{uid}/silos/{SILO_ID}/sensors",
        json={"device_id": DEVICE_ID, "battery": 100},
        timeout=60,
    )
    check("POST /sensors", r.status_code == 200, f"HTTP {r.status_code} {r.text[:150] if r.status_code != 200 else ''}")

    # ─── 5. Publicar lecturas simuladas en HiveMQ ────────────────────────────
    print()
    print("=" * 70)
    print("PASO 5 — Publicar 5 lecturas simuladas en HiveMQ")
    print("=" * 70)

    import ssl
    from paho.mqtt import client as mqtt

    pub = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    pub.username_pw_set(backend_env["HIVEMQ_USER"], backend_env["HIVEMQ_PASS"])
    pub.tls_set(cert_reqs=ssl.CERT_REQUIRED)

    readings = [
        {"temperatura": 24.5, "humedad": 12.3, "presion": 1012.8, "co2": 450, "impacto": False, "aceleracion": 0.2},
        {"temperatura": 24.9, "humedad": 12.4, "presion": 1012.7, "co2": 470, "impacto": False, "aceleracion": 0.2},
        {"temperatura": 25.2, "humedad": 12.6, "presion": 1012.5, "co2": 480, "impacto": False, "aceleracion": 0.3},
        {"temperatura": 26.1, "humedad": 13.1, "presion": 1012.2, "co2": 1100, "impacto": False, "aceleracion": 0.3},
        {"temperatura": 27.0, "humedad": 13.8, "presion": 1011.9, "co2": 1800, "impacto": True, "aceleracion": 6.2},
    ]

    connected = False
    for attempt in range(3):
        try:
            pub.connect(backend_env["HIVEMQ_BROKER"], int(backend_env["HIVEMQ_PORT"]))
            pub.loop_start()
            connected = True
            break
        except Exception as e:
            print(f"  reintento de conexión: {e}")
            time.sleep(3)

    check("publicar en HiveMQ", connected, "conectado" if connected else "sin conexión")

    if connected:
        for i, reading in enumerate(readings, 1):
            payload = dict(reading)
            payload["device_id"] = DEVICE_ID
            pub.publish(HIVE_TOPIC, json.dumps(payload))
            print(f"  → lectura {i}: {payload}")
            time.sleep(2)
        time.sleep(12)
        pub.loop_stop()
        pub.disconnect()

    # ─── 6. Verificaciones ───────────────────────────────────────────────────
    print()
    print("=" * 70)
    print("PASO 6 — Verificación de resultados")
    print("=" * 70)

    # 6a. InfluxDB
    from influxdb_client_3 import InfluxDBClient3
    client = InfluxDBClient3(
        host=backend_env.get("INFLUX_HOST", backend_env.get("INFLUX_URL")),
        token=backend_env["INFLUX_TOKEN"],
        database=backend_env.get("INFLUX_DATABASE", "silobolsas"),
    )
    table = client.query(
        f'SELECT time, device, temperatura, humedad, co2, score FROM "sensores" '
        f"WHERE silo = '{SILO_ID}' ORDER BY time DESC LIMIT 10"
    )
    df = table.to_pandas()
    check("InfluxDB lecturas", len(df) >= 5, f"{len(df)} filas para silo={SILO_ID}")
    if not df.empty:
        print(df.to_string(index=False))
    client.close()

    # 6b. Firestore (Admin SDK)
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
            data.get("siloId") == SILO_ID and data.get("lastSeen") is not None,
            f"siloId={data.get('siloId')} grainType={data.get('grainType')} lastSeen={data.get('lastSeen')}",
        )
    else:
        check("Firestore sensors/{device}", False, "documento inexistente")

    silo_doc = fs.collection("users").document(uid).collection("silos").document(SILO_ID).get()
    if silo_doc.exists:
        data = silo_doc.to_dict()
        check(
            "Firestore silo estado",
            data.get("estado") is not None,
            f"estado={data.get('estado')} score={data.get('score')} alerta={data.get('alerta')}",
        )
    else:
        check("Firestore silo estado", False, "documento inexistente")

    # 6c. AI API overview
    ov = requests.get(f"{AI_BASE}/silos/overview", timeout=30).json()
    silos = {s["silo_id"]: s for s in ov.get("silos", [])}
    if SILO_ID in silos:
        s = silos[SILO_ID]
        check(
            "AI API /silos/overview",
            s["risk_score"] >= 0,
            f"T={s['temperature']} H={s['humidity']} CO2={s['co2']} score={s['risk_score']} level={s['risk_level']}",
        )
    else:
        check("AI API /silos/overview", False, f"silo {SILO_ID} no aparece (silos: {list(silos)})")

finally:
    print()
    print("=" * 70)
    print("PASO 7 — Deteniendo servicios")
    print("=" * 70)
    for p in procs:
        if p.poll() is None:
            p.terminate()
    for p in procs:
        try:
            p.wait(timeout=8)
        except subprocess.TimeoutExpired:
            # Fallback en Windows: matar el árbol completo del proceso
            subprocess.run(
                ["taskkill", "/PID", str(p.pid), "/T", "/F"],
                capture_output=True,
            )
            p.kill()
    for h in handles:
        h.close()

    # Verificación final: que no quede ningún proceso hijo vivo
    time.sleep(1)
    alive = [p.pid for p in procs if p.poll() is None]
    if alive:
        print(f"  ⚠️ Procesos aún vivos: {alive}")
    else:
        print("  servicios detenidos")

print()
print("=" * 70)
print("RESUMEN")
print("=" * 70)
fails = 0
for name, ok, detail in results:
    print(f"  [{'OK' if ok else 'FALLO'}] {name} — {detail}")
    if not ok:
        fails += 1
print()
print(f"{'TODO OK ✅' if fails == 0 else f'{fails} verificaciones fallaron ❌'}")
sys.exit(0 if fails == 0 else 1)
