import json
import ssl
import os
import time
from collections import deque
from dotenv import load_dotenv
from paho.mqtt import client as mqtt_client
from influxdb_client import InfluxDBClient, Point
from influxdb_client.client.write_api import SYNCHRONOUS
import firebase_admin
from firebase_admin import credentials, firestore

# =========================
# LOAD ENV
# =========================
load_dotenv()

# TTN
TTN_BROKER = os.getenv("TTN_BROKER")
TTN_PORT = int(os.getenv("TTN_PORT"))
TTN_USER = os.getenv("TTN_USER")
TTN_PASS = os.getenv("TTN_PASS")
TTN_TOPIC = f"v3/{TTN_USER}/devices/+/up"

# HiveMQ
HIVEMQ_BROKER = os.getenv("HIVEMQ_BROKER")
HIVEMQ_PORT = int(os.getenv("HIVEMQ_PORT"))
HIVEMQ_USER = os.getenv("HIVEMQ_USER")
HIVEMQ_PASS = os.getenv("HIVEMQ_PASS")

TOPIC = "smisia/#"

# Influx
INFLUX_URL = os.getenv("INFLUX_URL")
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_ORG = os.getenv("INFLUX_ORG")
INFLUX_BUCKET = os.getenv("INFLUX_BUCKET")

# =========================
# FIREBASE
# =========================
cred = credentials.Certificate("firebase/serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

device_cache = {}

def get_device_data(device_id):
    if device_id in device_cache:
        return device_cache[device_id]

    doc = db.collection("devices").document(device_id).get()

    if doc.exists:
        data = doc.to_dict()
        device_cache[device_id] = data
        return data
    else:
        print(f"⚠️ Device no registrado: {device_id}")
        return None

def update_last_seen(device_id):
    db.collection("devices").document(device_id).set({
        "last_seen": firestore.SERVER_TIMESTAMP
    }, merge=True)

# =========================
# INFLUX
# =========================
influx = InfluxDBClient(
    url=INFLUX_URL,
    token=INFLUX_TOKEN,
    org=INFLUX_ORG
)

write_api = influx.write_api(write_options=SYNCHRONOUS)

# =========================
# CONFIG POR GRANO
# =========================
CONFIG_GRANOS = {
    "maiz": {"hum_max": 14, "temp_max": 25},
    "soja": {"hum_max": 13, "temp_max": 25},
    "trigo": {"hum_max": 14, "temp_max": 25},
    "girasol": {"hum_max": 10, "temp_max": 20}
}

# =========================
# UTILS
# =========================
def safe_float(v):
    try:
        return float(v)
    except:
        return 0.0

# =========================
# HISTORIAL CO2 (clave)
# =========================
co2_history = {}
WINDOW = 5

def calcular_delta(device_id, co2):
    if device_id not in co2_history:
        co2_history[device_id] = deque(maxlen=WINDOW)

    hist = co2_history[device_id]
    hist.append(co2)

    if len(hist) < 3:
        return 0.0

    prev = sum(list(hist)[:-1]) / (len(hist) - 1)
    now = sum(hist) / len(hist)

    return now - prev

# =========================
# MOTOR INTELIGENTE
# =========================
def evaluar_riesgo(data, config):
    co2 = data["co2"]
    hum = data["hum"]
    temp = data["temp"]
    delta_co2 = data["delta_co2"]
    impacto = data["impacto"]

    score = 0
    evento = None

    # =====================
    # CO2 (síntoma principal)
    # =====================
    if co2 > 1500:
        score += 30
    elif co2 > 800:
        score += 15

    # 🔥 tendencia (más importante)
    if delta_co2 > 200:
        score += 35
        evento = "SUBIDA_BRUSCA_CO2"
    elif delta_co2 > 50:
        score += 20

    # =====================
    # HUMEDAD (depende del grano)
    # =====================
    if hum > 80:
        score += 25
    elif hum > config["hum_max"]:
        score += 15

    # =====================
    # TEMPERATURA
    # =====================
    if temp > 30:
        score += 25
    elif temp > config["temp_max"]:
        score += 15

    # =====================
    # IMPACTO (evento físico)
    # =====================
    if impacto:
        score += 20
        evento = "IMPACTO_FISICO"

    # =====================
    # CLASIFICACIÓN
    # =====================
    if score >= 70:
        estado = "RIESGO_ALTO"
        alerta = "Alta probabilidad de deterioro"
    elif score >= 40:
        estado = "RIESGO_MEDIO"
        alerta = "Condiciones inestables"
    else:
        estado = "OK"
        alerta = None

    return estado, alerta, score, evento

# =========================
# ALERT COOLDOWN
# =========================
last_alert_time = {}
COOLDOWN = 300

def puede_alertar(device_id):
    now = time.time()

    if device_id not in last_alert_time:
        last_alert_time[device_id] = now
        return True

    if now - last_alert_time[device_id] > COOLDOWN:
        last_alert_time[device_id] = now
        return True

    return False

def actualizar_silo(silo_id, estado, alerta, score, evento, delta):
    db.collection("silos").document(silo_id).set({
        "estado": estado,
        "alerta": alerta,
        "score": score,
        "evento": evento,
        "delta_co2": float(delta),
        "ultima_actualizacion": firestore.SERVER_TIMESTAMP
    }, merge=True)

# =========================
# HIVE CLIENT
# =========================
hive = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2)
hive.username_pw_set(HIVEMQ_USER, HIVEMQ_PASS)
hive.tls_set(cert_reqs=ssl.CERT_REQUIRED)

def on_hive_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ Conectado a HiveMQ")
        client.subscribe(TOPIC)
    else:
        print("❌ Error HiveMQ:", reason_code)

def on_hive_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())
        device_id = data.get("device_id")

        if not device_id:
            return

        info = get_device_data(device_id)
        if not info:
            return

        silo_id = info.get("silo_id", "unknown")
        tipo_grano = info.get("tipo_grano", "maiz")

        config = CONFIG_GRANOS.get(tipo_grano, CONFIG_GRANOS["maiz"])

        co2 = safe_float(data.get("co2"))
        hum = safe_float(data.get("humedad"))
        temp = safe_float(data.get("temperatura"))
        acc = safe_float(data.get("aceleracion"))

        impacto = acc > 5

        delta = calcular_delta(device_id, co2)

        estado, alerta, score, evento = evaluar_riesgo({
            "co2": co2,
            "hum": hum,
            "temp": temp,
            "delta_co2": delta,
            "impacto": impacto
        }, config)

        # =====================
        # INFLUX
        # =====================
        point = (
            Point("sensores")
            .tag("device", device_id)
            .tag("silo", silo_id)
            .tag("grano", tipo_grano)
            .field("co2", co2)
            .field("humedad", hum)
            .field("temperatura", temp)
            .field("aceleracion", acc)
            .field("delta_co2", delta)
            .field("score", score)
        )

        write_api.write(bucket=INFLUX_BUCKET, record=point)

        # =====================
        # FIREBASE
        # =====================
        if puede_alertar(device_id):
            actualizar_silo(silo_id, estado, alerta, score, evento, delta)

        update_last_seen(device_id)

        # =====================
        # LOGS PRO
        # =====================
        print(f"\n📥 {device_id} | {tipo_grano}")
        print(f"Estado: {estado} | Score: {score}")
        print(f"CO2:{co2} Δ:{round(delta,2)}")
        print(f"Temp:{temp} Hum:{hum}")
        print(f"Evento: {evento}")

    except Exception as e:
        print("❌ Error:", e)

hive.on_connect = on_hive_connect
hive.on_message = on_hive_message

# =========================
# TTN CLIENT
# =========================
ttn = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2)
ttn.username_pw_set(TTN_USER, TTN_PASS)
ttn.tls_set(cert_reqs=ssl.CERT_REQUIRED)

def on_ttn_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        print("✅ Conectado a TTN")
        client.subscribe(TTN_TOPIC)
    else:
        print("❌ Error TTN:", reason_code)

def on_ttn_message(client, userdata, msg):
    try:
        data = json.loads(msg.payload.decode())

        payload = data.get("uplink_message", {}).get("decoded_payload")
        device_id = data.get("end_device_ids", {}).get("device_id")

        if not payload or not device_id:
            return

        payload["device_id"] = device_id

        topic = f"smisia/{device_id}"
        hive.publish(topic, json.dumps(payload))

    except Exception as e:
        print("❌ TTN Error:", e)

ttn.on_connect = on_ttn_connect
ttn.on_message = on_ttn_message

# =========================
# START
# =========================
hive.connect(HIVEMQ_BROKER, HIVEMQ_PORT)
hive.loop_start()

ttn.connect(TTN_BROKER, TTN_PORT)

print("🚀 SISTEMA INTELIGENTE ACTIVO")
ttn.loop_forever()