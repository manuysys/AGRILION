# Firebase Configuration — Agrilion Android App

## ⚠️ Configuración requerida

Para que la app pueda usar Firebase Auth y Firestore, necesitás agregar el archivo
`google-services.json` en esta carpeta (`AppCelular/app/`).

## Pasos para obtener `google-services.json`

### 1. Ir a Firebase Console
- Abrir: https://console.firebase.google.com/
- Ingresar con tu cuenta de Google
- Seleccionar o crear el proyecto **AGRILION**

### 2. Agregar app Android al proyecto
1. Click en el ícono de **Android** (Agregar app)
2. **Nombre del paquete Android**: `com.example.app1`
3. **Nombre del apodo**: `Agrilion` (opcional)
4. **Certificado SHA-1**: Para desarrollo se puede dejar vacío. Para producción, obtenerlo con:
   ```bash
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

### 3. Descargar el archivo
1. Click en **Descargar google-services.json**
2. Mover el archivo a esta ubicación exacta:
   ```
   AppCelular/app/google-services.json
   ```

### 4. Verificar configuración
- Sincronizar Gradle en Android Studio: `File → Sync Project with Gradle Files`
- No debe haber errores de build

## ⚠️ Importante

- `google-services.json` **NO debe subirse a git** (ya está en `.gitignore`)
- Cada desarrollador debe descargar su propio archivo
- En CI/CD (producción), se puede guardar como variable secreta o en Secret Manager

## Features habilitadas con Firebase

Una vez configurado, la app tendrá:

| Feature | Descripción |
|---------|-------------|
| **Auth** | Login/registro con email+password, Google Sign-In (futuro) |
| **Firestore** | Sincronización en tiempo real de silos, sensores y alertas |
| **Analytics** | Métricas de uso (opcional) |

## Estructura de datos en Firestore

```
users/{uid}/
  ├── email, name, phone, company
  └── silos/{siloId}/
        ├── name, grainType, location, tons
        └── sensors/{deviceId}/
              ├── active, battery, lastSeen
```

## Verificar que funciona

En la app, abrir `LoginScreen`. Si Firebase está bien configurado,
podrás registrar un usuario nuevo y loguearte.

Si ves errores del tipo `API key not valid`, el problema está en `google-services.json`.
