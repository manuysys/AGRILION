# Agrilion

Sistema IoT de monitoreo para silobolsas. Mide temperatura, humedad, presión,
impacto y CO₂, y presenta el estado de cada silo en una app Android y un
dashboard web.

## Arquitectura

```text
Sensores SHT30 / BME280 / ADXL345 / SCD4x
              │ I2C
       CubeCell HTCC-AB02S + GPS Air530Z
              │ LoRaWAN AU915
            Gateway → TTN
              │ MQTT/TLS
        TTN_MQTT.py → HiveMQ
              │
   MQTT_INFLUXDB_FIREBASE.py
        ├── InfluxDB 3 (series temporales)
        └── Firebase (estado y ubicación)
              │
   API FastAPI + riesgo + LSTM
              │
   Next.js (web) + Android (app)
```

## Componentes

| Carpeta | Descripción |
|---------|-------------|
| `Backend_Arduino/` | Firmware CubeCell, payload v2, decoder TTN y puentes MQTT |
| `Inteligencia_Artificial/` | API FastAPI, riesgo, modelo LSTM, chat e InfluxDB |
| `AppCelular/` | App Android con Firebase, dashboard, mapa y chat |
| `paginaweb/` | Dashboard y landing en Next.js |
| `docs/` | Integración Android, GPS y guía de demo |

## Funcionalidades

- Lecturas en tiempo real y persistencia histórica.
- Dashboard con estado global, riesgo, alertas, histórico y mapa.
- App Android con autenticación, mis silos, detalle, chat y mapa.
- GPS Air530Z con payload v2 y visualización en mapa.
- Detección de sensores sin datos recientes (más de 6 h).
- Modo demostración con seis silobolsas simuladas y coordenadas de ejemplo.
- Chat con IA y fallback por reglas.
- Dashboard real protegido con sesión de Firebase; la API filtra cada usuario
  por sus propios silos.
- Ingesta interna protegida con `INGEST_API_KEY`; el frontend nunca la recibe.

## Demo

- **Mock web:** https://paginaweb-seven-mu.vercel.app/dashboard
- **Real:** https://agrilion-live.vercel.app/dashboard (requiere login, túnel y API local)
- **Guía de presentación:** `docs/DEMO_PROFESOR.md`

El modo demo es público y usa datos simulados. El dashboard real exige una
sesión de Firebase; cada usuario ve únicamente sus silos. El formulario de
login/registro crea una cookie httpOnly con el ID token para que el servidor
pueda consultar la API sin exponer el token al JavaScript de la página.

Modo demo local:

```powershell
cd paginaweb
$env:NEXT_PUBLIC_MOCK_MODE = "true"
npm run dev
```

Para volver al modo real:

```powershell
Remove-Item Env:NEXT_PUBLIC_MOCK_MODE
npm run dev
```

## Ejecutar el backend

```powershell
cd Inteligencia_Artificial
uvicorn api.app:app --host 0.0.0.0 --port 8000
```

La API queda documentada en `http://localhost:8000/docs`. Los puentes de TTN,
InfluxDB y Firebase se describen en `Backend_Arduino/` y en la guía de demo.

Configurá la misma `INGEST_API_KEY` en `Inteligencia_Artificial/.env` y en
`Backend_Arduino/.env`. La API la exige en `X-Ingest-Key`; sin esa clave el
endpoint de ingesta responde 401/503.

## App Android

```powershell
cd AppCelular
.\gradlew.bat assembleDebug --no-daemon
```

APK:

```text
AppCelular/app/build/outputs/apk/debug/app-debug.apk
```

La URL de la API se configura desde **Configuración → Conexión API**. Para el
emulador se usa `http://10.0.2.2:8000/`.

## Firmware

El sketch está en `Backend_Arduino/Codigo_TransmisionLoraWAN_Sensores/`.
Compila con:

```powershell
arduino-cli compile --upload -p COM4 `
  --fqbn CubeCell:CubeCell:CubeCell-GPS `
  --board-options "LORAWAN_REGION=2,LORAWAN_RGB=0,LORAWAN_DebugLevel=2" .
```

Detalles de alimentación, payload y GPS: README del sketch y
`docs/GPS_INTEGRACION.md`.

## Estado y limitaciones

- El SCD4x usa medición periódica y entrega CO₂ real (alrededor de 980 ppm en
  las últimas lecturas). Si no hay una medición válida, el frontend muestra
  “Sin dato”, no 0 ppm.
- El GPS no logró un fix real bajo techo. Necesita vista al cielo o antena
  externa.
- La frecuencia de transmisión está en 20 s para pruebas; en producción conviene
  aumentarla para ahorrar batería.
- La versión real de Vercel depende del túnel a la API local; el mock es
  independiente.
- La app debug permite HTTP local; la build release exige HTTPS.

## Documentación

- `docs/SEGURIDAD.md`
- `docs/DEMO_PROFESOR.md`
- `docs/GPS_INTEGRACION.md`
- `docs/ANDROID_INTEGRACION.md`
- `Backend_Arduino/Codigo_TransmisionLoraWAN_Sensores/README.md`

## Autor

Juan Manuel Iglesias — Proyecto Agrilion, 2026.

Contacto: eest4.74.agrilion@gmail.com
