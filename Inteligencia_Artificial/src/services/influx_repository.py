"""
AGRILION — InfluxDB 3 Core Repository
========================================

Implementa AbstractSiloRepository leyendo datos reales de InfluxDB 3 Core.

Se usa como alternativa a InMemoryRepository cuando se quieren obtener
datos reales de sensores para alimentar el chatbot y el dashboard.

Uso:
    from src.services.influx_repository import InfluxRepository

    repo = InfluxRepository(
        host="http://localhost:8181",
        token="tu_token",
        database="silobolsas"
    )

    # Como reemplazo del InMemoryRepository
    ai_service = AIService(
        preprocessor=...,
        lstm_model=...,
        risk_engine=...,
        alert_system=...,
        repository=repo,
    )

Requiere:
    pip install influxdb3-python
"""

import logging
import math
from datetime import datetime, timedelta
from typing import List, Optional

import pandas as pd

try:
    from influxdb_client_3 import InfluxDBClient3
except ImportError:
    InfluxDBClient3 = None

from src.services.ai_service import (
    AbstractSiloRepository,
    SensorReading,
    AIResult,
)

logger = logging.getLogger(__name__)

# Dispositivos/silos de prueba que no deben aparecer en el dashboard.
# InfluxDB 3 Core no soporta DELETE, así que se excluyen en las consultas.
EXCLUDED_DEVICES = {"test-device-001"}
EXCLUDED_SILOS = {"SB-TEST01"}


def _normalize_pressure(value) -> Optional[float]:
    """Normaliza presión a hPa y descarta valores inválidos.

    Algunos registros históricos quedaron con la presión en escala ×10
    (p. ej. 10108) antes de corregir el pipeline. Se normalizan al leer.
    """
    try:
        p = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(p) or p <= 0:
        return None
    if p > 2000:
        p /= 10.0
    return round(p, 1)


def _excluded_devices_sql() -> str:
    """Devuelve los device_id excluidos como lista SQL segura."""
    if not EXCLUDED_DEVICES:
        return "NULL"
    return ", ".join("'" + d.replace("'", "''") + "'" for d in sorted(EXCLUDED_DEVICES))


def _iso_utc(value) -> str:
    """Convierte un timestamp de InfluxDB a ISO-8601 UTC (con Z).

    InfluxDB devuelve los timestamps sin zona; el navegador los interpretaba
    como hora local y el dashboard mostraba las lecturas 3 h adelantadas.
    """
    try:
        ts = pd.Timestamp(value)
        if ts.tzinfo is None:
            ts = ts.tz_localize("UTC")
        return ts.isoformat().replace("+00:00", "Z")
    except Exception:
        return str(value)


class InfluxRepository(AbstractSiloRepository):
    """
    Repository backed by InfluxDB.

    Espera que los datos estén escritos en la measurement 'sensores'
    con los tags 'device' y 'silo', y los fields:
        - temperatura (°C)
        - humedad (%)
        - co2 (ppm)

    Esto es consistente con MQTT_INFLUXDB_FIREBASE.py.
    """

    def __init__(
        self,
        host: str,
        token: str,
        database: str = "silobolsas",
        measurement: str = "sensores",
    ):
        if InfluxDBClient3 is None:
            raise ImportError(
                "influxdb3-python no está instalado. "
                "Ejecutá: pip install influxdb3-python"
            )

        self._client = InfluxDBClient3(
            host=host,
            token=token,
            database=database,
        )
        self._database = database
        self._measurement = measurement

        # Verificar conexión (InfluxDB 3 usa un ping simple)
        try:
            # Ejecutar una query de prueba para verificar conexión
            self._client.query("SELECT 1")
            logger.info(f"✅ InfluxDB 3 Core conectado: {host}")
        except Exception as e:
            logger.error(f"❌ No se pudo conectar a InfluxDB 3 Core: {e}")
            raise

    def get_recent_readings(
        self, silo_id: str, n: int = 50
    ) -> pd.DataFrame:
        """
        Obtener las últimas N lecturas de un silo desde InfluxDB 3 Core.
        Usa SQL en lugar de Flux.
        """
        query = f"""
        SELECT time, silo, temperatura, humedad, co2, presion
        FROM "{self._measurement}"
        WHERE silo = '{silo_id}'
          AND time >= NOW() - INTERVAL '7 days'
        ORDER BY time DESC
        LIMIT {n}
        """

        try:
            table = self._client.query(query)
            df = table.to_pandas()

            if df.empty:
                return pd.DataFrame()

            # Renombrar columnas y preparar el DataFrame
            df = df.rename(columns={
                "time": "timestamp",
                "temperatura": "temperature",
                "humedad": "humidity",
                "presion": "pressure",
            })
            df["silo_id"] = silo_id
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df = df.set_index("timestamp").sort_index()

            # Mantener solo las columnas relevantes
            cols = ["temperature", "humidity", "co2", "pressure", "silo_id"]
            available_cols = [c for c in cols if c in df.columns]
            return df[available_cols]

        except Exception as e:
            logger.error(f"Error consultando InfluxDB 3 Core: {e}")
            return pd.DataFrame()

    def save_reading(self, reading: SensorReading) -> bool:
        """
        Guardar lectura (actualmente no-write; los datos vienen de MQTT_INFLUXDB_FIREBASE.py).
        """
        logger.debug(f"InfluxRepository.save_reading() es read-only; no se escribe.")
        return True

    def save_result(self, result: AIResult) -> bool:
        """No implementado: los resultados de la AI no se guardan en InfluxDB."""
        return True

    def get_result_history(
        self, silo_id: str, hours: int = 24
    ) -> List[dict]:
        """Los resultados de la AI no se guardan en InfluxDB."""
        return []

    # ─── Endpoints públicos para el frontend ──────────────────────────────────

    def get_silo_overview(self) -> List[dict]:
        """
        Devuelve el estado actual de todos los silos.

        Para cada silo, obtiene la última lectura y calcula score de riesgo.
        En InfluxDB 3 Core se usa SQL con DISTINCT ON (DataFusion).
        """
        # Traemos la última lectura conocida de cada silo (hasta 7 días).
        # Así el dashboard sigue mostrando el último dato aunque el sensor
        # esté temporalmente offline, con su timestamp real.
        query = f"""
        SELECT s.time, s.silo, s.grano, s.device, s.temperatura, s.humedad, s.co2, s.presion, s.score
        FROM "{self._measurement}" s
        INNER JOIN (
            SELECT silo, MAX(time) AS max_time
            FROM "{self._measurement}"
            WHERE time >= NOW() - INTERVAL '7 days'
            GROUP BY silo
        ) latest ON s.silo = latest.silo AND s.time = latest.max_time
        WHERE s.device NOT IN ({_excluded_devices_sql()})
        ORDER BY s.silo
        """

        try:
            table = self._client.query(query)
            df = table.to_pandas()
            silos = []

            for _, row in df.iterrows():
                silo_id = row.get("silo", "unknown")
                temp = float(row.get("temperatura", 0))
                hum = float(row.get("humedad", 0))
                co2 = float(row.get("co2", 0))
                # Se usa el score simple (umbrales ambientales) para que el
                # dashboard y el chatbot sean consistentes. El score guardado
                # por el backend puede incluir delta_CO2/impacto y desviarse.
                score = self._calculate_simple_risk(temp, hum, co2)
                level = self._score_to_level(score)

                grain = row.get("grano")
                device = row.get("device")

                pressure = _normalize_pressure(row.get("presion"))

                silos.append({
                    "silo_id": str(silo_id),
                    "temperature": round(temp, 1),
                    "humidity": round(hum, 1),
                    "co2": round(co2, 1),
                    "pressure": pressure,
                    "risk_score": score,
                    "risk_level": level,
                    "last_update": _iso_utc(row.get("time", "")),
                    "grain_type": str(grain) if pd.notna(grain) else None,
                    "device_id": str(device) if pd.notna(device) else None,
                })

            return silos

        except Exception as e:
            logger.error(f"Error en get_silo_overview: {e}")
            return []

    def get_silo_history(
        self, silo_id: str, hours: int = 24
    ) -> List[dict]:
        """
        Devuelve el historial de un silo en las últimas N horas.
        En InfluxDB 3 Core usa date_bin() para agrupar en ventanas de 1 minuto.
        """
        if silo_id in EXCLUDED_SILOS:
            return []

        query = f"""
        SELECT
            date_bin('1 minute', time, TIMESTAMP '1970-01-01 00:00:00') AS time,
            AVG(temperatura) AS temperatura,
            AVG(humedad) AS humedad,
            AVG(co2) AS co2,
            AVG(presion) AS presion
        FROM "{self._measurement}"
        WHERE silo = '{silo_id}'
          AND time >= NOW() - INTERVAL '{hours} hours'
        GROUP BY date_bin('1 minute', time, TIMESTAMP '1970-01-01 00:00:00')
        ORDER BY 1
        """

        try:
            table = self._client.query(query)
            df = table.to_pandas()
            history = []

            for _, row in df.iterrows():
                history.append({
                    "timestamp": _iso_utc(row.get("time", "")),
                    "temperature": round(float(row.get("temperatura", 0)), 1),
                    "humidity": round(float(row.get("humedad", 0)), 1),
                    "co2": round(float(row.get("co2", 0)), 1),
                    "pressure": _normalize_pressure(row.get("presion")),
                })

            return history

        except Exception as e:
            logger.error(f"Error en get_silo_history: {e}")
            return []

    # ─── Helpers ──────────────────────────────────────────────────────────────

    def _calculate_simple_risk(self, temp: float, hum: float, co2: float) -> int:
        """Score de riesgo simple (0-100) basado en umbrales."""
        score = 0

        if temp > 35:
            score += 25
        elif temp > 30:
            score += 15
        elif temp > 25:
            score += 5

        if hum > 80:
            score += 25
        elif hum > 70:
            score += 15
        elif hum > 60:
            score += 5

        if co2 > 1500:
            score += 30
        elif co2 > 1200:
            score += 25
        elif co2 > 600:
            score += 15

        return min(score, 100)

    def _score_to_level(self, score: int) -> str:
        if score >= 70:
            return "CRITICAL"
        elif score >= 30:
            return "WARNING"
        else:
            return "NORMAL"

    def close(self):
        """Cerrar la conexión con InfluxDB."""
        if self._client:
            self._client.close()
            logger.info("Conexión InfluxDB cerrada")


def create_repository_from_env() -> Optional[InfluxRepository]:
    """
    Crear InfluxRepository usando variables de entorno.
    Devuelve None si las variables no están configuradas.
    """
    import os

    host = os.getenv("INFLUX_HOST", os.getenv("INFLUX_URL"))
    token = os.getenv("INFLUX_TOKEN")
    database = os.getenv("INFLUX_DATABASE", os.getenv("INFLUX_BUCKET", "silobolsas"))

    if not all([host, token]):
        logger.info(
            "Variables de InfluxDB no configuradas. "
            "Usando InMemoryRepository."
        )
        return None

    try:
        return InfluxRepository(host=host, token=token, database=database)
    except Exception as e:
        logger.error(f"No se pudo crear InfluxRepository: {e}")
        return None
