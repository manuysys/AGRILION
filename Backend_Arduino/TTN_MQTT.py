import json
import ssl
import os
import time
from dotenv import load_dotenv
from paho.mqtt import client as mqtt_client

# =========================
# CARGAR VARIABLES
# =========================
load_dotenv()

TTN_BROKER = os.getenv("TTN_BROKER")
TTN_PORT = int(os.getenv("TTN_PORT"))
TTN_USER = os.getenv("TTN_USER")
TTN_PASS = os.getenv("TTN_PASS")
TTN_TOPIC = f"v3/{TTN_USER}/devices/+/up"

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
        print("✅ Conectado a HiveMQ")
    else:
        print("❌ Error conexión HiveMQ:", reason_code)

def on_disconnect_hivemq(client, userdata, reason_code, properties):
    print("⚠️ Desconectado de HiveMQ, intentando reconectar...")
    while True:
        try:
            client.reconnect()
            print("🔄 Reconectado a HiveMQ")
            break
        except:
            print("Reintentando en 5s...")
            time.sleep(5)

pub_client.on_connect = on_connect_hivemq
pub_client.on_disconnect = on_disconnect_hivemq

pub_client.connect(HIVEMQ_BROKER, HIVEMQ_PORT)
pub_client.loop_start()

# =========================
# CALLBACK TTN
# =========================
def on_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())

        payload = data.get("uplink_message", {}).get("decoded_payload")
        device_id = data.get("end_device_ids", {}).get("device_id")

        if payload is None:
            print("⚠️ No hay decoded_payload")
            return

        if device_id is None:
            print("⚠️ No hay device_id")
            return

        # Agregar metadata útil
        payload["device_id"] = device_id

        topic = f"smisia/{device_id}"

        result = pub_client.publish(topic, json.dumps(payload))

        if result.rc == 0:
            print(f"📤 [{topic}] →", payload)
        else:
            print("❌ Error al publicar en HiveMQ:", result.rc)

    except Exception as e:
        print("❌ Error procesando mensaje:", e)

def on_connect_ttn(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ Conectado a TTN")
        client.subscribe(TTN_TOPIC)
        print("📡 Suscripto a:", TTN_TOPIC)
    else:
        print("❌ Error conexión TTN:", reason_code)

def on_disconnect_ttn(client, userdata, reason_code, properties):
    print("⚠️ Desconectado de TTN, intentando reconectar...")
    while True:
        try:
            client.reconnect()
            print("🔄 Reconectado a TTN")
            break
        except:
            print("Reintentando en 5s...")
            time.sleep(5)

# =========================
# TTN MQTT (SUBSCRIBER)
# =========================
sub_client = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2)
sub_client.username_pw_set(TTN_USER, TTN_PASS)
sub_client.tls_set(cert_reqs=ssl.CERT_REQUIRED)

sub_client.on_connect = on_connect_ttn
sub_client.on_message = on_message
sub_client.on_disconnect = on_disconnect_ttn

sub_client.connect(TTN_BROKER, TTN_PORT)

# =========================
# LOOP PRINCIPAL
# =========================
print("🚀 Bridge TTN → HiveMQ corriendo...")
sub_client.loop_forever()