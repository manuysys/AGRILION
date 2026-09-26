# 🔥 Firebase — Guía de configuración de Agrilion

Esta guía deja Firebase listo para:
- Registro/login real en la web (`paginaweb`) con email/contraseña y Google.
- Perfil y silobolsas en Firestore (`users/{uid}/silos/{silo_id}`).
- Registro global de sensores (`sensors/{device_id}`) que usa el backend MQTT.
- App Android (`AppCelular`) contra el mismo proyecto.

> Proyecto sugerido: **agrilion-app** (o el nombre que prefieras).
> Dueño: `manuysys@gmail.com`. Podés invitar a `eest4.74.agrilion@gmail.com`
> como **Editor** (Configuración del proyecto → Usuarios y permisos → Agregar miembro).

---

## 1. Crear el proyecto

1. Ir a <https://console.firebase.google.com/>
2. **Agregar proyecto** → nombre `agrilion-app` → Continuar.
3. Google Analytics: se puede desactivar (no se usa).
4. Crear proyecto.

## 2. Activar Authentication

1. Menú lateral → **Compilación → Authentication** → Comenzar.
2. Pestaña **Sign-in method**:
   - **Correo electrónico/contraseña** → Habilitar.
   - **Google** → Habilitar → elegir correo de soporte del proyecto.
3. Pestaña **Settings → Authorized domains**: `localhost` ya está. Agregar el
   dominio cuando se despliegue la web (ej: `project-rprtv.vercel.app`).

## 3. Crear Firestore

1. Menú lateral → **Compilación → Firestore Database** → Crear base de datos.
2. Modo: **Producción**.
3. Ubicación: `southamerica-east1` (São Paulo) o `us-east1`.
4. Una vez creada, ir a la pestaña **Rules** y pegar las reglas del punto 7.

## 4. Registrar la app Web

1. **Configuración del proyecto** (⚙️) → **General** → *Tus apps* →
   **Web** (`</>`).
2. Apodo: `agrilion-web`. No hace falta Firebase Hosting.
3. Copiar el objeto `firebaseConfig` a `paginaweb/.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=agrilion-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=agrilion-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=agrilion-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

4. Reiniciar el frontend (`npm run dev`).

## 5. Service Account (backend + IA)

1. **Configuración del proyecto** → **Cuentas de servicio** →
   **Generar nueva clave privada** → descargar el JSON.
2. Renombrarlo a `serviceAccountKey.json` y guardarlo en **ambas** carpetas:

```
Backend_Arduino/firebase/serviceAccountKey.json
Inteligencia_Artificial/firebase/serviceAccountKey.json
```

> ⚠️ Nunca commitear este archivo (ya está en `.gitignore`).

3. Verificar:

```bash
python scripts/check_firebase.py
```

## 6. App Android

1. **Configuración del proyecto** → *Tus apps* → **Android**.
2. Nombre de paquete: `com.example.app1` (el que usa `AppCelular`).
3. Descargar `google-services.json` → guardarlo en:

```
AppCelular/app/google-services.json
```

4. La app ya trae Firebase Auth + Firestore en `AuthManager.kt`
   (ver `MOBILE_INTEGRATION.md`).

## 7. Reglas de Firestore

Pegar en **Firestore → Rules → Publicar**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Cada usuario administra su perfil y sus silos
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

    // Lookup global de sensores: lectura autenticada, escritura solo backend
    match /sensors/{deviceId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

## 8. Probar el flujo completo

1. `python scripts/check_firebase.py` → debe decir **Firebase listo**.
2. Levantar la AI API (`uvicorn api.app:app --port 8000` en
   `Inteligencia_Artificial/`).
3. Levantar la web (`npm run dev` en `paginaweb/`).
4. Ir a `http://localhost:3000/registro`, crear la cuenta con el Gmail del
   proyecto (ej: `eest4.74.agrilion@gmail.com`).
5. Ir a **Dashboard → Configuración → Registrar lanza / silobolsa de prueba**:
   - Nombre: `Lanza de prueba`
   - Grano: soja
   - Device ID de TTN: `smisia-cubecellab02s`
   - **Crear y asociar sensor**
6. Verificar en la consola de Firebase:
   - `users/{uid}` con email/nombre.
   - `users/{uid}/silos/SB-xxxxx` con `grainType`.
   - `sensors/smisia-cubecellab02s` con `ownerUid` y `siloId`.

Con eso, cuando la lanza empiece a transmitir, el backend va a escribir:
- **InfluxDB**: measurement `sensores` (temperatura, humedad, co2, score...).
- **Firestore**: `sensor.lastSeen` y `users/{uid}/silos/{silo}.estado/score/alerta`.

## 9. Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `auth/operation-not-allowed` | Email/Password deshabilitado | Activarlo en Authentication → Sign-in method |
| `auth/unauthorized-domain` | Dominio no autorizado | Agregar el dominio en Authentication → Settings |
| `Missing or insufficient permissions` | Reglas de Firestore | Publicar las reglas del punto 7 |
| `Firebase no disponible` en AI API | Falta `serviceAccountKey.json` | Punto 5 |
| `AI API 503: Firebase no disponible` | Igual que arriba | Punto 5 |
