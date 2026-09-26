"""
AGRILION — Registro de dispositivos (device_id → silo)
=======================================================

Resuelve a qué silo pertenece un sensor a partir de su `device_id` de TTN.

Orden de resolución:
    1. Caché en memoria (TTL configurable, default 300s)
    2. Firestore: sensors/{device_id}  (esquema nuevo)
       Fallback:  devices/{device_id}  (esquema legacy)
    3. Fallback local: variables DEFAULT_SILO_ID / DEFAULT_GRAIN del .env
       (o el propio device_id como silo)

Se usa desde MQTT_INFLUXDB_FIREBASE.py y mqtt_to_ai_bridge.py para que
ambos scripts escriban el MISMO `silo_id` en InfluxDB y en la AI API.

Uso:
    from device_registry import get_device_info, get_firestore_db

    info = get_device_info("smisia-cubecellab02s")
    # {"silo_id": "SB-12345", "owner_uid": "...", "grain_type": "soja",
    #  "source": "firestore" | "fallback"}
"""

import logging
import os
import time
from typing import Optional

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase-admin no instalado. Se usará DEFAULT_SILO_ID del .env")

_DB = None
_DB_INIT_TRIED = False
_CACHE: dict[str, dict] = {}

_CACHE_TTL = int(os.getenv("DEVICE_CACHE_TTL", "300"))


def get_firestore_db():
    """
    Inicializa (una sola vez) Firebase Admin y devuelve el cliente de Firestore.
    Devuelve None si no hay credenciales o firebase-admin no está instalado.
    """
    global _DB, _DB_INIT_TRIED

    if _DB_INIT_TRIED:
        return _DB
    _DB_INIT_TRIED = True

    if not FIREBASE_AVAILABLE:
        return None

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase/serviceAccountKey.json")
    try:
        if not firebase_admin._apps:
            firebase_admin.initialize_app(credentials.Certificate(cred_path))
        _DB = firestore.client()
        logger.info(f"✅ Firebase inicializado para lookup de sensores ({cred_path})")
    except Exception as e:
        logger.warning(
            f"⚠️ Firebase no disponible ({e}). "
            f"Se usará DEFAULT_SILO_ID={os.getenv('DEFAULT_SILO_ID', '<device_id>')}"
        )
        _DB = None

    return _DB


def _fetch_from_firestore(device_id: str) -> Optional[dict]:
    db = get_firestore_db()
    if db is None:
        return None

    try:
        doc = db.collection("sensors").document(device_id).get()
        if not doc.exists:
            doc = db.collection("devices").document(device_id).get()
        if not doc.exists:
            return None

        data = doc.to_dict() or {}
        return {
            "silo_id": data.get("siloId") or data.get("silo_id") or device_id,
            "owner_uid": data.get("ownerUid") or data.get("owner_uid"),
            "grain_type": (
                data.get("grainType")
                or data.get("tipo_grano")
                or os.getenv("DEFAULT_GRAIN", "maiz")
            ),
            "source": "firestore",
        }
    except Exception as e:
        logger.warning(f"⚠️ Error consultando Firestore para {device_id}: {e}")
        return None


def get_device_info(device_id: str, force_refresh: bool = False) -> dict:
    """
    Devuelve la info de un dispositivo cacheada con TTL.
    Nunca devuelve None: si no está registrado, usa el fallback local.
    """
    now = time.time()
    cached = _CACHE.get(device_id)

    if cached and not force_refresh and (now - cached["ts"]) < _CACHE_TTL:
        return cached["data"]

    info = _fetch_from_firestore(device_id)

    if info is None:
        info = {
            "silo_id": os.getenv("DEFAULT_SILO_ID") or device_id,
            "owner_uid": None,
            "grain_type": os.getenv("DEFAULT_GRAIN", "maiz"),
            "source": "fallback",
        }
        logger.info(
            f"ℹ️ Sensor {device_id} no registrado en Firestore → "
            f"usando silo '{info['silo_id']}' (DEFAULT_SILO_ID)"
        )

    _CACHE[device_id] = {"data": info, "ts": now}
    return info
