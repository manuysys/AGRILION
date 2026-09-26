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
        SELECT time, silo, temperatura, humedad, co2
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
            })
            df["silo_id"] = silo_id
            df["timestamp"] = pd.to_datetime(df["timestamp"])
            df = df.set_index("timestamp").sort_index()

            # Mantener solo las columnas relevantes
            cols = ["temperature", "humidity", "co2", "silo_id"]
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
        # Traemos las últimas lecturas de cada silo en la última hora
        # Usamos una subquery para obtener el último timestamp por silo
        query = f"""
        SELECT s.time, s.silo, s.grano, s.device, s.temperatura, s.humedad, s.co2, s.score
        FROM "{self._measurement}" s
        INNER JOIN (
            SELECT silo, MAX(time) AS max_time
            FROM "{self._measurement}"
            WHERE time >= NOW() - INTERVAL '1 hour'
            GROUP BY silo
        ) latest ON s.silo = latest.silo AND s.time = latest.max_time
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
                score_raw = row.get("score")
                score = int(score_raw) if pd.notna(score_raw) else self._calculate_simple_risk(temp, hum, co2)

                level = self._score_to_level(score)

                grain = row.get("grano")
                device = row.get("device")

                silos.append({
                    "silo_id": str(silo_id),
                    "temperature": round(temp, 1),
                    "humidity": round(hum, 1),
                    "co2": round(co2, 1),
                    "risk_score": score,
                    "risk_level": level,
                    "last_update": str(row.get("time", "")),
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
        En InfluxDB 3 Core usa date_bin() para agrupar en ventanas de 15 minutos.
        """
        query = f"""
        SELECT
            date_bin('15 minutes', time, TIMESTAMP '1970-01-01 00:00:00') AS time,
            AVG(temperatura) AS temperatura,
            AVG(humedad) AS humedad,
            AVG(co2) AS co2
        FROM "{self._measurement}"
        WHERE silo = '{silo_id}'
          AND time >= NOW() - INTERVAL '{hours} hours'
        GROUP BY time
        ORDER BY time
        """

        try:
            table = self._client.query(query)
            df = table.to_pandas()
            history = []

            for _, row in df.iterrows():
                history.append({
                    "timestamp": str(row.get("time", "")),
                    "temperature": round(float(row.get("temperatura", 0)), 1),
                    "humidity": round(float(row.get("humedad", 0)), 1),
                    "co2": round(float(row.get("co2", 0)), 1),
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

        if co2 > 1200:
            score += 30
        elif co2 > 800:
            score += 20
        elif co2 > 600:
            score += 10

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
