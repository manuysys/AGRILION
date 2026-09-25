"""
AGRILION — MQTT → AI API Bridge
==================================

Puente entre HiveMQ y la AI API de Python.
Cada lectura que llega por MQTT se envía al endpoint /api/v1/ingest
para que el modelo LSTM la procese en tiempo real.

Ejecutar junto con TTN_MQTT.py y MQTT_INFLUXDB_FIREBASE.py:

    python TTN_MQTT.py                    # Terminal 1
    python MQTT_INFLUXDB_FIREBASE.py      # Terminal 2
    python mqtt_to_ai_bridge.py           # Terminal 3

Requiere:
    pip install paho-mqtt requests python-dotenv
"""

import json
import ssl
import os
import time
import logging
import threading
from datetime import datetime
from dotenv import load_dotenv
from paho.mqtt import client as mqtt_client
import requests

# =========================
# LOGGING
# =========================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mqtt_to_ai_bridge")

# =========================
# LOAD ENV
# =========================
load_dotenv()

# HiveMQ
HIVEMQ_BROKER = os.getenv("HIVEMQ_BROKER")
HIVEMQ_PORT = int(os.getenv("HIVEMQ_PORT", "8883"))
HIVEMQ_USER = os.getenv("HIVEMQ_USER")
HIVEMQ_PASS = os.getenv("HIVEMQ_PASS")

TOPIC = "smisia/#"

# AI API
AI_API_URL = os.getenv("AI_API_URL", "http://localhost:8000/api/v1")
AI_API_TIMEOUT = int(os.getenv("AI_API_TIMEOUT", "10"))

# =========================
# DEVICE → SILO MAPPING (cache)
# =========================
device_silo_map: dict[str, str] = {}


def load_device_mapping(device_id: str) -> str | None:
    """
    Obtener el silo_id asociado a un device_id.

    Estrategia actual: usa una convención de nombres.
    Los devices de TTN se nombran como "eui-xxxxxxxx" y se mapean
    a silos en Firestore. Para simplificar, usamos un fallback.

    En producción, esto debería consultar Firebase o un config file.
    """
    if device_id in device_silo_map:
        return device_silo_map[device_id]

    # Fallback: mapeo simple basado en el device_id
    # Podés personalizar esto con tu mapping real
    silo_id = f"SILO_{device_id[-4:].upper()}"
    device_silo_map[device_id] = silo_id
    logger.debug(f"Mapped {device_id} → {silo_id}")
    return silo_id


# =========================
# AI API CLIENT
# =========================
def send_to_ai_api(payload: dict) -> dict | None:
    """
    Enviar lectura al endpoint /ingest de la AI API.

    Args:
        payload: dict con keys: silo_id, temperature, humidity, co2

    Returns:
        Response JSON de la API, o None si falla.
    """
    url = f"{AI_API_URL}/ingest"

    try:
        response = requests.post(
            url,
            json=payload,
            timeout=AI_API_TIMEOUT,
            headers={"Content-Type": "application/json"},
        )

        if response.status_code == 200:
            result = response.json()
            logger.info(
                f"✅ AI API OK | {payload['silo_id']} | "
                f"Risk: {result.get('risk_score', '?')}/100 "
                f"({result.get('risk_level', '?')})"
            )
            return result
        else:
            logger.warning(
                f"⚠️ AI API {response.status_code} | {payload['silo_id']}: "
                f"{response.text[:100]}"
            )
            return None

    except requests.exceptions.ConnectionError:
        logger.error(f"❌ AI API no disponible en {AI_API_URL}")
        return None
    except requests.exceptions.Timeout:
        logger.error(f"❌ AI API timeout ({AI_API_TIMEOUT}s)")
        return None
    except Exception as e:
        logger.error(f"❌ AI API error: {e}")
        return None


def safe_float(v) -> float:
    """Convertir a float de forma segura."""
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


# =========================
# MQTT CALLBACK
# =========================
def on_message(client, userdata, msg):
    """Procesar mensaje MQTT y enviarlo a la AI API."""
    try:
        data = json.loads(msg.payload.decode())
        device_id = data.get("device_id")

        if not device_id:
            logger.warning("Mensaje sin device_id, ignorando")
            return

        # Extraer valores de sensores
        # Los nombres de campos pueden variar según el firmware del CubeCell
        co2 = safe_float(data.get("co2", data.get("CO2", 0)))
        humidity = safe_float(data.get("humedad", data.get("humidity", data.get("hum", 0))))
        temperature = safe_float(data.get("temperatura", data.get("temperature", data.get("temp", 0))))

        # Mapear device a silo
        silo_id = load_device_mapping(device_id)

        # Construir payload para la AI API
        ai_payload = {
            "silo_id": silo_id,
            "temperature": temperature,
            "humidity": humidity,
            "co2": co2,
            "timestamp": datetime.now().isoformat(),
        }

        logger.info(
            f"📨 {device_id} → {silo_id} | "
            f"T:{temperature}°C H:{humidity}% CO2:{co2}ppm"
        )

        # Enviar a la AI API (en thread separado para no bloquear MQTT)
        thread = threading.Thread(
            target=send_to_ai_api,
            args=(ai_payload,),
            daemon=True,
        )
        thread.start()

    except json.JSONDecodeError:
        logger.error(f"JSON inválido en {msg.topic}")
    except Exception as e:
        logger.error(f"Error procesando mensaje: {e}")


# =========================
# MQTT CONNECTION
# =========================
def on_connect(client, userdata, flags, reason_code, properties):
    if reason_code == 0:
        logger.info(f"✅ Conectado a HiveMQ ({HIVEMQ_BROKER})")
        client.subscribe(TOPIC)
        logger.info(f"📡 Suscripto a: {TOPIC}")
    else:
        logger.error(f"❌ Error conexión HiveMQ: {reason_code}")


def on_disconnect(client, userdata, reason_code, properties):
    logger.warning(f"⚠️ Desconectado de HiveMQ (código: {reason_code})")
    logger.info("Intentando reconectar...")


# =========================
# MAIN
# =========================
def main():
    logger.info("=" * 50)
    logger.info("🚀 AGRILION MQTT → AI API Bridge")
    logger.info("=" * 50)
    logger.info(f"  HiveMQ:   {HIVEMQ_BROKER}:{HIVEMQ_PORT}")
    logger.info(f"  Topic:    {TOPIC}")
    logger.info(f"  AI API:   {AI_API_URL}")
    logger.info("=" * 50)

    # Crear cliente MQTT
    client = mqtt_client.Client(mqtt_client.CallbackAPIVersion.VERSION2)
    client.username_pw_set(HIVEMQ_USER, HIVEMQ_PASS)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    # Conectar con retry
    max_retries = 5
    for attempt in range(1, max_retries + 1):
        try:
            client.connect(HIVEMQ_BROKER, HIVEMQ_PORT)
            break
        except Exception as e:
            logger.error(f"Intento {attempt}/{max_retries} fallido: {e}")
            if attempt < max_retries:
                time.sleep(5)
            else:
                logger.error("No se pudo conectar a HiveMQ después de 5 intentos")
                return

    logger.info("🔄 Esperando mensajes de sensores...")
    client.loop_forever()


if __name__ == "__main__":
    main()
