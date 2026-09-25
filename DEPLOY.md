# 🚀 Guía de Despliegue de Agrilion

Este documento describe cómo desplegar el sistema completo de Agrilion usando Docker.

## 📋 Requisitos Previos

- **Docker** 20.10+
- **Docker Compose** 2.0+
- **Git** (para clonar el repositorio)
- Credenciales de:
  - [Groq](https://console.groq.com/keys) (chatbot gratuito)
  - [InfluxDB Cloud](https://cloud2.influxdata.com/) (o local)
  - [HiveMQ Cloud](https://www.hivemq.com/) (o broker MQTT local)
  - [Firebase](https://console.firebase.google.com/) (Auth + Firestore)
  - [The Things Network](https://www.thethingsnetwork.org/) (LoRaWAN)

## 🏗️ Arquitectura del Sistema

```
┌─────────────────┐
│  CubeCell       │ (Sensor LoRaWAN)
│  (Arduino)      │
└────────┬────────┘
         │ LoRaWAN
         ↓
┌─────────────────┐
│  The Things     │
│  Network (TTN)  │
└────────┬────────┘
         │ MQTT
         ↓
┌─────────────────┐
│  HiveMQ Cloud   │
│  (MQTT Broker)  │
└────────┬────────┘
         │ MQTT
         ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend Scripts (Python) — 3 procesos en paralelo          │
│                                                             │
│  1. TTN_MQTT.py                                             │
│     → Republish de TTN a HiveMQ                             │
│                                                             │
│  2. MQTT_INFLUXDB_FIREBASE.py                               │
│     → Lecturas numéricas → InfluxDB (time-series)           │
│     → Estado de sensores/silos → Firebase (categorical)     │
│                                                             │
│  3. mqtt_to_ai_bridge.py                                    │
│     → Lecturas → AI API /ingest endpoint                    │
└────────┬────────────────────────────────────────────────────┘
         │
         ├──────────────────┐
         ↓                  ↓
┌─────────────────┐  ┌─────────────────┐
│  InfluxDB       │  │  Firebase       │
│  (Time-Series)  │  │  (Firestore)    │
│                 │  │                 │
│ - temperature   │  │ - users         │
│ - humidity      │  │ - silos         │
│ - co2           │  │ - sensors       │
│ - score         │  │ - alerts        │
└─────────────────┘  └─────────────────┘
         ↑                  ↑
         │                  │
┌─────────────────────────────────────────────────────────────┐
│  AI API (FastAPI)                                           │
│                                                             │
│  - /api/v1/chat → Groq LLM (chatbot)                        │
│  - /api/v1/silos/overview → Datos de silos                  │
│  - /api/v1/silos/{id}/history → Historial                   │
│  - /api/v1/auth/register → Registro de usuarios             │
│  - /api/v1/auth/verify → Verificación de tokens             │
│  - LSTM model (anomalías + predicciones)                    │
└────────┬────────────────────────────────────────────────────┘
         │ HTTP
         ↓
┌─────────────────┐
│  Web Frontend   │ (Next.js)
│  (React)        │
└─────────────────┘
         │
         ↓
┌─────────────────┐
│  Android App    │ (Kotlin + Retrofit)
│  (Móvil)        │
└─────────────────┘
```

## 📦 Estructura del Proyecto

```
AGRILION/
├── Backend_Arduino/          # Scripts Python (MQTT → InfluxDB + Firebase)
│   ├── TTN_MQTT.py
│   ├── MQTT_INFLUXDB_FIREBASE.py
│   ├── mqtt_to_ai_bridge.py
│   ├── .env.example
│   ├── Dockerfile
│   ├── supervisord.conf
│   └── requirements.txt
│
├── Inteligencia_Artificial/  # AI API (FastAPI + TensorFlow)
│   ├── api/
│   │   ├── app.py
│   │   ├── routes.py
│   │   └── schemas.py
│   ├── src/
│   │   ├── chatbot/
│   │   │   ├── llm_client.py      # Groq + OpenRouter + Rule Engine
│   │   │   └── chatbot_service.py
│   │   ├── services/
│   │   │   ├── firebase_service.py  # Auth + Firestore
│   │   │   └── influx_repository.py # Lecturas de InfluxDB
│   │   └── ...
│   ├── firebase/                    # serviceAccountKey.json (NO subir a git)
│   ├── .env.example
│   ├── Dockerfile
│   └── requirements.txt
│
├── paginaweb/                # Frontend Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx
│   │   │   │   ├── page.tsx
│   │   │   │   └── ia/page.tsx
│   │   │   └── ...
│   │   └── components/
│   │       └── dashboard/
│   │           └── ia-client.tsx    # Chat UI
│   ├── .env.local
│   ├── Dockerfile
│   └── next.config.ts
│
├── AppCelular/               # App Android (Kotlin)
│   └── app/src/main/
│       ├── java/com/example/app1/
│       │   ├── data/
│       │   │   └── ChatApiServiceBaseDeDatos.kt
│       │   └── ui/screens/
│       │       ├── DashboardScreen.kt
│       │       └── ...
│       └── AndroidManifest.xml
│
├── docker-compose.yml        # Orquestación de servicios
├── MOBILE_INTEGRATION.md     # Guía de integración móvil
└── ARCHITECTURE.md           # Este documento
```

## 🔧 Configuración Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/agrilion.git
cd agrilion
```

### 2. Configurar Variables de Entorno

#### Backend Arduino
```bash
cd Backend_Arduino
cp .env.example .env
```

Editar `.env`:
```env
# TTN (The Things Network)
TTN_BROKER=eu1.cloud.thethings.network
TTN_PORT=8883
TTN_USER=tu-app-id@ttn
TTN_PASS=tu-api-key

# HiveMQ Cloud
HIVEMQ_BROKER=tu-cluster.hivemq.cloud
HIVEMQ_PORT=8883
HIVEMQ_USER=tu-usuario
HIVEMQ_PASS=tu-password

# InfluxDB Cloud
INFLUX_URL=https://tu-region-1-1.aws.cloud2.influxdata.com
INFLUX_TOKEN=tu-token
INFLUX_ORG=tu-org
INFLUX_BUCKET=silobolsas
```

#### Inteligencia Artificial
```bash
cd ../Inteligencia_Artificial
cp .env.example .env
```

Editar `.env`:
```env
# Groq (chatbot — GRATIS sin tarjeta de crédito)
# Obtener en: https://console.groq.com/keys
GROQ_API_KEY=gsk_tu_key_aqui

# OpenRouter (fallback — opcional)
OPENROUTER_API_KEY=sk-or-v1-tu_key_aqui

# InfluxDB (mismas credenciales que Backend)
INFLUX_URL=https://tu-region-1-1.aws.cloud2.influxdata.com
INFLUX_TOKEN=tu-token
INFLUX_ORG=tu-org
INFLUX_BUCKET=silobolsas

# Firebase (datos categóricos)
FIREBASE_CREDENTIALS_PATH=firebase/serviceAccountKey.json
```

#### Frontend Web
```bash
cd ../paginaweb
cp .env.example .env.local
```

Editar `.env.local`:
```env
NEXT_PUBLIC_MOCK_MODE=false
AI_API_URL=http://localhost:8000
```

### 3. Configurar Firebase

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear un nuevo proyecto (o usar uno existente)
3. Habilitar **Authentication** → Email/Password
4. Habilitar **Firestore Database** (modo producción)
5. Ir a **Project Settings** → **Service accounts** → **Generate new private key**
6. Descargar el archivo JSON
7. Renombrarlo a `serviceAccountKey.json`
8. Colocarlo en:
   ```
   Inteligencia_Artificial/firebase/serviceAccountKey.json
   Backend_Arduino/firebase/serviceAccountKey.json
   ```

### 4. Estructura de Firestore

Crear las siguientes colecciones en Firestore (o dejar que la API las cree automáticamente):

```
users/
  └── {uid}/
      ├── email: string
      ├── name: string
      ├── phone: string
      ├── company: string
      ├── createdAt: timestamp
      ├── role: "admin" | "user"
      │
      ├── silos/
      │   └── {silo_id}/
      │       ├── name: string
      │       ├── grainType: string
      │       ├── location: string
      │       ├── tons: number
      │       ├── createdAt: timestamp
      │       └── sensors/
      │           └── {device_id}/
      │               ├── deviceId: string
      │               ├── active: boolean
      │               ├── battery: number
      │               └── lastSeen: timestamp
      │
      └── alerts/
          └── {alert_id}/
              ├── siloId: string
              ├── level: "critical" | "high" | "medium" | "low"
              ├── title: string
              ├── message: string
              ├── timestamp: timestamp
              └── acknowledged: boolean

sensors/ (colección global para lookup rápido)
  └── {device_id}/
      ├── ownerUid: string
      ├── siloId: string
      ├── siloPath: string
      ├── active: boolean
      └── lastSeen: timestamp
```

### 5. Configurar Reglas de Firestore

En Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /silos/{siloId} {
        allow read, write: if request.auth.uid == userId;
        
        match /sensors/{sensorId} {
          allow read, write: if request.auth.uid == userId;
        }
      }
      
      match /alerts/{alertId} {
        allow read, write: if request.auth.uid == userId;
      }
    }
    
    // Sensors collection (global lookup) — solo backend puede escribir
    match /sensors/{deviceId} {
      allow read: if request.auth != null;
      allow write: if false; // Solo el backend (service account) puede escribir
    }
  }
}
```

### 6. Entrenar el Modelo LSTM (Primera Vez)

```bash
cd Inteligencia_Artificial
python main.py
```

Esto generará:
- `models/lstm_agrilion.keras` (modelo entrenado)
- `models/scaler.pkl` (normalizador)

### 7. Levantar con Docker Compose

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto iniciará:
- ✅ AI API en http://localhost:8000
- ✅ Web Frontend en http://localhost:3000
- ✅ Backend scripts (3 procesos en paralelo)

### 8. Verificar que Todo Funciona

```bash
# Health check de la API
curl http://localhost:8000/api/v1/health

# Ver logs de los contenedores
docker-compose logs -f ai-api
docker-compose logs -f web
docker-compose logs -f backend
```

## 🧪 Testing

### 1. Probar el Chatbot

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cómo está el sistema?",
    "silo_id": "SILO_001",
    "session_id": "test-session"
  }'
```

Debería devolver una respuesta del chatbot usando Groq.

### 2. Probar Registro de Usuario

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "name": "Test User"
  }'
```

### 3. Probar el Frontend

Abrir http://localhost:3000 en el navegador.

### 4. Probar la App Móvil

Ver [MOBILE_INTEGRATION.md](MOBILE_INTEGRATION.md) para detalles.

## 🔄 Actualizaciones

### Actualizar Código
```bash
git pull origin main
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Re-entrenar Modelo
```bash
cd Inteligencia_Artificial
python main.py --epochs 100
docker-compose restart ai-api
```

## 🐛 Troubleshooting

### Problema: "Firebase no disponible"
**Solución:** Verificar que `firebase/serviceAccountKey.json` existe y es válido.

### Problema: "GROQ_API_KEY not set"
**Solución:** Verificar que `GROQ_API_KEY` está en `Inteligencia_Artificial/.env`.

### Problema: "InfluxDB connection failed"
**Solución:** Verificar credenciales de InfluxDB y que el bucket existe.

### Problema: "MQTT connection failed"
**Solución:** Verificar credenciales de HiveMQ y que el broker está accesible.

### Problema: "Model not found"
**Solución:** Ejecutar `python main.py` en `Inteligencia_Artificial/` para entrenar el modelo.

## 📊 Monitoreo

### Logs en Tiempo Real
```bash
docker-compose logs -f
```

### Métricas de Docker
```bash
docker stats
```

### Health Checks
```bash
# API
curl http://localhost:8000/api/v1/health

# Web
curl -I http://localhost:3000

# InfluxDB (si es local)
curl http://localhost:8086/health
```

## 🔐 Seguridad

### Producción

Para producción, considerar:

1. **HTTPS**: Usar un reverse proxy (nginx/traefik) con certificados SSL
2. **Secrets**: Usar Docker Secrets o un servicio de gestión de secretos
3. **Firewall**: Restringir acceso a puertos internos
4. **Rate Limiting**: Implementar rate limiting en la API
5. **CORS**: Configurar CORS correctamente en la API
6. **Backups**: Configurar backups automáticos de InfluxDB y Firestore

### Variables de Entorno en Producción

```env
# Usar variables de entorno en lugar de archivos .env
docker-compose up -d \
  -e GROQ_API_KEY=gsk_... \
  -e INFLUX_URL=... \
  -e INFLUX_TOKEN=...
```

## 📈 Escalabilidad

### Horizontal Scaling

Para escalar horizontalmente:

1. **AI API**: Múltiples instancias detrás de un load balancer
2. **Backend**: Separar los 3 scripts en contenedores independientes
3. **InfluxDB**: Usar InfluxDB Cloud o cluster
4. **Firebase**: Ya es escalable (managed service)

### Vertical Scaling

Aumentar recursos de los contenedores en `docker-compose.yml`:

```yaml
services:
  ai-api:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
```

## 📚 Recursos Adicionales

- [Documentación de Groq](https://console.groq.com/docs)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de InfluxDB](https://docs.influxdata.com/)
- [Documentación de FastAPI](https://fastapi.tiangolo.com/)
- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Docker](https://docs.docker.com/)

---

**Última actualización:** 2026-08-18  
**Versión:** 2.0.0
