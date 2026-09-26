"""
AGRILION — Firebase Service
============================

Gestiona datos CATEGÓRICOS del sistema (NO lecturas numéricas de sensores).

Esquema Firestore:
------------------
users/{uid}
  ├── email: str
  ├── name: str
  ├── phone: str (optional)
  ├── company: str (optional)
  ├── createdAt: Timestamp
  └── role: "admin" | "user"

users/{uid}/silos/{silo_id}
  ├── name: str
  ├── grainType: str (maíz, soja, trigo, girasol, cebada)
  ├── location: str (GPS coordinates or text)
  ├── tons: float
  ├── createdAt: Timestamp
  └── ownerId: str (uid)

users/{uid}/silos/{silo_id}/sensors/{sensor_id}
  ├── deviceId: str (TTN device ID)
  ├── active: bool (está prendido o apagado)
  ├── battery: int (0-100)
  ├── lastSeen: Timestamp
  └── installedAt: Timestamp

sensors/{device_id}  (colección global para lookup rápido)
  ├── ownerUid: str
  ├── siloId: str
  ├── siloPath: str (full Firestore path)
  ├── active: bool
  └── lastSeen: Timestamp

Alertas (opcionales, también en Firestore):
-------------------------------------------
users/{uid}/alerts/{alert_id}
  ├── siloId: str
  ├── level: "critical" | "high" | "medium" | "low" | "info"
  ├── title: str
  ├── message: str
  ├── recommendation: str
  ├── timestamp: Timestamp
  └── acknowledged: bool
"""

import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from pathlib import Path

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, auth, exceptions as firebase_exceptions
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    logger.warning("firebase-admin no instalado. Instalalo con: pip install firebase-admin")


class FirebaseService:
    """
    Servicio de datos categóricas de Agrilion sobre Firebase.

    Uso:
        fb = FirebaseService()

        # Auth
        user = fb.register_user(email, password, name="Juan")
        user = fb.login_user(email, password)  # Nota: Firebase Auth no tiene password check server-side

        # Silos
        silo_id = fb.create_silo(user_uid, name="Silo Norte", grain_type="soja", location="Lote 5", tons=120)
        silos = fb.get_user_silos(user_uid)

        # Sensores
        sensor_id = fb.register_sensor(user_uid, silo_id, device_id="cubecell-001")
        fb.update_sensor_status(device_id, active=True)

        # Lookup global
        info = fb.get_sensor_info("cubecell-001")  # devuelve owner, silo, estado
    """

    def __init__(self, credentials_path: Optional[str] = None):
        if not FIREBASE_AVAILABLE:
            raise RuntimeError("firebase-admin no está instalado")

        self._initialized = False
        self._db = None
        self._credentials_path = credentials_path or os.getenv(
            "FIREBASE_CREDENTIALS_PATH", "firebase/serviceAccountKey.json"
        )
        self._init_firebase()

    def _init_firebase(self):
        """Inicializa la app de Firebase (singleton)."""
        if firebase_admin._apps:
            # Ya inicializada (por otro módulo, p.ej. MQTT_INFLUXDB_FIREBASE.py)
            self._db = firestore.client()
            self._initialized = True
            logger.info("✅ Firebase: reutilizando app existente")
            return

        cred_path = Path(self._credentials_path)
        if not cred_path.exists():
            logger.warning(
                f"⚠️ No se encontró {cred_path}. "
                "Firebase Service en modo NO-OP. "
                "Descargá serviceAccountKey.json desde Firebase Console → Project Settings → Service accounts."
            )
            return

        try:
            cred = credentials.Certificate(str(cred_path))
            firebase_admin.initialize_app(cred)
            self._db = firestore.client()
            self._initialized = True
            logger.info("✅ Firebase Service inicializado")
        except Exception as e:
            logger.error(f"❌ Error inicializando Firebase: {e}")

    @property
    def is_available(self) -> bool:
        return self._initialized and self._db is not None

    # ─── AUTH (Firebase Authentication) ──────────────────────────────────────

    def register_user(
        self,
        email: str,
        password: str,
        name: str = "",
        phone: str = "",
        company: str = "",
    ) -> Dict[str, Any]:
        """
        Registra un nuevo usuario en Firebase Auth y crea su perfil en Firestore.

        Devuelve un dict con: uid, email, name, createdAt.
        """
        if not self.is_available:
            raise RuntimeError("Firebase no disponible")

        try:
            # Crear usuario en Auth
            user_record = auth.create_user(
                email=email,
                password=password,
                display_name=name or None,
                phone_number=phone or None,
            )

            # Crear perfil en Firestore
            user_data = {
                "email": email,
                "name": name,
                "phone": phone,
                "company": company,
                "createdAt": firestore.SERVER_TIMESTAMP,
                "role": "user",
            }
            self._db.collection("users").document(user_record.uid).set(user_data)

            logger.info(f"✅ Usuario registrado: {email} (uid={user_record.uid})")
            return {
                "uid": user_record.uid,
                "email": user_record.email,
                "name": user_record.display_name or name,
                "createdAt": datetime.now().isoformat(),
            }

        except firebase_exceptions.FirebaseError as e:
            logger.error(f"❌ Error registrando usuario: {e}")
            raise

    def get_user_profile(self, uid: str) -> Optional[Dict[str, Any]]:
        """Obtiene el perfil de un usuario desde Firestore."""
        if not self.is_available:
            return None
        doc = self._db.collection("users").document(uid).get()
        if not doc.exists:
            return None
        return doc.to_dict()

    def verify_id_token(self, id_token: str) -> Dict[str, Any]:
        """
        Verifica un Firebase ID token y devuelve la info del usuario.
        Útil para autenticación desde la app/web: el cliente envía el ID token,
        el backend lo verifica y obtiene el uid.
        """
        if not self.is_available:
            raise RuntimeError("Firebase no disponible")
        decoded = auth.verify_id_token(id_token)
        return decoded

    # ─── SILOS (Silobolsas) ──────────────────────────────────────────────────

    def create_silo(
        self,
        owner_uid: str,
        name: str,
        grain_type: str,
        location: str = "",
        tons: float = 0.0,
        silo_id: Optional[str] = None,
    ) -> str:
        """
        Crea una nueva silobolsa para un usuario.

        Devuelve el silo_id generado (o el provisto).
        """
        if not self.is_available:
            raise RuntimeError("Firebase no disponible")

        if not silo_id:
            # Generar ID tipo "SB-XXXX" con timestamp
            silo_id = f"SB-{int(datetime.now().timestamp()) % 100000:05d}"

        silo_data = {
            "name": name,
            "grainType": grain_type,
            "location": location,
            "tons": float(tons),
            "createdAt": firestore.SERVER_TIMESTAMP,
            "ownerId": owner_uid,
        }

        silo_ref = (
            self._db.collection("users")
            .document(owner_uid)
            .collection("silos")
            .document(silo_id)
        )
        silo_ref.set(silo_data)
        logger.info(f"✅ Silo creado: {silo_id} para usuario {owner_uid}")
        return silo_id

    def get_user_silos(self, owner_uid: str) -> List[Dict[str, Any]]:
        """Devuelve todos los silos de un usuario."""
        if not self.is_available:
            return []

        silos_ref = (
            self._db.collection("users")
            .document(owner_uid)
            .collection("silos")
        )
        silos = []
        for doc in silos_ref.stream():
            data = doc.to_dict()
            data["silo_id"] = doc.id
            # Agregar info de sensores
            sensors = self._get_silo_sensors(owner_uid, doc.id)
            data["sensors"] = sensors
            data["activeSensors"] = sum(1 for s in sensors if s.get("active", False))
            silos.append(data)

        return silos

    def get_silo(self, owner_uid: str, silo_id: str) -> Optional[Dict[str, Any]]:
        """Devuelve un silo específico."""
        if not self.is_available:
            return None
        doc = (
            self._db.collection("users")
            .document(owner_uid)
            .collection("silos")
            .document(silo_id)
        ).get()
        if not doc.exists:
            return None
        data = doc.to_dict()
        data["silo_id"] = doc.id
        data["sensors"] = self._get_silo_sensors(owner_uid, silo_id)
        return data

    def update_silo(self, owner_uid: str, silo_id: str, updates: Dict[str, Any]):
        """Actualiza campos de un silo."""
        if not self.is_available:
            return
        (
            self._db.collection("users")
            .document(owner_uid)
            .collection("silos")
            .document(silo_id)
        ).set(updates, merge=True)

    # ─── SENSORES ────────────────────────────────────────────────────────────

    def register_sensor(
        self,
        owner_uid: str,
        silo_id: str,
        device_id: str,
        battery: int = 100,
    ) -> str:
        """
        Registra un sensor y lo asocia a un silo.

        Crea entradas en:
        - users/{uid}/silos/{siloId}/sensors/{sensorId}
        - sensors/{deviceId} (lookup global)
        """
        if not self.is_available:
            raise RuntimeError("Firebase no disponible")

        # Tipo de grano del silo (para umbrales del motor de riesgo)
        grain_type = ""
        try:
            silo_doc = (
                self._db.collection("users")
                .document(owner_uid)
                .collection("silos")
                .document(silo_id)
                .get()
            )
            if silo_doc.exists:
                grain_type = (silo_doc.to_dict() or {}).get("grainType", "") or ""
        except Exception:
            pass

        sensor_data = {
            "deviceId": device_id,
            "active": True,
            "battery": int(battery),
            "grainType": grain_type,
            "installedAt": firestore.SERVER_TIMESTAMP,
            "lastSeen": firestore.SERVER_TIMESTAMP,
        }

        # Subcolección del silo
        (
            self._db.collection("users")
            .document(owner_uid)
            .collection("silos")
            .document(silo_id)
            .collection("sensors")
            .document(device_id)
        ).set(sensor_data)

        # Colección global para lookup rápido por device_id
        silo_path = f"users/{owner_uid}/silos/{silo_id}"
        (
            self._db.collection("sensors")
            .document(device_id)
        ).set({
            "ownerUid": owner_uid,
            "siloId": silo_id,
            "siloPath": silo_path,
            "grainType": grain_type,
            "active": True,
            "lastSeen": firestore.SERVER_TIMESTAMP,
        })

        logger.info(f"✅ Sensor {device_id} registrado en silo {silo_id}")
        return device_id

    def update_sensor_status(
        self,
        device_id: str,
        active: Optional[bool] = None,
        battery: Optional[int] = None,
        update_last_seen: bool = True,
    ):
        """
        Actualiza el estado de un sensor (prendido/apagado, batería, last_seen).

        Se llama desde MQTT_INFLUXDB_FIREBASE.py cuando llega una lectura.
        """
        if not self.is_available:
            return

        updates: Dict[str, Any] = {}
        if active is not None:
            updates["active"] = active
        if battery is not None:
            updates["battery"] = int(battery)
        if update_last_seen:
            updates["lastSeen"] = firestore.SERVER_TIMESTAMP

        if not updates:
            return

        # Actualizar en colección global
        self._db.collection("sensors").document(device_id).set(updates, merge=True)

        # Actualizar también en la subcolección del silo (si existe)
        info = self.get_sensor_info(device_id)
        if info and info.get("ownerUid") and info.get("siloId"):
            (
                self._db.collection("users")
                .document(info["ownerUid"])
                .collection("silos")
                .document(info["siloId"])
                .collection("sensors")
                .document(device_id)
            ).set(updates, merge=True)

    def get_sensor_info(self, device_id: str) -> Optional[Dict[str, Any]]:
        """
        Obtiene info de un sensor desde la colección global.
        Útil para el script de MQTT que recibe lecturas por device_id.
        """
        if not self.is_available:
            return None
        doc = self._db.collection("sensors").document(device_id).get()
        if not doc.exists:
            return None
        return doc.to_dict()

    def _get_silo_sensors(self, owner_uid: str, silo_id: str) -> List[Dict[str, Any]]:
        """Devuelve los sensores de un silo."""
        sensors_ref = (
            self._db.collection("users")
            .document(owner_uid)
            .collection("silos")
            .document(silo_id)
            .collection("sensors")
        )
        sensors = []
        for doc in sensors_ref.stream():
            data = doc.to_dict()
            data["sensor_id"] = doc.id
            sensors.append(data)
        return sensors

    # ─── ALERTAS ─────────────────────────────────────────────────────────────

    def create_alert(
        self,
        owner_uid: str,
        silo_id: str,
        level: str,
        title: str,
        message: str,
        recommendation: str = "",
    ) -> str:
        """Crea una alerta en Firestore."""
        if not self.is_available:
            raise RuntimeError("Firebase no disponible")

        import hashlib
        alert_id = hashlib.md5(
            f"{silo_id}:{level}:{title}:{datetime.now().isoformat()}".encode()
        ).hexdigest()[:12]

        alert_data = {
            "siloId": silo_id,
            "level": level,
            "title": title,
            "message": message,
            "recommendation": recommendation,
            "timestamp": firestore.SERVER_TIMESTAMP,
            "acknowledged": False,
        }

        (
            self._db.collection("users")
            .document(owner_uid)
            .collection("alerts")
            .document(alert_id)
        ).set(alert_data)

        return alert_id

    def get_user_alerts(
        self, owner_uid: str, acknowledged: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Devuelve las alertas de un usuario."""
        if not self.is_available:
            return []

        query = self._db.collection("users").document(owner_uid).collection("alerts")
        if acknowledged is not None:
            query = query.where("acknowledged", "==", acknowledged)

        alerts = []
        for doc in query.stream():
            data = doc.to_dict()
            data["alert_id"] = doc.id
            alerts.append(data)

        # Ordenar por timestamp descendente
        alerts.sort(key=lambda x: x.get("timestamp", datetime.min), reverse=True)
        return alerts

    def acknowledge_alert(self, owner_uid: str, alert_id: str):
        """Marca una alerta como reconocida."""
        if not self.is_available:
            return
        (
            self._db.collection("users")
            .document(owner_uid)
            .collection("alerts")
            .document(alert_id)
        ).set({"acknowledged": True}, merge=True)


# ─── Singleton factory ───────────────────────────────────────────────────────

_firebase_service: Optional[FirebaseService] = None


def get_firebase_service() -> Optional[FirebaseService]:
    """Devuelve el singleton de FirebaseService, o None si no está disponible."""
    global _firebase_service
    if _firebase_service is None:
        try:
            _firebase_service = FirebaseService()
        except Exception as e:
            logger.warning(f"Firebase Service no disponible: {e}")
            return None
    return _firebase_service if _firebase_service.is_available else None
