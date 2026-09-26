# AGRILION — Arquitectura del Sistema Integrado

> Documento técnico que describe cómo se conectan todos los componentes del sistema:
> Arduino → TTN → MQTT → InfluxDB/Firebase → AI API → Frontend Web

---

## 🏗️ Diagrama General

```
┌─────────────┐    LoRaWAN     ┌─────────┐    MQTT     ┌──────────┐
│  CubeCell   │ ──────────────▶│   TTN   │ ──────────▶│  HiveMQ  │
│  (Arduino)  │  868MHz/915MHz │ (Cloud) │            │ (Broker) │
└─────────────┘                └─────────┘            └────┬─────┘
                                                           │
                          ┌────────────────────────────────┤
                          │ smisia/#                        │
                          ▼                                ▼
                ┌──────────────────┐             ┌───────────────────┐
                │ TTN_MQTT.py      │             │ mqtt_to_ai_bridge │
                │ (Bridge TTN→MQTT)│             │ (MQTT → AI API)   │
                └──────────────────┘             └────────┬──────────┘
                                                          │
                    ┌─────────────────────┐               │ POST /api/v1/ingest
                    │MQTT_INFLUXDB_FIREBASE│               │
                    │    (Procesador)      │               ▼
                    ├─────────────────────┤    ┌──────────────────────┐
                    │ → InfluxDB (series) │    │   AI API (FastAPI)   │
                    │ → Firebase (estado) │    │                      │
                    └─────────────────────┘    │  /silos/overview     │
                                               │  /silos/{id}/history │
                          ┌────────────────┐   │  /chat               │
                          │   InfluxDB     │◀──│  /ingest             │
                          │   (datos crudos│   │  /analyze            │
                          └────────────────┘   └──────────┬───────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────┐
                                               │  Next.js Frontend    │
                                               │  (Dashboard Web)     │
                                               │                      │
                                               │  /dashboard          │
                                               │  /dashboard/ia       │
                                               │  /dashboard/alerts   │
                                               │  /dashboard/history  │
                                               └──────────────────────┘
```

---

## 📦 Componentes del Sistema

### 1. Arduino (CubeCell + Sensores)
- **Hardware**: CubeCell HTCC-AB02A + BME280 + MH-Z19B (CO2) + Acelerómetro
- **Función**: Lee temperatura, humedad, CO2 y aceleración cada ~20 min
- **Comunicación**: LoRaWAN → The Things Network (TTN)
- **Firmware**: `Backend_Arduino/Codigo_TransmisionLoraWAN_Sensores/`

### 2. The Things Network (TTN)
- **Función**: Gateway LoRaWAN que recibe los uplinks del CubeCell
- **Payload Formatter**: `Backend_Arduino/TTN_Payload_Formatter.js`
- **Output**: Publica en MQTT de TTN: `v3/{app_id}/devices/{device_id}/up`

### 3. TTN_MQTT.py (Bridge)
- **Función**: Se suscribe a TTN MQTT y republica en HiveMQ
- **Topic de salida**: `smisia/{device_id}`
- **Archivo**: `Backend_Arduino/TTN_MQTT.py`

### 4. MQTT_INFLUXDB_FIREBASE.py (Procesador Principal)
- **Función**: Lee de HiveMQ, evalúa riesgo, guarda en InfluxDB y Firebase
- **Motor de riesgo**: Score 0-100 basado en CO2, humedad, temperatura, aceleración
- **Config por grano**: Umbrales específicos para maíz, soja, trigo, girasol
- **Archivo**: `Backend_Arduino/MQTT_INFLUXDB_FIREBASE.py`

### 5. mqtt_to_ai_bridge.py (Puente a la IA)
- **Función**: Lee de HiveMQ y envía cada lectura a la AI API
- **Endpoint**: POST `http://localhost:8000/api/v1/ingest`
- **Archivo**: `Backend_Arduino/mqtt_to_ai_bridge.py`

### 6. AI API (FastAPI)
- **Función**: Ejecuta el modelo LSTM, detección de anomalías, y chatbot
- **Puerto**: 8000
- **Modelo**: LSTM entrenado con datos de sensores
- **Endpoints principales**:
  - `GET /api/v1/health` — Health check
  - `GET /api/v1/silos/overview` — Estado de todos los silos
  - `GET /api/v1/silos/{id}/history` — Historial de un silo
  - `GET /api/v1/silos/{id}/current` — Estado actual de un silo
  - `POST /api/v1/ingest` — Ingestar lectura y ejecutar pipeline ML
  - `POST /api/v1/chat` — Chatbot con LLM
- **Archivos**: `Inteligencia_Artificial/api/`

### 7. Frontend Web (Next.js)
- **Función**: Dashboard de monitoreo con visualización de datos
- **Puerto**: 3000
- **Modo mock**: Por defecto usa datos de prueba. Con `MOCK_MODE=false` llama a la AI API real.
- **Proxy**: `/api/ai/*` → `http://localhost:8000/api/v1/*` (sin CORS)
- **Archivos**: `paginaweb/`

---

## 🔑 Variables de Entorno

### Backend_Arduino/.env
```env
TTN_BROKER=eu1.cloud.thethings.network
TTN_PORT=8883
TTN_USER=tu_app_id@ttn
TTN_PASS=tu_api_key

HIVEMQ_BROKER=tu-cluster.hivemq.cloud
HIVEMQ_PORT=8883
HIVEMQ_USER=tu_user
HIVEMQ_PASS=tu_pass

INFLUX_URL=https://tu-region.influxdata.com
INFLUX_TOKEN=tu_token
INFLUX_ORG=tu_org
INFLUX_BUCKET=silobolsas

AI_API_URL=http://localhost:8000/api/v1
```

### Inteligencia_Artificial/.env
```env
# Chatbot (elegir uno):
OPENROUTER_API_KEY=sk-or-v1-tu_key    # Gratis → openrouter.ai
# OLLAMA_MODEL=llama3                   # Local → ollama.ai

# Datos reales (opcional):
INFLUX_URL=https://tu-region.influxdata.com
INFLUX_TOKEN=tu_token
INFLUX_ORG=tu_org
INFLUX_BUCKET=silobolsas
```

### paginaweb/.env.local
```env
NEXT_PUBLIC_MOCK_MODE=false
AI_API_URL=http://localhost:8000
```

---

## 🚀 Cómo Ejecutar Todo

### Paso 1: Entrenar el modelo (solo la primera vez)
```bash
cd Inteligencia_Artificial
python main.py --epochs 50
```

### Paso 2: Iniciar la AI API
```bash
cd Inteligencia_Artificial
cp .env.example .env   # Editar con tus credenciales
pip install -r requirements.txt
uvicorn api.app:app --reload --port 8000
```

### Paso 3: Iniciar el Frontend
```bash
cd paginaweb
cp .env.example .env.local   # Opcional: MOCK_MODE=false
npm install
npm run dev
```

### Paso 4: Iniciar los bridges IoT (3 terminales)
```bash
# Terminal 1: Bridge TTN → HiveMQ
cd Backend_Arduino
python TTN_MQTT.py

# Terminal 2: Procesador principal (InfluxDB + Firebase)
python MQTT_INFLUXDB_FIREBASE.py

# Terminal 3: Puente a la AI API
python mqtt_to_ai_bridge.py
```

### Verificación rápida
```bash
# 1. Health check de la API
curl http://localhost:8000/api/v1/health

# 2. Overview de silos
curl http://localhost:8000/api/v1/silos/overview

# 3. Chatbot
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "¿Cómo están los silos?", "silo_id": "SILO_001"}'

# 4. Frontend
# Abrir http://localhost:3000/dashboard/ia
```

---

## 🤖 Chatbot — Estrategia de Costos

### Para Prototipo (GRATIS)

| Capa | Proveedor | Modelo | Costo |
|------|-----------|--------|-------|
| 1 | OpenRouter | `meta-llama/llama-3.1-8b-instruct:free` | $0 |
| 2 | Ollama (local) | `llama3` | $0 (requiere 8GB RAM) |
| 3 | Rule Engine | Determinístico | $0 (siempre funciona) |

**Recomendación**: Registrate en https://openrouter.ai/keys (gratis, sin tarjeta) y poné tu key en `.env`.

### Para Producción (Pago)

| Modelo | Costo/30K consultas | Justificación |
|--------|---------------------|---------------|
| GPT-4o-mini | ~$2.25/mes | Mejor razonamiento, function calling |
| Claude Haiku | ~$3.75/mes | Excelente en español, respuestas naturales |
| GPT-4o | ~$37.50/mes | Análisis complejos multi-silo |

**Justificación para migrar**:
- SLA garantizado (sin caídas inesperadas de modelos free)
- Latencia 2-5x menor
- Streaming de respuestas (mejor UX)
- Function calling (ej: "enviar alerta al técnico")
- Mayor contexto (128K tokens vs 8K de modelos free)

---

## 🧪 Testing y Pruebas

### Test sin hardware real
1. Iniciá la AI API (Paso 2)
2. Iniciá el Frontend (Paso 3) con `MOCK_MODE=false`
3. Abrí http://localhost:3000/dashboard/ia
4. Verificá que el indicador verde diga "AI API conectada"
5. Probá el chatbot: "¿Cómo están los silos?"

### Test con datos simulados en la API
```bash
# Inyectar lectura simulada
curl -X POST http://localhost:8000/api/v1/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "silo_id": "TEST_001",
    "temperature": 28.5,
    "humidity": 72.3,
    "co2": 850
  }'
```

### Test con hardware real
1. Encender CubeCell → envía datos cada ~20s
2. Los 3 scripts de Backend_Arduino deben estar corriendo
3. Verificar en la consola del bridge: `✅ AI API OK | SILO_xxx | Risk: .../100`
4. Verificar en el frontend que los datos aparecen en el dashboard

---

## 📁 Estructura de Archivos Clave

```
AGRILION/
├── Backend_Arduino/
│   ├── TTN_MQTT.py              ← Bridge TTN → HiveMQ
│   ├── MQTT_INFLUXDB_FIREBASE.py ← Procesador principal
│   ├── mqtt_to_ai_bridge.py     ← NUEVO: Puente a AI API
│   ├── .env.example             ← NUEVO: Template de env vars
│   └── .env                     ← Credenciales reales
│
├── Inteligencia_Artificial/
│   ├── api/
│   │   ├── app.py               ← FastAPI app
│   │   ├── routes.py            ← MODIFICADO: + endpoints /silos/*
│   │   └── schemas.py           ← MODIFICADO: + ChatRequest/Response
│   ├── src/
│   │   ├── services/
│   │   │   ├── ai_service.py
│   │   │   └── influx_repository.py  ← NUEVO: Lee datos de InfluxDB
│   │   ├── chatbot/
│   │   │   ├── chatbot_service.py
│   │   │   ├── llm_client.py
│   │   │   └── rule_based_engine.py
│   │   └── config.py
│   ├── .env.example             ← NUEVO: Template de env vars
│   └── main.py
│
├── paginaweb/
│   ├── next.config.ts           ← MODIFICADO: + proxy /api/ai/*
│   ├── src/
│   │   ├── lib/
│   │   │   ├── ai-api.ts        ← NUEVO: Cliente HTTP para AI API
│   │   │   ├── data-service.ts  ← MODIFICADO: Usa AI API real
│   │   │   └── mock-data.ts
│   │   └── components/dashboard/
│   │       └── ia-client.tsx    ← MODIFICADO: Chatbot real + fallback
│   └── .env.local
│
└── ARCHITECTURE.md              ← ESTE ARCHIVO
```

---

## ⚠️ Errores Comunes y Soluciones

### 1. "AI API no disponible" en el frontend
- **Causa**: La AI API no está corriendo en puerto 8000
- **Solución**: `uvicorn api.app:app --reload --port 8000` en `Inteligencia_Artificial/`

### 2. "Modelo no disponible" en la API
- **Causa**: No se entrenó el modelo LSTM todavía
- **Solución**: `python main.py` en `Inteligencia_Artificial/`

### 3. El chatbot responde con reglas en lugar de IA
- **Causa**: No hay API key de OpenRouter configurada
- **Solución**: Agregar `OPENROUTER_API_KEY=sk-or-v1-...` en `.env`

### 4. El frontend muestra datos mock aunque MOCK_MODE=false
- **Causa**: La AI API no está accesible, el frontend cae a mock por seguridad
- **Solución**: Verificar que la API responde: `curl http://localhost:8000/api/v1/health`

### 5. "Connection refused" en mqtt_to_ai_bridge.py
- **Causa**: HiveMQ o la AI API no están disponibles
- **Solución**: Verificar credenciales de HiveMQ en `.env` y que la API esté corriendo

### 6. El modelo no predice bien con datos reales
- **Causa**: Fue entrenado con datos sintéticos
- **Solución**: Después de 2-4 semanas de datos reales en InfluxDB, re-entrenar:
  ```bash
  # Exportar datos reales de InfluxDB a CSV
  # Reemplazar data/sensor_data.csv
  # python main.py --epochs 100
  ```
