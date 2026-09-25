# 📱 Integración de la App Móvil con Agrilion

## Arquitectura

```
┌─────────────────┐         HTTP/HTTPS         ┌──────────────────┐
│  Android App    │  ←──────────────────────→  │   AI API         │
│  (Kotlin)       │   Retrofit + Firebase Auth │   (FastAPI)      │
└─────────────────┘                            └──────────────────┘
         ↑                                              ↑
         │ Firebase SDK (directo)                       │ Firebase Admin SDK
         ↓                                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Firebase Cloud                               │
│  ├── Auth (usuarios)                                           │
│  └── Firestore (silos, sensores, alertas — datos categóricos) │
└─────────────────────────────────────────────────────────────────┘
```

## URLs de la API

### Desarrollo (emulador Android)
```
BASE_URL = http://10.0.2.2:8000
```
`10.0.2.2` es el alias del host local de la PC visto desde el emulador Android.

### Dispositivo físico (misma red WiFi)
```
BASE_URL = http://<IP_DE_TU_PC>:8000
```
Reemplazá `<IP_DE_TU_PC>` con la IP local de tu computadora (ej: `192.168.1.100`).

### Producción
```
BASE_URL = https://api.agrilion.app
```

## Endpoints Disponibles

### 🔐 Autenticación

#### `POST /api/v1/auth/register`
Registra un nuevo usuario.

**Request:**
```json
{
  "email": "juan@example.com",
  "password": "securepass123",
  "name": "Juan Pérez",
  "phone": "+5491123456789",
  "company": "Agrícola SRL"
}
```

**Response:**
```json
{
  "status": "ok",
  "user": {
    "uid": "abc123...",
    "email": "juan@example.com",
    "name": "Juan Pérez",
    "createdAt": "2026-01-15T10:30:00"
  }
}
```

#### `POST /api/v1/auth/verify`
Verifica un Firebase ID token (útil después del login en la app).

**Request:**
```json
{
  "idToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "status": "ok",
  "uid": "abc123...",
  "email": "juan@example.com",
  "profile": {
    "name": "Juan Pérez",
    "phone": "+5491123456789",
    "company": "Agrícola SRL",
    "role": "user"
  }
}
```

### 🌾 Silos

#### `GET /api/v1/users/{uid}/silos`
Lista todos los silos del usuario.

**Response:**
```json
{
  "status": "ok",
  "silos": [
    {
      "silo_id": "SB-12345",
      "name": "Silo Norte",
      "grainType": "soja",
      "location": "Lote 5",
      "tons": 120.5,
      "createdAt": "...",
      "sensors": [
        {
          "deviceId": "cubecell-001",
          "active": true,
          "battery": 95,
          "lastSeen": "..."
        }
      ],
      "activeSensors": 1
    }
  ],
  "total": 1
}
```

#### `POST /api/v1/users/{uid}/silos`
Crea una nueva silobolsa.

**Request:**
```json
{
  "name": "Silo Sur",
  "grain_type": "maíz",
  "location": "Lote 8",
  "tons": 150.0
}
```

**Response:**
```json
{
  "status": "ok",
  "silo_id": "SB-12346"
}
```

#### `GET /api/v1/users/{uid}/silos/{silo_id}`
Obtiene detalle de un silo específico.

### 📡 Sensores

#### `POST /api/v1/users/{uid}/silos/{silo_id}/sensors`
Registra un sensor y lo asocia a un silo.

**Request:**
```json
{
  "device_id": "cubecell-002",
  "battery": 98
}
```

#### `GET /api/v1/sensors/{device_id}`
Obtiene info de un sensor por device_id (lookup global).

### 🤖 Chatbot

#### `POST /api/v1/chat`
Envía un mensaje al chatbot de IA.

**Request:**
```json
{
  "message": "¿Cómo está el silo SB-12345?",
  "silo_id": "SB-12345",
  "session_id": "android-client"
}
```

**Response:**
```json
{
  "response": "El silo SB-12345 presenta condiciones normales...",
  "session_id": "android-client",
  "latency_ms": 245.3,
  "context_used": {...}
}
```

### 🔔 Alertas

#### `GET /api/v1/users/{uid}/alerts`
Lista alertas del usuario (opcionalmente filtrar por `?acknowledged=false`).

#### `POST /api/v1/users/{uid}/alerts/{alert_id}/acknowledge`
Marca una alerta como reconocida.

## Flujo de Integración en la App

### 1. Login / Registro
```kotlin
// Usar Firebase Auth directamente (SDK de Firebase en la app)
FirebaseAuth.getInstance().signInWithEmailAndPassword(email, password)
    .addOnCompleteListener { task ->
        if (task.isSuccessful) {
            val user = FirebaseAuth.getInstance().currentUser
            val uid = user?.uid
            
            // Obtener ID token para enviar al backend
            user?.getIdToken(true)?.addOnCompleteListener { tokenTask ->
                val idToken = tokenTask.result?.token
                
                // Verificar con el backend
                retrofit.post("/api/v1/auth/verify", mapOf("idToken" to idToken))
            }
        }
    }
```

### 2. Cargar Silos
```kotlin
// Después del login, cargar silos del usuario
val uid = FirebaseAuth.getInstance().currentUser?.uid
retrofit.get("/api/v1/users/$uid/silos")
    .enqueue(object : Callback<SilosResponse> {
        override fun onResponse(...) {
            // Actualizar UI con lista de silos
        }
    })
```

### 3. Chatbot
```kotlin
// Enviar mensaje al chatbot
val request = ChatRequest(
    message = "¿Hay alguna alerta activa?",
    silo_id = "SB-12345",
    session_id = "android-${System.currentTimeMillis()}"
)

retrofit.post("/api/v1/chat", request)
    .enqueue(object : Callback<ChatResponse> {
        override fun onResponse(...) {
            // Mostrar respuesta en la UI
        }
    })
```

### 4. Leer Datos de Sensores (Opcional — Firebase Realtime)
La app puede escuchar cambios en Firestore directamente:
```kotlin
val db = FirebaseFirestore.getInstance()
val uid = FirebaseAuth.getInstance().currentUser?.uid

db.collection("users").document(uid!!)
    .collection("silos")
    .addSnapshotListener { snapshot, error ->
        // Actualizar UI cuando cambian los silos
    }
```

## Configuración en Android

### 1. `AndroidManifest.xml`
Ya configurado:
```xml
<uses-permission android:name="android.permission.INTERNET" />

<application
    android:networkSecurityConfig="@xml/network_security_config"
    android:usesCleartextTraffic="true"
    ...>
```

### 2. `network_security_config.xml`
Ya configurado para permitir tráfico HTTP en desarrollo:
```xml
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.0.0/16</domain>
    </domain-config>
</network-security-config>
```

### 3. Retrofit Setup
Ya configurado en `ChatApiServiceBaseDeDatos.kt`:
```kotlin
private const val BASE_URL = "http://10.0.2.2:8000/"

fun create(): ChatApiServiceBaseDeDatos {
    return Retrofit.Builder()
        .baseUrl(BASE_URL)
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(ChatApiServiceBaseDeDatos::class.java)
}
```

**Para cambiar la URL (dispositivo físico):**
```kotlin
private const val BASE_URL = "http://192.168.1.100:8000/"
```

### 4. Firebase SDK
Agregar a `app/build.gradle.kts`:
```kotlin
dependencies {
    // Firebase
    implementation(platform("com.google.firebase:firebase-bom:32.7.0"))
    implementation("com.google.firebase:firebase-auth")
    implementation("com.google.firebase:firebase-firestore")
}
```

Y colocar `google-services.json` en `app/` (descargar desde Firebase Console).

## Testing

### 1. Verificar que la API está corriendo
```bash
# En la PC
curl http://localhost:8000/api/v1/health
```

Debería devolver:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "model_loaded": true,
  "timestamp": "..."
}
```

### 2. Probar desde el emulador Android
```kotlin
// En MainActivity.kt o donde corresponda
val client = OkHttpClient()
val request = Request.Builder()
    .url("http://10.0.2.2:8000/api/v1/health")
    .build()

client.newCall(request).enqueue(object : Callback {
    override fun onResponse(call: Call, response: Response) {
        Log.d("API", "Response: ${response.body?.string()}")
    }
    
    override fun onFailure(call: Call, e: IOException) {
        Log.e("API", "Error: ${e.message}")
    }
})
```

### 3. Probar el chatbot
```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "¿Cómo está el sistema?",
    "silo_id": "SILO_001",
    "session_id": "test"
  }'
```

## Troubleshooting

### ❌ "Network error" en la app
- Verificar que la API está corriendo: `curl http://localhost:8000/api/v1/health`
- Verificar que `network_security_config.xml` permite `10.0.2.2`
- Si usás dispositivo físico, cambiar `10.0.2.2` por la IP de tu PC

### ❌ "Firebase not initialized"
- Verificar que `firebase/serviceAccountKey.json` existe en `Inteligencia_Artificial/`
- Verificar que las credenciales de Firebase en `.env` son correctas

### ❌ "Chatbot no responde"
- Verificar que `GROQ_API_KEY` está configurada en `Inteligencia_Artificial/.env`
- Verificar que la AI API está corriendo y el modelo está cargado

### ❌ "No se pueden crear usuarios"
- Verificar que Firebase Auth está habilitado en Firebase Console
- Verificar que el método de autenticación "Email/Password" está activado

## Próximos Pasos

1. **Agregar Firebase SDK a la app** (actualmente no está en las dependencias)
2. **Implementar login screen** en la app (actualmente no hay UI de login)
3. **Sincronización en tiempo real** con Firestore listeners
4. **Notificaciones push** con Firebase Cloud Messaging (FCM)
5. **Offline support** con Firestore persistence

---

**Última actualización:** 2026-01-15
