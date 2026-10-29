# Instalación del APK — demo local

APK generado para instalar en un teléfono y mostrar la app con la API local.

## Archivo

```text
Agrilion-demo.apk
```

También queda en:

```text
AppCelular/app/build/outputs/apk/debug/app-debug.apk
```

Es un APK **debug**, firmado con la clave de desarrollo. Se puede instalar, pero
no es el artefacto final para publicar.

La versión **1.2** incluye el mapa OpenStreetMap visible aun sin fix GPS y migra
automáticamente la URL local antigua (`192.168.68.50`) al HTTPS del túnel.

SHA-256 del APK generado:

```text
95436DF5A633C12A4663114E1B5E935643657CA1861172AB7B54EC3839E5A13F
```

## Antes de instalar

- Android 7.0 o superior.
- El teléfono con conexión a Internet para Firebase Auth.
- La API de Agrilion corriendo en la notebook.
- Si se usa el APK actual: el túnel HTTPS activo.
- Si se compila para red local: notebook y teléfono en la **misma Wi-Fi**.

La versión actual del APK apunta por defecto al túnel HTTPS:

```text
https://lung-potatoes-gradually-knowledge.trycloudflare.com/
```

El túnel es temporal: si cambia, corregir la URL desde la app:
**Configuración → Conexión API**.

La API actual escucha en loopback (`::1`) para que no se caiga cuando cambia la
Wi-Fi; el teléfono debe usar el túnel HTTPS, no la IP local `192.168.68.50`.

También se puede compilar para una red local:

```powershell
.\gradlew.bat assembleDebug -PapiBaseUrl=http://IP_DE_LA_PC:8000/
```

## Instalar

### Opción 1: por USB

1. Activar **Opciones de desarrollador → Depuración USB**.
2. Conectar el teléfono.
3. Ejecutar:

```powershell
adb install -r Agrilion-demo.apk
```

### Opción 2: transferir el archivo

1. Enviar `Agrilion-demo.apk` al teléfono por USB, Drive o mensajería.
2. Abrirlo desde el administrador de archivos.
3. Permitir instalar apps de origen desconocido para esa aplicación.
4. Instalar.

Si ya hay una versión instalada con otra firma, desinstalar primero.

## Arrancar el backend

Mientras la placa no esté conectada, la API puede mostrar los datos históricos.
Para levantarla:

1. Iniciar Docker Desktop.
2. Iniciar InfluxDB:

   ```powershell
   docker compose up -d influxdb influxdb-ui
   ```

3. Iniciar la API:

   ```powershell
   cd Inteligencia_Artificial
   uvicorn api.app:app --host 0.0.0.0 --port 8000
   ```

4. Iniciar los bridges:

   ```powershell
   cd Backend_Arduino
   python TTN_MQTT.py
   python MQTT_INFLUXDB_FIREBASE.py
   python mqtt_to_ai_bridge.py
   ```

5. Verificar desde la notebook:

   ```powershell
   Invoke-RestMethod http://localhost:8000/api/v1/health
   ```

## Permitir el acceso desde el teléfono

- Windows debe permitir `python.exe` en redes privadas.
- Probar desde el navegador del teléfono:

```text
http://192.168.68.50:8000/api/v1/health
```

Debe responder `status: healthy`.

Si no responde:

- confirmar que la PC y el teléfono están en la misma red;
- revisar el firewall de Windows;
- confirmar la IP con `ipconfig`;
- verificar que la API escuche en `0.0.0.0:8000`.

## Iniciar sesión

Usar una cuenta de Firebase que tenga al menos un silo asociado. En el entorno
actual, la cuenta dueña de `SB-E2E01` puede ver ese silo.

La app requiere login; la API valida el ID token y filtra los silos por
propietario.

## Problemas frecuentes

| Síntoma | Revisar |
|---------|---------|
| "Sin conexión con la API" | API corriendo, IP y firewall |
| Login falla | Firebase Auth e Internet del teléfono |
| Dashboard vacío | La cuenta no tiene silos o la API no tiene lecturas |
| "Sin datos" con datos viejos | Es correcto: superó el umbral de 6 h |
| La instalación falla | Desinstalar una versión previa con otra firma |

## Para una entrega final

El APK debug no debe distribuirse como producto. Para eso falta:

1. Crear una keystore de producción.
2. Firmar el APK release.
3. Configurar una API HTTPS estable.
4. Compilar con `-PapiBaseUrl=https://...`.
