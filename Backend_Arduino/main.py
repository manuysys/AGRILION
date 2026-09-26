"""
AGRILION — Lanzador local de los bridges IoT
=============================================

Ejecuta los 3 procesos del backend en paralelo, cada uno en su propia consola:

    1. TTN_MQTT.py                   → Bridge TTN → HiveMQ
    2. MQTT_INFLUXDB_FIREBASE.py     → HiveMQ → InfluxDB + Firebase
    3. mqtt_to_ai_bridge.py          → HiveMQ → AI API (/ingest)

Uso:
    cd Backend_Arduino
    python main.py

Requiere el .env completo (TTN, HiveMQ, InfluxDB, AI API).
En Docker esto lo reemplaza supervisord.conf.
"""

import subprocess
import sys
import time
from pathlib import Path

# Consola Windows (cp1252) no soporta emojis: forzar UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

SCRIPTS = [
    "TTN_MQTT.py",
    "MQTT_INFLUXDB_FIREBASE.py",
    "mqtt_to_ai_bridge.py",
]

HERE = Path(__file__).resolve().parent


def main() -> int:
    print("=" * 60)
    print("🚀 AGRILION — Lanzando bridges IoT")
    print("=" * 60)

    missing = [s for s in SCRIPTS if not (HERE / s).exists()]
    if missing:
        print(f"❌ Faltan archivos: {', '.join(missing)}")
        return 1

    processes: list[tuple[str, subprocess.Popen]] = []

    for script in SCRIPTS:
        print(f"   ▶ {script}")
        proc = subprocess.Popen(
            [sys.executable, str(HERE / script)],
            cwd=str(HERE),
        )
        processes.append((script, proc))

    print("\n✅ 3 procesos corriendo. Ctrl+C para detenerlos todos.\n")

    try:
        while True:
            time.sleep(2)
            for script, proc in processes:
                code = proc.poll()
                if code is not None:
                    print(f"⚠️ {script} terminó con código {code}. Deteniendo el resto...")
                    raise KeyboardInterrupt
    except KeyboardInterrupt:
        print("\n🛑 Deteniendo procesos...")
        for script, proc in processes:
            if proc.poll() is None:
                proc.terminate()
        for script, proc in processes:
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()
        print("✅ Detenidos.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
