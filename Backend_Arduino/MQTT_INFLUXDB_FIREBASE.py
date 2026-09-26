"""
AGRILION — MQTT → InfluxDB + Firebase Bridge
==============================================

Este script toma lecturas de HiveMQ y:

    1. INFLUXDB  → Guarda las LECTURAS NUMÉRICAS de sensores (time-series):
                   temperatura, humedad, CO2, aceleración, delta_CO2, score

    2. FIREBASE  → Actualiza datos CATEGÓRICOS (NO lecturas):
                   - sensor.lastSeen (cuándo se vio por última vez)
                   - sensor.active (está prendido/apagado)
                   - silo.estado (resultado del motor de riesgo)
                   - silo.alerta (si hay alerta activa)

⚠️  Firebase NO guarda números de sensores (eso va a InfluxDB).
    Firebase solo guarda el ESTADO de los objetos del sistema (users, silos, sensors).

Esquema esperado en Firestore:
    - sensors/{device_id}: { ownerUid, siloId, active, lastSeen }
    - users/{uid}/silos/{silo_id}: { estado, alerta, score, evento, ... }
"""

import json
import ssl
import os
import sys
import time
from collections import deque
from dotenv import load_dotenv
from paho.mqtt import client as mqtt_client
from influxdb_client_3 import InfluxDBClient3, Point
from firebase_admin import firestore

from device_registry import get_device_info, get_firestore_db

# Consola Windows (cp1252) no soporta emojis: forzar UTF-8
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# =========================
# LOAD ENV
# =========================
load_dotenv()

# HiveMQ
HIVEMQ_BROKER = os.getenv("HIVEMQ_BROKER")
HIVEMQ_PORT = int(os.getenv("HIVEMQ_PORT"))
HIVEMQ_USER = os.getenv("HIVEMQ_USER")
HIVEMQ_PASS = os.getenv("HIVEMQ_PASS")

TOPIC = "smisia/#"

# InfluxDB 3 Core
INFLUX_HOST = os.getenv("INFLUX_HOST", os.getenv("INFLUX_URL"))
INFLUX_TOKEN = os.getenv("INFLUX_TOKEN")
INFLUX_DATABASE = os.getenv("INFLUX_DATABASE", os.getenv("INFLUX_BUCKET", "silobolsas"))

# =========================
# FIREBASE (solo para datos categóricos)
# =========================
db = get_firestore_db()
FIREBASE_OK = db is not None


def update_sensor_status(device_id: str):
    """
    Actualiza el `lastSeen` del sensor en Firebase.

    ⚠️ NO guarda la lectura numérica — solo marca "se comunicó ahora".
    """
    if not FIREBASE_OK:
        return
    try:
        db.collection("sensors").document(device_id).set({
            "lastSeen": firestore.SERVER_TIMESTAMP,
            "active": True,
        }, merge=True)
    except Exception as e:
        print(f"⚠️ Error actualizando sensor {device_id}: {e}")


# =========================
# INFLUXDB 3 CORE (acá van TODOS los números)
# =========================
influx = InfluxDBClient3(
    host=INFLUX_HOST,
    token=INFLUX_TOKEN,
    database=INFLUX_DATABASE,
)

# =========================
# CONFIG POR GRANO
# =========================
CONFIG_GRANOS = {
    "maiz": {"hum_max": 14, "temp_max": 25},
    "soja": {"hum_max": 13, "temp_max": 25},
    "trigo": {"hum_max": 14, "temp_max": 25},
    "girasol": {"hum_max": 10, "temp_max": 20},
    "cebada": {"hum_max": 14, "temp_max": 25},
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
# HISTORIAL CO2 (clave para detección de fermentación)
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
# MOTOR INTELIGENTE (evalúa riesgo con las lecturas actuales)
# =========================
def evaluar_riesgo(data, config):
    co2 = data["co2"]
    hum = data["hum"]
    temp = data["temp"]
    delta_co2 = data["delta_co2"]
    impacto = data["impacto"]

    score = 0
    evento = None

    # CO2 (síntoma principal)
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

    # HUMEDAD (depende del grano)
    if hum > 80:
        score += 25
    elif hum > config["hum_max"]:
        score += 15

    # TEMPERATURA
    if temp > 30:
        score += 25
    elif temp > config["temp_max"]:
        score += 15

    # IMPACTO (evento físico)
    if impacto:
        score += 20
        evento = "IMPACTO_FISICO"

    score = min(score, 100)  # tope 0-100 (consistente con la AI API y la web)

    # CLASIFICACIÓN
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
# ALERT COOLDOWN (evitar spam de actualizaciones al silo)
# =========================
# El cooldown aplica entre actualizaciones del MISMO estado. Si el estado
# cambia (OK → RIESGO_MEDIO → RIESGO_ALTO), se actualiza de inmediato.
last_alert_time = {}
last_alert_state = {}
COOLDOWN = 300

def puede_alertar(device_id, estado=None):
    now = time.time()

    estado_previo = last_alert_state.get(device_id)
    if estado is not None and estado != estado_previo:
        last_alert_state[device_id] = estado
        last_alert_time[device_id] = now
        return True

    if device_id not in last_alert_time:
        last_alert_time[device_id] = now
        return True

    if now - last_alert_time[device_id] > COOLDOWN:
        last_alert_time[device_id] = now
        return True

    return False

def actualizar_silo_firebase(owner_uid: str, silo_id: str, estado, alerta, score, evento, delta):
    """
    Actualiza el ESTADO del silo en Firebase (datos categóricos).

    NO guarda las lecturas numéricas (esas van a InfluxDB).
    Guarda: estado, alerta, score, evento, delta_co2, ultima_actualizacion.
    """
    if not FIREBASE_OK:
        return
    try:
        db.collection("users").document(owner_uid).collection("silos").document(silo_id).set({
            "estado": estado,
            "alerta": alerta,
            "score": score,
            "evento": evento,
            "delta_co2": float(delta),
            "ultima_actualizacion": firestore.SERVER_TIMESTAMP
        }, merge=True)
    except Exception as e:
        print(f"⚠️ Error actualizando silo {silo_id}: {e}")

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

        info = get_device_info(device_id)
        silo_id = info["silo_id"]
        owner_uid = info["owner_uid"]
        tipo_grano = info["grain_type"]

        config = CONFIG_GRANOS.get(tipo_grano, CONFIG_GRANOS["maiz"])

        co2 = safe_float(data.get("co2"))
        hum = safe_float(data.get("humedad") or data.get("humidity"))
        temp = safe_float(data.get("temperatura") or data.get("temperature"))
        acc = safe_float(data.get("aceleracion") or data.get("acceleration"))

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
        # 1. INFLUXDB (todas las lecturas numéricas van acá)
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

        influx.write(record=point)

        # =====================
        # 2. FIREBASE (solo datos categóricos / estado del sistema)
        # =====================
        # a) Marcar el sensor como activo + actualizar last_seen
        update_sensor_status(device_id)

        # b) Actualizar el estado del silo (con cooldown para no spamear)
        if owner_uid and silo_id != "unknown" and puede_alertar(device_id, estado):
            actualizar_silo_firebase(
                owner_uid, silo_id, estado, alerta, score, evento, delta
            )

        # =====================
        # LOGS
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
# START
# =========================
# Este script es un CONSUMIDOR de HiveMQ. El bridge TTN → HiveMQ es
# responsabilidad de TTN_MQTT.py (evita publicar cada lectura dos veces).
hive.connect(HIVEMQ_BROKER, HIVEMQ_PORT)

print("🚀 SISTEMA INTELIGENTE ACTIVO (HiveMQ → InfluxDB + Firebase)")
print("   → InfluxDB: lecturas numéricas (time-series)")
print("   → Firebase: estado de sensores y silos (datos categóricos)")
hive.loop_forever()
