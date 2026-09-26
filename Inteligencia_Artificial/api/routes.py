"""
AGRILION — API Routes
========================

Endpoints REST para integración del sistema ML de AGRILION:
- /predict → Predicción de valores futuros
- /analyze → Análisis completo (anomalías + riesgo + alertas)
- /health → Health check
- /model/status → Estado del modelo
"""

import numpy as np
import pandas as pd
from datetime import datetime
from typing import Optional
from pathlib import Path
import logging

from fastapi import APIRouter, HTTPException

from .schemas import (
    PredictionRequest,
    PredictionResponse,
    PredictionResult,
    AnalysisRequest,
    AnalysisResponse,
    AnomalyResult,
    AlertResult,
    RiskResult,
    HealthResponse,
    ModelStatusResponse,
    IngestRequest,
    IngestResponse,
    ChatRequest,
    ChatResponse,
    SiloOverviewItem,
    SilosOverviewResponse,
    SiloHistoryItem,
    SiloHistoryResponse,
)

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))
from src import __version__
from src.config import DEFAULT_MODEL_PATH, SCALER_PATH, LSTM_CONFIG, SENSOR_COLUMNS
from src.lstm_model import AgrilionLSTM
from src.preprocessing import DataPreprocessor
from src.predictor import Predictor
from src.anomaly_detection import AnomalyDetector
from src.risk_engine import RiskEngine
from src.alerts import AlertSystem
from src.services.ai_service import AIService, InMemoryRepository, SensorReading as AISensorReading
from src.chatbot import ChatbotService, LLMConfig, FallbackClient
from src.services.influx_repository import create_repository_from_env, InfluxRepository
from src.services.firebase_service import get_firebase_service

logger = logging.getLogger(__name__)

router = APIRouter()

# ===========================================================================
# ESTADO GLOBAL (se inicializa al arrancar)
# ===========================================================================

_model: Optional[AgrilionLSTM] = None
_preprocessor: Optional[DataPreprocessor] = None
_predictor: Optional[Predictor] = None
_risk_engine = RiskEngine()
_alert_system = AlertSystem()
_anomaly_detector = AnomalyDetector()
_ai_service: Optional[AIService] = None
_chatbot: Optional[ChatbotService] = None

# Repository: intenta InfluxDB primero, fallback a InMemory
_influx_repo: Optional[InfluxRepository] = None
_repository = None  # Se setea en initialize_model()


def initialize_model():
    """Carga el modelo y scaler si existen. Inicializa repositorio y chatbot."""
    global _model, _preprocessor, _predictor, _repository, _influx_repo

    _preprocessor = DataPreprocessor()

    if Path(DEFAULT_MODEL_PATH).exists() and Path(SCALER_PATH).exists():
        try:
            _model = AgrilionLSTM(n_features=len(SENSOR_COLUMNS))
            _model.load(str(DEFAULT_MODEL_PATH))
            _preprocessor.load_scaler(str(SCALER_PATH))
            _predictor = Predictor(_model, _preprocessor)
            logger.info("✅ Modelo y scaler cargados para API")
        except Exception as e:
            logger.warning(f"⚠️ No se pudo cargar el modelo: {e}")
            _model = None
    else:
        logger.info("ℹ️ Modelo no encontrado. Entrene el modelo primero con main.py")

    # ─── Inicializar Repository (InfluxDB → fallback → InMemory) ─────────
    try:
        _influx_repo = create_repository_from_env()
        if _influx_repo is not None:
            _repository = _influx_repo
            logger.info("📊 Repository: InfluxDB (datos reales)")
        else:
            _repository = InMemoryRepository()
            logger.info("💾 Repository: InMemory (modo simulación)")
    except Exception as e:
        logger.warning(f"⚠️ InfluxDB falló: {e}. Usando InMemory.")
        _repository = InMemoryRepository()

    # ─── Inicializar AI Service ───────────────────────────────────────────
    global _ai_service
    if _model is not None:
        _ai_service = AIService(
            preprocessor=_preprocessor,
            lstm_model=_model,
            risk_engine=_risk_engine,
            alert_system=_alert_system,
            repository=_repository,
            anomaly_detector=_anomaly_detector,
        )
        logger.info("✅ AI Service inicializado para API")

    # ─── Inicializar Chatbot Service ─────────────────────────────────────
    global _chatbot
    try:
        _chatbot = ChatbotService(ai_service=_ai_service, risk_engine=_risk_engine)
        logger.info("✅ Chatbot service inicializado")
    except Exception as e:
        logger.warning(f"⚠️ Chatbot init failed: {e}. Chat endpoint will use fallback.")
        _chatbot = ChatbotService(llm_client=FallbackClient(LLMConfig()))


def _readings_to_df(readings) -> pd.DataFrame:
    """Convierte lista de SensorReading a DataFrame."""
    data = [
        {
            "timestamp": r.timestamp,
            "temperature": r.temperature,
            "humidity": r.humidity,
            "co2": r.co2,
            "silo_id": r.silo_id,
        }
        for r in readings
    ]
    df = pd.DataFrame(data)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.set_index("timestamp").sort_index()
    return df


# ===========================================================================
# ENDPOINTS
# ===========================================================================

@router.get("/health", response_model=HealthResponse, tags=["Sistema"])
async def health_check():
    """Verifica el estado del servicio."""
    return HealthResponse(
        status="healthy",
        version=__version__,
        model_loaded=_model is not None and _model.model is not None,
        timestamp=datetime.now().isoformat(),
    )


@router.get("/model/status", response_model=ModelStatusResponse, tags=["Modelo"])
async def model_status():
    """Devuelve información sobre el modelo cargado."""
    if _model is None or _model.model is None:
        return ModelStatusResponse(
            model_loaded=False,
            model_path=str(DEFAULT_MODEL_PATH),
        )

    return ModelStatusResponse(
        model_loaded=True,
        model_path=str(DEFAULT_MODEL_PATH),
        architecture=_model.get_model_summary(),
        n_parameters=_model.model.count_params(),
    )


@router.post("/predict", response_model=PredictionResponse, tags=["Predicción"])
async def predict(request: PredictionRequest):
    """
    Predice valores futuros de sensores.

    Requiere al menos 24 lecturas recientes (sequence_length).
    Devuelve predicciones para los próximos N pasos.
    """
    if _predictor is None:
        raise HTTPException(
            status_code=503,
            detail="Modelo no disponible. Entrene el modelo primero con main.py"
        )

    try:
        df = _readings_to_df(request.readings)
        sensor_cols = [c for c in SENSOR_COLUMNS if c in df.columns]

        # Normalizar
        normalized = _preprocessor.normalize(df, fit=False)

        # Tomar la última secuencia
        seq_len = LSTM_CONFIG["sequence_length"]
        if len(normalized) < seq_len:
            raise HTTPException(
                status_code=400,
                detail=f"Se necesitan al menos {seq_len} lecturas. Recibidas: {len(normalized)}"
            )

        last_sequence = normalized[-seq_len:]

        # Predecir multi-step
        predictions_raw = _predictor.predict_multistep(
            last_sequence, steps=request.steps, return_original_scale=True
        )

        # Formatear resultado
        last_ts = df.index[-1]
        freq = pd.infer_freq(df.index[-10:]) or "1h"

        prediction_results = []
        for i, pred in enumerate(predictions_raw):
            future_ts = last_ts + pd.Timedelta(freq) * (i + 1)
            prediction_results.append(PredictionResult(
                timestamp=future_ts.isoformat(),
                temperature=round(float(pred[0]), 2),
                humidity=round(float(pred[1]), 2) if len(pred) > 1 else 0.0,
                co2=round(float(pred[2]), 2) if len(pred) > 2 else 0.0,
            ))

        return PredictionResponse(
            status="success",
            predictions=prediction_results,
            model_info={
                "sequence_length": seq_len,
                "steps_predicted": request.steps,
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error en predicción: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/analyze", response_model=AnalysisResponse, tags=["Análisis"])
async def analyze(request: AnalysisRequest):
    """
    Análisis completo: anomalías + riesgo + alertas.

    Combina detección de anomalías, evaluación de riesgo y
    generación de alertas en un solo endpoint.
    """
    try:
        df = _readings_to_df(request.readings)
        sensor_cols = [c for c in SENSOR_COLUMNS if c in df.columns]

        anomaly_results = []
        alert_results = []
        risk_result = None
        prediction_results = []

        # 1. Detección de anomalías
        anomaly_df = None
        if request.include_anomaly_detection and len(df) >= 10:
            anomaly_df = _anomaly_detector.detect_all(df, sensor_cols)

            for idx, row in anomaly_df.iterrows():
                if row.get("is_anomaly", False):
                    affected = [
                        col for col in sensor_cols
                        if row.get(f"{col}_anomaly_consensus", False)
                    ]
                    anomaly_results.append(AnomalyResult(
                        timestamp=str(idx),
                        is_anomaly=True,
                        affected_sensors=affected,
                        severity="HIGH" if row.get("temperature_anomaly_votes", 0) >= 3 else "MEDIUM",
                        methods_triggered=int(
                            max(row.get(f"{col}_anomaly_votes", 0) for col in sensor_cols)
                        ),
                    ))

        # 2. Evaluación de riesgo
        if request.include_risk_assessment:
            # Usar los últimos valores
            last_values = {col: float(df[col].iloc[-1]) for col in sensor_cols}

            anomaly_flags = None
            if anomaly_df is not None and "is_anomaly" in anomaly_df.columns:
                anomaly_flags = anomaly_df["is_anomaly"]

            risk_factors = _risk_engine.get_risk_factors(
                last_values, anomaly_flags=anomaly_flags
            )

            risk_result = RiskResult(
                total_score=risk_factors["total_score"],
                level=risk_factors["level"],
                emoji=risk_factors["emoji"],
                factors=risk_factors["factors"],
            )

            # 3. Alertas
            alerts = _alert_system.generate_alerts(risk_factors)
            alert_results = [
                AlertResult(
                    level=a.level,
                    category=a.category,
                    message=a.message,
                    detail=a.detail,
                    recommendation=a.recommendation,
                    risk_score=a.risk_score,
                ) for a in alerts
            ]

        # 4. Predicciones (si hay modelo)
        if request.include_predictions and _predictor is not None:
            seq_len = LSTM_CONFIG["sequence_length"]
            if len(df) >= seq_len:
                normalized = _preprocessor.normalize(df, fit=False)
                last_seq = normalized[-seq_len:]
                preds = _predictor.predict_multistep(
                    last_seq, steps=6, return_original_scale=True
                )
                last_ts = df.index[-1]
                for i, pred in enumerate(preds):
                    prediction_results.append(PredictionResult(
                        timestamp=(last_ts + pd.Timedelta("1h") * (i + 1)).isoformat(),
                        temperature=round(float(pred[0]), 2),
                        humidity=round(float(pred[1]), 2) if len(pred) > 1 else 0.0,
                        co2=round(float(pred[2]), 2) if len(pred) > 2 else 0.0,
                    ))

        return AnalysisResponse(
            status="success",
            risk=risk_result,
            anomalies=anomaly_results,
            alerts=alert_results,
            predictions=prediction_results,
            summary={
                "total_readings": len(df),
                "time_range": f"{df.index[0]} → {df.index[-1]}",
                "total_anomalies": len(anomaly_results),
                "total_alerts": len(alert_results),
            },
        )

    except Exception as e:
        logger.error(f"Error en análisis: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.post("/ingest", response_model=IngestResponse, tags=["Tiempo Real"])
async def ingest_sensor_reading(request: IngestRequest):
    """
    Endpoint de ingestión de sensores en tiempo real.

    Recibe una nueva lectura, ejecuta el pipeline completo de ML inmediatamente,
    y devuelve el score de riesgo, predicciones, anomalías y alertas.
    """
    timestamp = request.timestamp or datetime.now().isoformat()

    reading = AISensorReading(
        silo_id=request.silo_id,
        timestamp=timestamp,
        temperature=request.temperature,
        humidity=request.humidity,
        co2=request.co2,
    )

    if _ai_service is None:
        # Fallback: usar motor de riesgo directamente sin LSTM
        sensor_vals = {
            "temperature": request.temperature,
            "humidity": request.humidity,
            "co2": request.co2,
        }
        risk_factors = _risk_engine.get_risk_factors(sensor_vals)
        alerts = _alert_system.generate_alerts(risk_factors)
        return IngestResponse(
            status="partial",  # no hay LSTM disponible
            silo_id=request.silo_id,
            timestamp=timestamp,
            risk_score=risk_factors["total_score"],
            risk_level=risk_factors["level"],
            predictions={},
            anomalies={},
            alerts=[{"level": a.level, "message": a.message} for a in alerts],
            metadata={"note": "LSTM no disponible, resultado solo con reglas de riesgo"},
        )

    try:
        result = _ai_service.ingest_and_analyze(reading)
        return IngestResponse(
            status="ok",
            silo_id=result.silo_id,
            timestamp=result.timestamp,
            risk_score=result.risk_score,
            risk_level=result.risk_level,
            predictions=result.predictions,
            anomalies=result.anomalies,
            alerts=result.alerts,
            metadata=result.metadata,
        )
    except Exception as e:
        logger.error(f"Error en /ingest: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ===========================================================================
# CHATBOT ENDPOINTS
# ===========================================================================

@router.post("/chat", response_model=ChatResponse, tags=["Chatbot"])
async def chat(request: ChatRequest):
    """
    Intelligent chatbot endpoint.

    Answers questions about the silo state, alerts, sensor data,
    and agricultural risk using a real LLM API with injected system context.

    Set env var OPENROUTER_API_KEY (free at openrouter.ai) to enable.
    """
    if _chatbot is None:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")

    result = _chatbot.chat(
        message=request.message,
        silo_id=request.silo_id,
        session_id=request.session_id,
    )
    return ChatResponse(**result.to_dict())


@router.post("/chat/summarize/{silo_id}", response_model=ChatResponse, tags=["Chatbot"])
async def summarize_silo(silo_id: str):
    """
    Generate a natural-language status summary for a silo.
    """
    if _chatbot is None:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")
    result = _chatbot.summarize_silo(silo_id)
    return ChatResponse(**result.to_dict())


@router.post("/chat/explain-alert", response_model=ChatResponse, tags=["Chatbot"])
async def explain_alert(alert: dict, silo_id: str = "SILO_001"):
    """
    Get a natural-language explanation of a specific alert.
    """
    if _chatbot is None:
        raise HTTPException(status_code=503, detail="Chatbot not initialized")
    result = _chatbot.explain_alert(alert, silo_id=silo_id)
    return ChatResponse(**result.to_dict())


@router.delete("/chat/session/{session_id}", tags=["Chatbot"])
async def clear_chat_session(session_id: str):
    """Clear conversation memory for a session."""
    if _chatbot:
        _chatbot.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


# ===========================================================================
# FRONTEND DATA ENDPOINTS (silos overview, history, current)
# ===========================================================================


@router.get("/silos/overview", response_model=SilosOverviewResponse, tags=["Datos"])
async def get_silos_overview():
    """
    Devuelve el estado actual de todos los silos.

    Usa datos reales de InfluxDB si está configurado, o
    datos del InMemoryRepository si no.
    """
    if _influx_repo is not None:
        raw = _influx_repo.get_silo_overview()
    elif _repository is not None and hasattr(_repository, "get_silo_overview"):
        raw = _repository.get_silo_overview()
    else:
        # Fallback: generar datos de prueba
        raw = _generate_mock_overview()

    silos = [
        SiloOverviewItem(
            silo_id=s["silo_id"],
            temperature=float(s["temperature"]),
            humidity=float(s["humidity"]),
            co2=float(s["co2"]),
            risk_score=int(s["risk_score"]),
            risk_level=s["risk_level"],
            last_update=s["last_update"],
            grain_type=s.get("grain_type"),
            device_id=s.get("device_id"),
        )
        for s in raw
    ]

    return SilosOverviewResponse(
        silos=silos,
        total=len(silos),
        timestamp=datetime.now().isoformat(),
    )


@router.get(
    "/silos/{silo_id}/history",
    response_model=SiloHistoryResponse,
    tags=["Datos"],
)
async def get_silo_history(silo_id: str, hours: int = 24):
    """
    Devuelve el historial de un silo en las últimas N horas.
    """
    if _influx_repo is not None:
        raw = _influx_repo.get_silo_history(silo_id, hours)
    elif _repository is not None and hasattr(_repository, "get_recent_readings"):
        df = _repository.get_recent_readings(silo_id, n=hours * 4)
        raw = [
            {
                "timestamp": str(ts),
                "temperature": float(row.get("temperature", 0)),
                "humidity": float(row.get("humidity", 0)),
                "co2": float(row.get("co2", 0)),
            }
            for ts, row in df.iterrows()
        ] if not df.empty else []
    else:
        raw = []

    history = [
        SiloHistoryItem(
            timestamp=h["timestamp"],
            temperature=float(h["temperature"]),
            humidity=float(h["humidity"]),
            co2=float(h["co2"]),
        )
        for h in raw
    ]

    return SiloHistoryResponse(
        silo_id=silo_id,
        history=history,
        hours=hours,
        total_points=len(history),
    )


@router.get("/silos/{silo_id}/current", tags=["Datos"])
async def get_silo_current(silo_id: str):
    """
    Devuelve el estado actual de un silo específico.
    """
    if _influx_repo is not None:
        all_silos = _influx_repo.get_silo_overview()
        for s in all_silos:
            if s["silo_id"] == silo_id:
                return s
    elif _repository is not None:
        df = _repository.get_recent_readings(silo_id, n=1)
        if not df.empty:
            last = df.iloc[-1]
            return {
                "silo_id": silo_id,
                "temperature": round(float(last.get("temperature", 0)), 1),
                "humidity": round(float(last.get("humidity", 0)), 1),
                "co2": round(float(last.get("co2", 0)), 1),
                "risk_score": 0,
                "risk_level": "NORMAL",
                "last_update": str(df.index[-1]),
            }

    raise HTTPException(status_code=404, detail=f"Silo {silo_id} no encontrado")


# ===========================================================================
# AUTH ENDPOINTS (Firebase Authentication + Firestore)
# ===========================================================================

@router.post("/auth/register", tags=["Auth"])
async def register_user(request: dict):
    """
    Registra un nuevo usuario.
    
    Request body:
        {
            "email": "user@example.com",
            "password": "securepass123",
            "name": "Juan Pérez",
            "phone": "+5491123456789",  // opcional
            "company": "Agrícola SRL"    // opcional
        }
    """
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    try:
        user = fb.register_user(
            email=request["email"],
            password=request["password"],
            name=request.get("name", ""),
            phone=request.get("phone", ""),
            company=request.get("company", ""),
        )
        return {"status": "ok", "user": user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/auth/verify", tags=["Auth"])
async def verify_token(request: dict):
    """
    Verifica un Firebase ID token y devuelve la info del usuario.
    
    Request body:
        {
            "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
    """
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    try:
        decoded = fb.verify_id_token(request["idToken"])
        uid = decoded["uid"]
        profile = fb.get_user_profile(uid)
        return {
            "status": "ok",
            "uid": uid,
            "email": decoded.get("email"),
            "profile": profile,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {e}")


@router.get("/users/{uid}/silos", tags=["Silos"])
async def get_user_silos(uid: str):
    """Devuelve todos los silos de un usuario."""
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    silos = fb.get_user_silos(uid)
    return {"status": "ok", "silos": silos, "total": len(silos)}


@router.post("/users/{uid}/silos", tags=["Silos"])
async def create_silo(uid: str, request: dict):
    """
    Crea una nueva silobolsa para un usuario.
    
    Request body:
        {
            "name": "Silo Norte",
            "grain_type": "soja",
            "location": "Lote 5 - Campo San Martín",
            "tons": 120.5
        }
    """
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    try:
        silo_id = fb.create_silo(
            owner_uid=uid,
            name=request["name"],
            grain_type=request["grain_type"],
            location=request.get("location", ""),
            tons=request.get("tons", 0),
        )
        return {"status": "ok", "silo_id": silo_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/{uid}/silos/{silo_id}", tags=["Silos"])
async def get_silo(uid: str, silo_id: str):
    """Devuelve un silo específico con sus sensores."""
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    silo = fb.get_silo(uid, silo_id)
    if not silo:
        raise HTTPException(status_code=404, detail="Silo no encontrado")
    
    return {"status": "ok", "silo": silo}


@router.post("/users/{uid}/silos/{silo_id}/sensors", tags=["Sensores"])
async def register_sensor(uid: str, silo_id: str, request: dict):
    """
    Registra un sensor y lo asocia a un silo.
    
    Request body:
        {
            "device_id": "cubecell-001",
            "battery": 95
        }
    """
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    try:
        sensor_id = fb.register_sensor(
            owner_uid=uid,
            silo_id=silo_id,
            device_id=request["device_id"],
            battery=request.get("battery", 100),
        )
        return {"status": "ok", "sensor_id": sensor_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sensors/{device_id}", tags=["Sensores"])
async def get_sensor_info(device_id: str):
    """Obtiene info de un sensor por device_id (lookup global)."""
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    info = fb.get_sensor_info(device_id)
    if not info:
        raise HTTPException(status_code=404, detail="Sensor no encontrado")
    
    return {"status": "ok", "sensor": info}


@router.get("/users/{uid}/alerts", tags=["Alertas"])
async def get_user_alerts(uid: str, acknowledged: bool = None):
    """Devuelve las alertas de un usuario."""
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    alerts = fb.get_user_alerts(uid, acknowledged=acknowledged)
    return {"status": "ok", "alerts": alerts, "total": len(alerts)}


@router.post("/users/{uid}/alerts/{alert_id}/acknowledge", tags=["Alertas"])
async def acknowledge_alert(uid: str, alert_id: str):
    """Marca una alerta como reconocida."""
    fb = get_firebase_service()
    if not fb:
        raise HTTPException(status_code=503, detail="Firebase no disponible")
    
    fb.acknowledge_alert(uid, alert_id)
    return {"status": "ok"}


# ─── Helpers ──────────────────────────────────────────────────────────────────


def _generate_mock_overview() -> list[dict]:
    """Generar datos mock cuando no hay repositorio configurado."""
    import random
    now = datetime.now().isoformat()
    silos = []
    for i in range(1, 6):
        sid = f"SILO_{i:03d}"
        temp = round(random.uniform(18, 32), 1)
        hum = round(random.uniform(50, 85), 1)
        co2 = round(random.uniform(400, 1000), 0)
        # Score simple
        score = 0
        if temp > 30:
            score += 20
        if hum > 75:
            score += 25
        if co2 > 800:
            score += 25
        score = min(score, 100)
        level = "CRITICAL" if score >= 70 else ("WARNING" if score >= 30 else "NORMAL")
        silos.append({
            "silo_id": sid,
            "temperature": temp,
            "humidity": hum,
            "co2": co2,
            "risk_score": score,
            "risk_level": level,
            "last_update": now,
        })
    return silos
