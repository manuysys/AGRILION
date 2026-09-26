# 🔑 ¿De dónde sale cada credencial?

Guía rápida: qué es cada valor, en qué consola se obtiene y dónde va.

---

## 1. TTN (The Things Network) → `Backend_Arduino/.env`

Consola: <https://console.cloud.thethings.network> → elegir cluster
(por defecto **Europe 1**; si la app está en Australia, elegir ese cluster).

| Variable | De dónde sale | Cómo |
|----------|---------------|------|
| `TTN_APP_ID` | Applications → tu aplicación → **General information → Application ID** | Copiar tal cual (ej: `agrilion`) |
| `TTN_USER` | Es el Application ID + `@ttn` | Ej: `agrilion@ttn` |
| `TTN_PASS` | Applications → tu app → **API keys → Add API key** | Nombre: `agrilion-mqtt`, Rights: **Read application traffic**. Copiar la key (empieza con `NNSXS.`) — **se muestra una sola vez** |
| `TTN_BROKER` | Según el cluster elegido arriba | Europe 1: `eu1.cloud.thethings.network` · North America: `nam1.cloud.thethings.network` · Australia: `au1.cloud.thethings.network` |
| `TTN_PORT` | Puerto TLS de TTN | **`8883`** (el 1883 fue cerrado por TTN: corta la conexión) |

> La API key tiene que crearse **dentro de la aplicación** (Applications → tu app
> → API keys). Si se crea en "Personal API keys" (nivel usuario), el MQTT
> responde **Not authorized**.
>
> El AppKey del firmware (OTAA) se rota aparte: ver
> [`ROTACION_CREDENCIALES.md`](./ROTACION_CREDENCIALES.md).

---

## 2. HiveMQ Cloud → `Backend_Arduino/.env`

Consola: <https://console.hivemq.cloud>

| Variable | De dónde sale | Cómo |
|----------|---------------|------|
| `HIVEMQ_BROKER` | Clusters → tu cluster → **Overview / Details → Cluster URL** | Ej: `abc123.s1.eu.hivemq.cloud` (sin `mqtt://` ni puerto) |
| `HIVEMQ_PORT` | Puerto TLS estándar | `8883` |
| `HIVEMQ_USER` | Cluster → **Access Management → Credentials** | Crear/ver usuario (ej: `agrilion`) |
| `HIVEMQ_PASS` | Igual que arriba | La contraseña del usuario. Si no la recordás, crear una credencial nueva |

---

## 3. InfluxDB → `Backend_Arduino/.env` e `Inteligencia_Artificial/.env`

**Local (Docker, ya configurado por nosotros):**

| Variable | Valor |
|----------|-------|
| `INFLUX_URL` / `INFLUX_HOST` | `http://localhost:8181` |
| `INFLUX_DATABASE` / `INFLUX_BUCKET` | `silobolsas` |
| `INFLUX_TOKEN` | Ya cargado en los `.env` (token admin generado en el contenedor) |

Si algún día se usa InfluxDB Cloud 3: Cloud → **Load Data → API Tokens** → copiar
el token y la URL de la instancia.

---

## 4. Firebase → web + backends

Consola: <https://console.firebase.google.com>

### 4.1 Config web → `paginaweb/.env.local`

**Configuración del proyecto (⚙️) → General → Tus apps → Web (`</>`)** →
si no hay app web, crearla → sección **SDK setup and configuration → Config**.
De ese objeto `firebaseConfig` salen:

| `.env.local` | `firebaseConfig` |
|--------------|------------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `appId` |

### 4.2 Clave de administrador → backends

**Configuración del proyecto → Cuentas de servicio → Firebase Admin SDK →
Generar nueva clave privada** → descargar el JSON → guardarlo como
`serviceAccountKey.json` en **las dos** carpetas:

```
Backend_Arduino/firebase/serviceAccountKey.json
Inteligencia_Artificial/firebase/serviceAccountKey.json
```

### 4.3 Android → `AppCelular/app/`

**Configuración del proyecto → General → Tus apps → Android** →
registrar `com.example.app1` → descargar `google-services.json` → guardarlo en
`AppCelular/app/google-services.json`.

---

## 5. Verificación final

```bash
python scripts/check_env.py      # TTN, HiveMQ, Influx, web
python scripts/check_mqtt.py     # conexión y auth MQTT (TTN + HiveMQ)
python scripts/check_firebase.py # serviceAccountKey + Auth + Firestore
python scripts/check_influx.py   # Influx local
python scripts/e2e_simulation.py # simulación completa sin hardware
```

Guía completa de Firebase: [`FIREBASE_SETUP.md`](./FIREBASE_SETUP.md).
