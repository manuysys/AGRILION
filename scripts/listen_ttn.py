"""
AGRILION — Listener de uplinks de TTN
=======================================

Se conecta a TTN por MQTT y muestra en vivo los uplinks del dispositivo
(útil para verificar el hardware antes de arrancar los bridges).

Uso (desde la raíz del repo):
    python scripts/listen_ttn.py            # 90 segundos
    python scripts/listen_ttn.py --seconds 300
"""

import argparse
import json
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


def main() -> int:
    parser = argparse.ArgumentParser(description="Escuchar uplinks de TTN")
    parser.add_argument("--seconds", type=int, default=90, help="Tiempo de escucha")
    args = parser.parse_args()

    env = parse_env(ENV_PATH)
    host = env.get("TTN_BROKER", "")
    port = int(env.get("TTN_PORT", "8883"))
    user = env.get("TTN_USER", "")
    password = env.get("TTN_PASS", "")
    topic = env.get("TTN_TOPIC") or f"v3/{user}/devices/+/up"

    print("=" * 64)
    print(f"AGRILION — Escuchando TTN {args.seconds}s")
    print(f"  Broker: {host}:{port}")
    print(f"  Topic:  {topic}")
    print("=" * 64)

    count = {"uplinks": 0}

    def on_connect(client, userdata, flags, rc, props):
        if rc == 0:
            print("✅ Conectado a TTN. Esperando uplinks...\n")
            client.subscribe(topic)
        else:
            print(f"❌ Error de conexión: {rc}")
            sys.exit(1)

    def on_message(client, userdata, msg):
        count["uplinks"] += 1
        try:
            data = json.loads(msg.payload.decode())
            device_id = data.get("end_device_ids", {}).get("device_id", "?")
            payload = data.get("uplink_message", {}).get("decoded_payload", {})
            rssi = (
                data.get("uplink_message", {})
                .get("rx_metadata", [{}])[0]
                .get("rssi", "?")
            )
            ts = data.get("received_at", "")
            print(f"[{count['uplinks']}] {ts}  device={device_id}  rssi={rssi}")
            print(f"    {json.dumps(payload, ensure_ascii=False)}")
        except Exception as e:
            print(f"[{count['uplinks']}] Error parseando: {e}")

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.username_pw_set(user, password)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
    client.on_connect = on_connect
    client.on_message = on_message

    try:
        client.connect(host, port, keepalive=30)
    except Exception as e:
        print(f"❌ No se pudo conectar a TTN: {e}")
        return 1

    client.loop_start()
    try:
        time.sleep(args.seconds)
    except KeyboardInterrupt:
        pass
    finally:
        client.loop_stop()
        client.disconnect()

    print()
    print("=" * 64)
    if count["uplinks"] > 0:
        print(f"✅ Se recibieron {count['uplinks']} uplinks — el hardware está transmitiendo")
        return 0
    print("⚠️ No llegó ningún uplink. Revisar:")
    print("   - ¿El CubeCell está encendido y ya unido a TTN? (LED / Serial Monitor)")
    print("   - ¿El DevEUI/AppEUI/AppKey de secrets.h coinciden con TTN?")
    print("   - ¿El gateway tiene cobertura? (TTN Console → Live data)")
    return 1


if __name__ == "__main__":
    sys.exit(main())
