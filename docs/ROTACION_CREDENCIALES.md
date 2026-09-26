# 🔐 Rotación de credenciales LoRaWAN (CubeCell / TTN)

Las credenciales OTAA del firmware estuvieron publicadas en el repositorio
(`devEui`, `appEui`, `appKey`). Ya se movieron a `secrets.h` (ignorado por git),
pero **hay que rotar el AppKey en TTN** para invalidar el que quedó público.

End device actual:

| Campo | Valor |
|-------|-------|
| End device ID | `smisia-cubecellab02s` |
| DevEUI | `70B3D57ED0076DC9` |
| JoinEUI (AppEUI) | `A2F42E5BA39F0F21` |
| Región | AU915 FSB2 |
| Activación | OTAA (LoRaWAN 1.0.2) |

---

## 1. Generar un AppKey nuevo en TTN

1. TTN Console → **Applications** → tu aplicación → **End devices** →
   `smisia-cubecellab02s`.
2. **General settings → Network layer → AppKey**.
3. Click en **Generate new AppKey** (o editar a mano un valor de 16 bytes) →
   **Save changes**.
4. Copiar el AppKey nuevo (hex de 32 caracteres).

> El DevEUI y el JoinEUI no hace falta cambiarlos (identifican el hardware y la
> aplicación; no son secretos). El AppKey es el secreto que se usa en el join.

## 2. Actualizar `secrets.h`

1. Copiar la plantilla si todavía no existe:

```bash
cd Backend_Arduino/Codigo_TransmisionLoraWAN_Sensores
copy secrets.h.example secrets.h
```

2. Editar `secrets.h` y pegar el AppKey nuevo:

```c
uint8_t devEui[] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x07, 0x6D, 0xC9 };
uint8_t appEui[] = { 0xA2, 0xF4, 0x2E, 0x5B, 0xA3, 0x9F, 0x0F, 0x21 };
uint8_t appKey[] = { 0x00, ... };  // ← reemplazar por el AppKey nuevo
```

> `secrets.h` está en `.gitignore`: nunca se sube al repo.

## 3. Reflashear y reiniciar la sesión

1. Abrir `Codigo_TransmisionLoraWAN_Sensores.ino` en Arduino IDE
   (placa CubeCell, región AU915).
2. Compilar y subir al dispositivo.
3. En TTN Console → End device → **Reset session** (borra la sesión vieja).
4. Encender el equipo: el log serie debe mostrar
   `DEVICE_STATE_INIT → JOIN → SEND → SLEEP`.
5. En TTN Console → **Live data** deben aparecer los uplinks con
   `decoded_payload` (temperatura, humedad, presion, co2, impacto, aceleracion).

## 4. Verificar que el payload se decodifica

El formatter tiene que estar pegado en
**TTN Console → Applications → Payload formatters → Uplink**:
copiar el contenido de `Backend_Arduino/TTN_Payload_Formatter.js`.

Payload esperado (11 bytes):

| Bytes | Campo | Escala |
|-------|-------|--------|
| 0-1 | temperatura | ×100 (int16 BE) |
| 2-3 | humedad | ×100 (int16 BE) |
| 4-5 | presión | ×10 (int16 BE) |
| 6-7 | CO₂ | ppm (uint16 BE) |
| 8 | flag de impacto | 0/1 |
| 9-10 | aceleración | ×10 (uint16 BE) |

## 5. Chequeo rápido

- TTN Live data: llega un uplink cada ~20 s (configurable en `appTxDutyCycle`).
- HiveMQ: mensajes en `smisia/smisia-cubecellab02s`.
- InfluxDB: `SELECT * FROM "sensores" WHERE device = 'smisia-cubecellab02s' ORDER BY time DESC LIMIT 5`.
- Web: `/dashboard` y `/dashboard/silo/{id}` con la última lectura.
