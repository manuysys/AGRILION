# Firebase Credentials — AGRILION

Este directorio debe contener el archivo de credenciales del backend de Firebase.

## ⚠️ Importante

- `serviceAccountKey.json` **NO debe subirse a git** (ya está en `.gitignore`)
- Cada desarrollador debe descargar su propio archivo desde Firebase Console
- En producción, usar variables de entorno o un gestor de secretos (Google Cloud Secret Manager)

## Cómo obtener `serviceAccountKey.json`

### Paso 1: Ir a Firebase Console
1. Abrir https://console.firebase.google.com/
2. Seleccionar el proyecto **AGRILION** (o crear uno si no existe)

### Paso 2: Generar la clave privada
1. Ir a **Configuración del proyecto** (⚙️ → Configuración del proyecto)
2. Pestaña **Cuentas de servicio**
3. Click en **Generar nueva clave privada**
4. Descargar el JSON → renombrar a `serviceAccountKey.json`
5. Mover este archivo a este directorio:
   ```
   Inteligencia_Artificial/firebase/serviceAccountKey.json
   ```

### Paso 3: Habilitar Authentication
1. Firebase Console → **Authentication** → **Sign-in method**
2. Habilitar **Email/Password**
3. (Opcional) Habilitar Google Sign-in

### Paso 4: Crear Firestore Database
1. Firebase Console → **Firestore Database** → **Create database**
2. Elegir **modo de prueba** (para desarrollo) o **modo de producción** (para prod)
3. Seleccionar ubicación (recomendado: `southamerica-east1` para Argentina)

### Paso 5: Copiar reglas de Firestore
Las reglas están en `Inteligencia_Artificial/firestore.rules`. Subirlas manualmente desde:
1. Firebase Console → Firestore Database → Rules
2. Pegar el contenido de `firestore.rules`
3. Click en **Publicar**

## Estructura esperada

```
Inteligencia_Artificial/
├── firebase/
│   ├── README.md          ← este archivo
│   └── serviceAccountKey.json  ← descargar desde Firebase Console
└── firestore.rules         ← reglas para subir a Firebase
```

## Verificar que funciona

```bash
cd Inteligencia_Artificial
python -c "from src.services.firebase_service import get_firebase_service; fb = get_firebase_service(); print('OK' if fb else 'FALLÓ')"
```

Si imprime `OK`, Firebase está correctamente configurado.
