# Integración Android — Agrilion

Estado de la app Android integrada al sistema real (Firebase + AI API + InfluxDB).

## Qué quedó integrado

- Login y registro con Firebase Auth.
- Perfil de usuario en Firestore (`users/{uid}`).
- Gate de autenticación: la app no muestra el dashboard sin sesión.
- Silos reales desde la AI API:
  - `GET /api/v1/silos/overview`
  - `GET /api/v1/silos/{id}/history?hours=24`
  - `GET /api/v1/silos/{id}/prediction`
- Polling automático cada 20 segundos.
- Merge entre las lecturas de la API y los metadatos del usuario en Firestore
  (nombre, tipo de grano, ubicación y toneladas).
- Dashboard con estados reales, dona de riesgo y conteo de silos por grano.
- Mapa de silos con GPS real (osmdroid + OpenStreetMap) y navegación al detalle
  al tocar un marcador.
- Mis Silos con búsqueda, métricas reales, edición y eliminación en Firestore.
- Detalle con temperatura, humedad, CO₂, presión, riesgo, histórico y predicción LSTM.
- Chat contra el LLM local (`qwen2.5:14b`), con fallback local si la API no responde.
- Notificaciones derivadas de silos en `ALERTA` o `CRITICO`.
- Recomendaciones calculadas con las lecturas reales.
- Perfil con edición de nombre/teléfono persistida y restablecimiento de contraseña.
- Alta y baja de silos del usuario en Firestore.
- Configuración de la URL de la API desde la pantalla **Configuración**.

## Configuración de la API

La URL se puede cambiar en la app:

**Menú lateral → Configuración → Conexión API**

- Emulador: `http://10.0.2.2:8000/`
- Celular físico: IP local de la PC, por ejemplo `http://192.168.1.100:8000/`
- Producción: URL HTTPS del backend.

El cambio se guarda en `SharedPreferences` y se aplica a las requests siguientes
sin reiniciar la app. El botón **Probar conexión** llama a `/api/v1/health`.

El manifiesto permite tráfico HTTP (`usesCleartextTraffic="true"`) para pruebas
locales. Para producción conviene HTTPS y quitarlo.

## Mapa GPS

La tarjeta **MAPA DE SILOS** del Dashboard usa `SiloMapCard.kt` con
`org.osmdroid:osmdroid-android:6.1.20`.

- Tiles OpenStreetMap estándar con `TilesOverlay.INVERT_COLORS` para el tema
  oscuro; no requiere API key.
- User-Agent identificable exigido por OSM:
  `AgrilionAndroid/1.0 (+https://github.com/manuysys/AGRILION)`.
- Muestra marcadores solo para silos con `gpsHasFix=true` y coordenadas.
- Al tocar un marcador navega a `silo_detail/{id}`.
- Si todavía no hay fix, muestra un estado vacío con la explicación.
- Los datos GPS llegan por `SiloOverviewDto` (`latitude`, `longitude`,
  `gps_fix`, `gps_has_fix`, `gps_satellites`, `gps_hdop`, `gps_age_min`) y,
  como respaldo, desde los metadatos del silo en Firestore.
- Si la última lectura tiene más de 6 horas, el silo se muestra como
  `Sin Datos` y el dashboard avisa que no está enviando datos. La lectura
  histórica sigue visible en el detalle.

Prueba manual realizada: build `assembleDebug`, instalación en emulador, login
de prueba, marcador visible sobre Buenos Aires y click al detalle. El usuario
de prueba se eliminó después.

## Requisitos para probar

1. Backend de IA en ejecución:

   ```powershell
   cd Inteligencia_Artificial
   uvicorn api.app:app --host 0.0.0.0 --port 8000
   ```

2. InfluxDB, puentes MQTT y placa transmitiendo (si se quieren datos reales).
3. Emulador Android o celular con la app instalada.

## Compilar

```powershell
cd AppCelular
.\gradlew.bat assembleDebug --no-daemon
```

Para un teléfono físico se puede fijar la URL de la API en el build:

```powershell
.\gradlew.bat assembleDebug --no-daemon `
  -PapiBaseUrl=http://192.168.68.50:8000/
```

APK generado:

```text
AppCelular/app/build/outputs/apk/debug/app-debug.apk
```

Guía de instalación y conexión: `docs/INSTALACION_APK.md`.

## Flujo de prueba manual

1. Abrir la app y registrarse o iniciar sesión.
2. Verificar que el dashboard muestre el silo real (`SB-E2E01` en el entorno E2E).
3. Bajar hasta **MAPA DE SILOS**: con GPS fijo debe aparecer el marcador; si no
   hay fix, debe verse el estado vacío. Tocar el marcador y comprobar que abre
   el detalle.
4. Entrar a **Mis Silos** y abrir el detalle.
5. Confirmar histórico de 24 h y predicción LSTM.
6. Abrir el asistente y preguntar por el estado de un silo.
7. Probar **Configuración → Conexión API → Probar conexión**.
8. Editar nombre/teléfono en Perfil y verificar el cambio en Firestore.
9. Cerrar sesión.

## Limitaciones conocidas

- La app envía el Firebase ID token en cada request. La API valida el token y
  filtra el overview por los silos del usuario; no se muestran silos ajenos.
- El alta de un silo crea un documento con ID aleatorio. Para asociarlo a un
  sensor físico hay que registrar el mapeo global `sensors/{deviceId}` con el
  mismo `siloId` (hoy lo hace el backend/administrador, no la app).
- La build debug permite HTTP local; la release exige HTTPS. Configurar la URL
  de producción antes de generar el APK final.
- Las alertas de la pantalla de notificaciones se derivan del estado/riesgo de
  los silos; no se listan aún documentos de `users/{uid}/alerts`.
- Las cotizaciones BCR del dashboard son valores de referencia; no se actualizan
  en tiempo real.
- No hay tests automatizados de Android. La verificación fue build + pruebas
  manuales en emulador.
- La placa todavía no logró un fix GPS real bajo techo. El mapa y los marcadores
  se probaron con un silo de prueba con coordenadas; falta validar la cadena
  completa al aire libre.
- La eliminación de cuenta desde la app se retiró porque requiere un flujo de
  reautenticación y borrado del perfil; queda pendiente para producción.

## Archivos clave

- `data/ApiConfig.kt`: URL persistente e interceptor dinámico.
- `data/SilosApiService.kt`: endpoints de silos.
- `data/SilosDataManagerBaseDeDatos.kt`: polling, merge y detalle.
- `data/AuthManager.kt`: Auth, perfil, silos y recuperación de contraseña.
- `data/ChatApiServiceBaseDeDatos.kt`: chat y health.
- `MainActivity.kt`: gate de sesión, polling y navegación.
- `ui/screens/SiloMapCard.kt`: mapa osmdroid y marcadores GPS.
- `ui/screens/*`: dashboard, silos, detalle, chat, perfil y configuración.
