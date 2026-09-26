"""
AGRILION — Verificador de MQTT (TTN + HiveMQ)
==============================================

Lee las credenciales de Backend_Arduino/.env y comprueba:
    - TTN: conexión MQTT TLS y CONNACK autorizado (puerto 8883).
    - HiveMQ: conexión MQTT TLS y suscripción a smisia/#.

Uso (desde la raíz del repo):
    python scripts/check_mqtt.py
"""

import ssl
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from paho.mqtt import client as mqtt

ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = ROOT / "Backend_Arduino" / ".env"


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


def test_connection(name: str, host: str, port: int, user: str, password: str, topic: str, wait: int = 6) -> bool:
    result = {"rc": None, "connected": False, "subscribed": False, "message": False, "error": ""}

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set(user, password)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)

    def on_connect(c, u, flags, rc, props):
        result["rc"] = rc
        if rc == 0:
            result["connected"] = True
            c.subscribe(topic)
        else:
            result["error"] = f"CONNACK {rc}"

    def on_subscribe(c, u, mid, rcs, props):
        result["subscribed"] = True

    def on_message(c, u, msg):
        result["message"] = True

    client.on_connect = on_connect
    client.on_subscribe = on_subscribe
    client.on_message = on_message

    try:
        client.connect(host, port, keepalive=20)
        client.loop_start()
        deadline = time.time() + wait
        while time.time() < deadline:
            time.sleep(0.2)
        client.loop_stop()
        client.disconnect()
    except Exception as e:
        result["error"] = f"{type(e).__name__}: {e}"

    state = "OK" if result["connected"] else "FALLO"
    detail = f"conectado={result['connected']} suscripto={result['subscribed']}"
    if name == "TTN":
        detail += f" uplink={result['message']}"
    if result["error"]:
        detail += f" | {result['error']}"
    print(f"[{state}] {name}: {host}:{port} — {detail}")

    return result["connected"]


def main() -> int:
    print("=" * 64)
    print("AGRILION — Verificación de MQTT (TTN + HiveMQ)")
    print("=" * 64)

    env = parse_env(ENV_PATH)
    if not env:
        print(f"❌ No se pudo leer {ENV_PATH}")
        return 1

    ttn_user = env.get("TTN_USER", "")
    ttn_pass = env.get("TTN_PASS", "")
    ttn_app = env.get("TTN_APP_ID", "")

    ok_ttn = test_connection(
        "TTN",
        env.get("TTN_BROKER", ""),
        int(env.get("TTN_PORT", "8883")),
        ttn_user,
        ttn_pass,
        f"v3/{ttn_app}/devices/+/up",
    )

    ok_hive = test_connection(
        "HiveMQ",
        env.get("HIVEMQ_BROKER", ""),
        int(env.get("HIVEMQ_PORT", "8883")),
        env.get("HIVEMQ_USER", ""),
        env.get("HIVEMQ_PASS", ""),
        "smisia/#",
    )

    print("\n" + "=" * 64)
    if ok_ttn and ok_hive:
        print("MQTT OK ✅")
        return 0

    if not ok_ttn:
        print("TTN no autorizado. Revisar en TTN Console:")
        print("  Applications → tu app → API keys → Add API key")
        print("  Rights: 'Read application traffic' (crear DENTRO de la aplicación)")
        print(f"  Usuario MQTT: {ttn_user}  (debe ser {{app_id}}@ttn)")
    if not ok_hive:
        print("HiveMQ falló: revisar HIVEMQ_BROKER/USER/PASS en Backend_Arduino/.env")
    return 1


if __name__ == "__main__":
    sys.exit(main())
