# Firebase Credentials

Este directorio contiene las credenciales de Firebase para el backend de AGRILION.

## ⚠️ IMPORTANTE

**NUNCA subas credenciales a Git.** Este directorio está protegido por `.gitignore`.

## Configuración

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Seleccionar tu proyecto
3. Ir a **Project Settings** → **Service accounts**
4. Click en **Generate new private key**
5. Descargar el archivo JSON
6. Renombrarlo a `serviceAccountKey.json`
7. Colocarlo en este directorio: `Backend_Arduino/firebase/serviceAccountKey.json`

## Archivo Requerido

```
Backend_Arduino/firebase/serviceAccountKey.json
```

Este archivo es usado por:
- `MQTT_INFLUXDB_FIREBASE.py` — para actualizar datos categóricos en Firestore
- El script necesita permisos de escritura en las colecciones:
  - `sensors/{deviceId}` — estado de sensores
  - `users/{uid}/silos/{siloId}` — estado de silobolsas

## Estructura de Firestore

Ver `Inteligencia_Artificial/firestore.rules` para las reglas de seguridad completas.

### Colecciones usadas por el backend:

```
sensors/{deviceId}
  ├── ownerUid: string
  ├── siloId: string
  ├── active: boolean
  └── lastSeen: timestamp

users/{uid}/silos/{siloId}
  ├── estado: string (OK, RIESGO_MEDIO, RIESGO_ALTO)
  ├── alerta: string | null
  ├── score: number
  ├── evento: string | null
  ├── delta_co2: number
  └── ultima_actualizacion: timestamp
```

## Troubleshooting

### Error: "Firebase credentials not found"
Verificar que `firebase/serviceAccountKey.json` existe en este directorio.

### Error: "Permission denied"
Verificar que el service account tiene permisos de escritura en Firestore.
