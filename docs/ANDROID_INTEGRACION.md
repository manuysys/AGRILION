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

APK generado:

```text
AppCelular/app/build/outputs/apk/debug/app-debug.apk
```

## Flujo de prueba manual

1. Abrir la app y registrarse o iniciar sesión.
2. Verificar que el dashboard muestre el silo real (`SB-E2E01` en el entorno E2E).
3. Entrar a **Mis Silos** y abrir el detalle.
4. Confirmar histórico de 24 h y predicción LSTM.
5. Abrir el asistente y preguntar por el estado de un silo.
6. Probar **Configuración → Conexión API → Probar conexión**.
7. Editar nombre/teléfono en Perfil y verificar el cambio en Firestore.
8. Cerrar sesión.

## Limitaciones conocidas

- `/api/v1/silos/overview` devuelve todos los silos. La app todavía no filtra
  por propietario ni envía el ID token; el backend debe agregar autenticación y
  autorización por usuario.
- El alta de un silo crea un documento con ID aleatorio. Para asociarlo a un
  sensor físico hay que registrar el mapeo global `sensors/{deviceId}` con el
  mismo `siloId` (hoy lo hace el backend/administrador, no la app).
- Las alertas de la pantalla de notificaciones se derivan del estado/riesgo de
  los silos; no se listan aún documentos de `users/{uid}/alerts`.
- Las cotizaciones BCR del dashboard son valores de referencia; no se actualizan
  en tiempo real.
- No hay tests automatizados de Android. La verificación fue build + pruebas
  manuales en emulador.
- La eliminación de cuenta desde la app se retiró porque requiere un flujo de
  reautenticación y borrado del perfil; queda pendiente para producción.

## Archivos clave

- `data/ApiConfig.kt`: URL persistente e interceptor dinámico.
- `data/SilosApiService.kt`: endpoints de silos.
- `data/SilosDataManagerBaseDeDatos.kt`: polling, merge y detalle.
- `data/AuthManager.kt`: Auth, perfil, silos y recuperación de contraseña.
- `data/ChatApiServiceBaseDeDatos.kt`: chat y health.
- `MainActivity.kt`: gate de sesión, polling y navegación.
- `ui/screens/*`: dashboard, silos, detalle, chat, perfil y configuración.
