"""Bridge TTN -> HiveMQ.

Se suscribe a los uplinks de TTN, decodifica el payload (incluido el bloque
GPS v2) y publica el JSON en HiveMQ para los demás consumidores.
"""

import base64
import json
import ssl
import os
import struct
import sys
import time
from dotenv import load_dotenv
from paho.mqtt import client as mqtt_client

# Consola Windows (cp1252) no soporta emojis: forzar UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

TTN_BROKER = os.getenv("TTN_BROKER")
TTN_PORT = int(os.getenv("TTN_PORT", "1883"))
TTN_USER = os.getenv("TTN_USER")
TTN_PASS = os.getenv("TTN_PASS")
# El topic incluye el tenant: v3/{app_id}@ttn/devices/+/up
TTN_TOPIC = os.getenv("TTN_TOPIC") or f"v3/{TTN_USER}/devices/+/up"

HIVEMQ_BROKER = os.getenv("HIVEMQ_BROKER")
HIVEMQ_PORT = int(os.getenv("HIVEMQ_PORT"))
HIVEMQ_USER = os.getenv("HIVEMQ_USER")
HIVEMQ_PASS = os.getenv("HIVEMQ_PASS")

# =========================
# HIVE MQTT (PUBLISHER)
# =========================
pub_client = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2)
pub_client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASS)
pub_client.tls_set(cert_reqs=ssl.CERT_REQUIRED)


def on_connect_hivemq(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("Conectado a HiveMQ")
    else:
        print("Error conexión HiveMQ:", reason_code)


def on_disconnect_hivemq(client, userdata, disconnect_flags, reason_code, properties):
    print("Desconectado de HiveMQ, intentando reconectar...")
    while True:
        try:
            client.reconnect()
            print("Reconectado a HiveMQ")
            break
        except Exception:
            print("Reintentando en 5s...")
            time.sleep(5)


pub_client.on_connect = on_connect_hivemq
pub_client.on_disconnect = on_disconnect_hivemq

pub_client.connect(HIVEMQ_BROKER, HIVEMQ_PORT)
pub_client.loop_start()


# =========================
# DECODER LOCAL (fallback del formatter de TTN)
# =========================
def decode_payload_v2(raw: bytes) -> dict | None:
    """Decodifica el payload binario aunque TTN todavía use el formatter viejo."""
    if len(raw) < 11:
        return None

    temp = struct.unpack(">h", raw[0:2])[0] / 100.0
    hum = struct.unpack(">h", raw[2:4])[0] / 100.0
    pres = struct.unpack(">h", raw[4:6])[0] / 10.0
    co2 = struct.unpack(">H", raw[6:8])[0]
    impacto = raw[8] == 1
    acc = struct.unpack(">H", raw[9:11])[0] / 10.0

    data = {
        "temperatura": round(temp, 2),
        "humedad": round(hum, 2),
        "presion": round(pres, 1),
        "co2": co2,
        "impacto": impacto,
        "aceleracion": round(acc, 1),
        "dispositivo": "agrilion-v2",
        "payload_version": 1,
    }

    if len(raw) >= 23:
        flags = raw[11]
        version = (flags >> 4) & 0x0F
        if version == 2:
            has_fix = bool(flags & 0x01)
            current_fix = bool(flags & 0x02)
            lat_raw = struct.unpack(">i", raw[14:18])[0]
            lon_raw = struct.unpack(">i", raw[18:22])[0]
            data.update({
                "payload_version": 2,
                "gps_has_fix": has_fix,
                "gps_fix": current_fix,
                "gps_satellites": raw[12],
                "gps_hdop": round(raw[13] / 10.0, 1),
                "gps_age_min": raw[22],
                "latitude": round(lat_raw / 10000000.0, 7) if has_fix else None,
                "longitude": round(lon_raw / 10000000.0, 7) if has_fix else None,
            })

    return data


def get_payload(data: dict) -> dict | None:
    """Prioriza el decoder local (incluye GPS) y completa con TTN si hace falta."""
    uplink = data.get("uplink_message", {}) or {}
    payload = uplink.get("decoded_payload")
    frm_payload = uplink.get("frm_payload")

    local = None
    if frm_payload:
        try:
            local = decode_payload_v2(base64.b64decode(frm_payload))
        except Exception as e:
            print(f"No se pudo decodificar frm_payload localmente: {e}")

    if local is not None:
        if isinstance(payload, dict):
            merged = dict(payload)
            merged.update(local)
            return merged
        return local

    return payload if isinstance(payload, dict) else None


# =========================
# CALLBACK TTN
# =========================
def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())

        payload = get_payload(data)
        device_id = data.get("end_device_ids", {}).get("device_id")

        if payload is None:
            print("No hay decoded_payload ni frm_payload")
            return

        if device_id is None:
            print("No hay device_id")
            return

        payload["device_id"] = device_id
        topic = f"smisia/{device_id}"

        result = pub_client.publish(topic, json.dumps(payload))

        if result.rc == 0:
            print(f"[{topic}] -> {payload}")
        else:
            print("Error al publicar en HiveMQ:", result.rc)

    except Exception as e:
        print("Error procesando mensaje:", e)


def on_connect_ttn(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("Conectado a TTN")
        client.subscribe(TTN_TOPIC)
        print("Suscrito a:", TTN_TOPIC)
    else:
        print("Error conexión TTN:", reason_code)


def on_disconnect_ttn(client, userdata, disconnect_flags, reason_code, properties):
    print("Desconectado de TTN, intentando reconectar...")
    while True:
        try:
            client.reconnect()
            print("Reconectado a TTN")
            break
        except Exception:
            print("Reintentando en 5s...")
            time.sleep(5)


sub_client = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2)
sub_client.username_pw_set(TTN_USER, TTN_PASS)
sub_client.tls_set(cert_reqs=ssl.CERT_REQUIRED)

sub_client.on_connect = on_connect_ttn
sub_client.on_message = on_message
sub_client.on_disconnect = on_disconnect_ttn

sub_client.connect(TTN_BROKER, TTN_PORT)

print("Bridge TTN -> HiveMQ corriendo...")
sub_client.loop_forever()
