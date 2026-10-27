# Seguridad — Agrilion

Estado de la seguridad de la aplicación y pasos para operarla.

## Flujo de autenticación

```text
Firebase Auth (navegador/app)
        │ ID token
        ├── Web: cookie httpOnly agrilion_session
        │       └── Next.js server → Authorization: Bearer
        └── Android: OkHttp interceptor → Authorization: Bearer
                                      │
                                      ▼
                         FastAPI valida con Firebase Admin
                                      │
                         Filtra por uid → silos del usuario
```

- El dashboard real exige sesión; `/dashboard` redirige a `/login` si no hay
  cookie válida.
- El modo demo (`NEXT_PUBLIC_MOCK_MODE=true`) es público y no usa datos reales.
- La cookie web es `httpOnly`, `SameSite=Lax` y `Secure` en producción. No es
  accesible desde JavaScript.
- `SessionRefresh` renueva la cookie cada 20 minutos y al volver a la pestaña.
- La app Android obtiene el token de Firebase y lo adjunta a cada request.

## Autorización

- `/api/v1/silos/overview` devuelve solo los silos del usuario autenticado.
- `/api/v1/silos/{id}/history`, `/current` y `/prediction` devuelven 404 si el
  silo no pertenece al usuario.
- `/api/v1/users/{uid}/...` devuelve 403 si el `uid` no coincide con el token.
- `/api/v1/chat` usa únicamente el contexto de silos del usuario.
- `/api/v1/sensors/{device_id}` solo devuelve sensores del usuario.
- Un `device_id` ya asociado a otro usuario/silo no se puede reasignar desde la
  API (409).

## Ingesta interna

`POST /api/v1/ingest` no acepta usuarios finales. Exige la cabecera
`X-Ingest-Key`, cuyo valor debe coincidir con `INGEST_API_KEY`.

La misma clave debe estar en:

- `Inteligencia_Artificial/.env`
- `Backend_Arduino/.env`

El bridge `mqtt_to_ai_bridge.py` la envía automáticamente. La clave no llega al
frontend ni a la app.

## Secretos

- Los `.env`, `secrets.h`, tokens de Influx y la service account están ignorados
  por Git.
- No commitear `INGEST_API_KEY`, tokens de TTN/HiveMQ/Influx ni la clave de
  Firebase.
- Rotar una credencial si se compartió fuera del equipo.
- El archivo `docs/CREDENCIALES.md` es una guía de nombres y ubicaciones; no
  debe contener valores reales.

## Firestore

Las reglas están en `Inteligencia_Artificial/firestore.rules`:

- Cada usuario solo puede leer/escribir su perfil y sus silos.
- La colección global `sensors/{deviceId}` solo la lee su dueño; la escritura es
  exclusiva del backend con Admin SDK.
- Las alertas solo las crea el backend; el usuario solo puede marcar
  `acknowledged`.
- Todo lo no declarado se deniega.

## Android

- La build **debug** permite HTTP local para el emulador.
- La build **release** no permite tráfico cleartext: la URL de API debe ser
  HTTPS.
- `allowBackup=false` para no respaldar tokens/preferencias sensibles.
- El APK release debe firmarse con una keystore de producción antes de
  distribuirse; el artefacto generado por Gradle queda *unsigned* si no se
  configura una firma.

## Checklist antes de producción

- [ ] `INGEST_API_KEY` configurada y distinta de la de desarrollo.
- [ ] Dominios de Vercel autorizados en Firebase Authentication.
- [ ] `AI_API_URL` apunta a un backend HTTPS estable, no a un túnel temporal.
- [ ] Reglas de Firestore desplegadas.
- [ ] Claves de TTN/HiveMQ/Influx rotadas después de la demo.
- [ ] APK release firmado y URL HTTPS configurada.
- [ ] `cloudflared` detenido si no se usa el deploy real.
- [ ] Revisar `docs/CREDENCIALES.md` y confirmar que no tiene valores reales.

## Limitaciones actuales

- No hay rate limiting distribuido ni App Check de Firebase.
- El túnel de Cloudflare es temporal; para producción usar un backend desplegado
  o un túnel nombrado con credenciales.
- La sesión web usa el ID token de Firebase dentro de una cookie httpOnly; si se
  necesita un modelo de sesión de larga duración, migrar a Firebase session
  cookies con Admin SDK.
