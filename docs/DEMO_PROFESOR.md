# Demo para el profesor — AGRILION

Guía de presentación con **hardware desconectado** y con datos reales.

## Estado actual

Las placas se desconectaron después de juntar datos. Por eso:

- El dashboard real muestra la **última lectura conocida** y un aviso de
  **“Sin datos en vivo”** cuando pasan más de 6 horas.
- La app Android hace lo mismo: marca el silo como `Sin datos` y muestra la
  antigüedad de la última lectura.
- El mapa real queda sin marcadores si no hubo fix GPS.
- El dashboard real exige login; el modo demo es público.
- Para mostrar todas las funciones sin hardware está el **modo demostración**:
  6 silobolsas simuladas, estados variados y coordenadas de ejemplo.

## URLs

| Versión | URL | Datos |
|---------|-----|-------|
| Real (Vercel) | https://agrilion-live.vercel.app/dashboard | Datos reales vía túnel; requiere login |
| Mock (Vercel) | https://paginaweb-seven-mu.vercel.app/dashboard | Datos sintéticos de 6 silobolsas |
| Local | http://localhost:3000/dashboard | Real o mock según `NEXT_PUBLIC_MOCK_MODE` |
| API IA | http://localhost:8000/docs | Documentación interactiva |
| InfluxDB UI | http://localhost:8888 | Historial y consultas |
| TTN | https://nam1.cloud.thethings.network/console/applications/smisia-aplication | Uplinks (si se reconecta la placa) |
| Firebase | https://console.firebase.google.com/project/agrilion/firestore | Estado/alertas |

> La versión real de Vercel depende de que esta notebook esté encendida, con
> Docker, los puentes de Python, la API y el túnel de Cloudflare corriendo.
> Si el túnel se reinicia, cambia la URL y hay que actualizar `AI_API_URL` en
> Vercel y volver a desplegar.

## Demo sin hardware (recomendada)

### Web local en modo demostración

```powershell
cd paginaweb
$env:NEXT_PUBLIC_MOCK_MODE = "true"
npm run dev
```

Abrir `http://localhost:3000/dashboard`.

Qué se muestra:

- Banner azul **“Modo demostración”**.
- 6 silobolsas con estados normal, atención, crítico y offline.
- Mapa con 6 coordenadas simuladas.
- Alertas, histórico y chat contra la API si está levantada.
- El mapa se habilita sin login **solo en modo demo**, porque las coordenadas
  son ficticias.

Para volver al modo real:

```powershell
Remove-Item Env:NEXT_PUBLIC_MOCK_MODE
npm run dev
```

O usar la URL mock de Vercel.

### App Android

La app no tiene modo mock propio. Para la demo se puede:

1. Mostrar capturas o un video pregrabado de la app con datos reales.
2. Usar la API real con las últimas lecturas; el dashboard marcará los silos
   como `Sin datos` y mostrará la antigüedad.
3. Si se quiere una demo en vivo completa, crear un usuario/silo de prueba en
   Firestore y cargar lecturas históricas en InfluxDB.

## Demo con datos reales históricos

Servicios mínimos:

1. Docker: `agrilion-influxdb3` y `agrilion-influxdb3-ui`.
2. API IA:

   ```powershell
   cd Inteligencia_Artificial
   uvicorn api.app:app --host 0.0.0.0 --port 8000
   ```

3. Dashboard local en modo real.

El dashboard debe mostrar:

- Banner ámbar **“1 de 1 sensores sin datos recientes”**.
- Hero **“Sin datos en vivo”**.
- `Última lectura recibida hace X h`.
- Alerta de **“Sensor sin datos recientes”**.
- Detalle del silo con el histórico de 24 h.

Eso demuestra que el sistema distingue datos reales de datos viejos, en lugar de
mostrar un falso “online”.

## Guion de demostración (6–8 minutos)

### 1. Landing (1 min)

- Mostrar hero: propuesta de valor y botones **“Ver dashboard”** y
  **“Cómo funciona”**.
- Bajar a **“Cómo funciona”**: sensores → LoRaWAN/TTN → InfluxDB/IA → app/web.

### 2. Dashboard en modo demo (2 min)

- Abrir la versión mock.
- Mostrar banner de demostración, 6 silos y estados variados.
- Abrir **Mapa de silos** y explicar que las coordenadas son de ejemplo.
- Entrar al silo crítico y mostrar métricas, riesgo, gráficos y recomendación.
- Abrir alertas y el centro de IA.

### 3. Dashboard real / estado offline (1–2 min)

- Abrir la versión real.
- Iniciar sesión con la cuenta dueña de `SB-E2E01`.
- Mostrar el aviso de datos antiguos y la última lectura.
- Explicar que la API filtra por usuario: esa cuenta solo ve sus silos.
- Mostrar el detalle con histórico y, si está disponible, predicción LSTM.

### 4. Arquitectura y hardware (1–2 min)

- Mostrar la placa, sensores y antena (aunque esté desconectada).
- Explicar CubeCell + LoRaWAN AU915 + TTN + HiveMQ.
- Mostrar el firmware y el payload v2 de 23 bytes con GPS.
- Aclarar que el GPS Air530Z no logró fix bajo techo; el mapa real necesita
  vista al cielo o antena externa.

### 5. Cierre (1 min)

- Logros: monitoreo en tiempo real, histórico, riesgo, IA, mapa, app y web.
- Seguridad: dashboard con sesión, API con Firebase ID token, filtrado por
  propietario e ingesta interna con clave.
- Limitaciones: GPS sin fix real, frecuencia de 20 s para pruebas y dependencia
  del túnel para el deploy real.
- Próximos pasos: reconectar placa, ajustar duty cycle del GPS y desplegar el
  backend sin depender del túnel local.

## Valores de referencia (últimas horas con hardware)

| Variable | Rango observado | Comentario |
|----------|-----------------|------------|
| Temperatura | 18.3–24.0 °C | Plausible; puede subir por autocalentamiento |
| Humedad ambiente | 61.6–70.3 % RH | No es humedad del grano |
| Presión | ~1019–1021 hPa | Viaja en el payload, no se grafica |
| CO₂ | ~980 ppm | Lecturas reales del SCD41 en modo periódico; si falla se muestra “Sin dato” |
| Aceleración normal | 0.6–1.0 m/s² | Ruido/vibración normal |
| Impactos | ~9.8 m/s² | Score 35/WARNING en esa lectura |
| GPS | Sin fix | `sats=0`, HDOP 25.5 bajo techo |

## Si algo falla

- **La web real no carga datos:** revisar el túnel y la API.
- **No llegan uplinks:** TTN Live Data, gateway y placa.
- **El túnel cambió de URL:** actualizar `AI_API_URL` en Vercel y redeploy.
- **Login/registro falla en Vercel:** agregar el dominio en Firebase
  Authentication → Authorized domains.
- **Plan B:** versión mock de Vercel + capturas/video.
- **La demo mock no muestra el mapa:** verificar que la build tenga
  `NEXT_PUBLIC_MOCK_MODE=true` y que esté desplegada la versión actual.

## Seguridad

- El dashboard real exige login de Firebase; sin sesión redirige a `/login`.
- La API valida el ID token y filtra los silos por usuario. La app Android envía
  el mismo token automáticamente.
- `/api/v1/ingest` exige `X-Ingest-Key`; el frontend no conoce esa clave.
- No mostrar `.env`, tokens de TTN/HiveMQ/Influx, `INGEST_API_KEY` ni la service
  account de Firebase.
- La URL real es pública, pero los datos requieren sesión; no subir credenciales
  al repositorio.
- Al terminar, detener `cloudflared` para cerrar el túnel público.
