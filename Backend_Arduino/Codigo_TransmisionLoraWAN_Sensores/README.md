# Firmware CubeCell — AGRILION

Sketch LoRaWAN OTAA del nodo CubeCell-GPS con sensores:

| Sensor | Variable | Dirección I2C |
|--------|----------|---------------|
| SHT30  | temperatura / humedad | 0x44 |
| BME280 | presión | 0x76 / 0x77 |
| SCD41  | CO2 | 0x62 |
| ADXL345 | impacto / aceleración | 0x53 |
| GPS Air530Z | posición | UART1 9600, enable GPIO14 |

## Flasheo (IMPORTANTE)

```powershell
.\scripts\flash_firmware.ps1 -Port COM4
```

o a mano:

```powershell
arduino-cli compile --upload -p COM4 `
  --fqbn CubeCell:CubeCell:CubeCell-GPS `
  --board-options "LORAWAN_REGION=2,LORAWAN_RGB=0,LORAWAN_DebugLevel=2" .
```

- `LORAWAN_REGION=2` → **AU915**. El default del core es AS923: sin esta opción
  la placa compila para otra región y "no transmite" (costo horas de depuración).
- `LORAWAN_RGB=0` → la librería **no toca `Vext`**; el firmware lo controla solo
  (ver diseño de alimentación abajo).
- `LORAWAN_DebugLevel=2` → logs de radio (frecuencia, Tx Done/Timeout) por serie
  a 115200 baud.

Credenciales OTAA en `secrets.h` (ignorado por git; copiar de `secrets.h.example`
y completar con DevEUI/JoinEUI/AppKey de TTN).

## Diseño de alimentación de sensores (clave para la radio)

Los sensores se alimentan con `Vext` **solo durante la lectura** de cada frame.
Si quedan encendidos durante el TX, el riel se hunde, el SX1262 cuelga
(`Receive Data timeout!` → `Event : Tx Timeout`) y la MAC queda corrupta:
reintenta en el canal 0 (915.2, FSB1) donde el gateway (FSB2) no escucha.

Secuencia exacta por frame (`prepareTxFrame`):

1. `Vext` ON con el bus I2C **liberado** y espera de 1500 ms (POR limpio).
2. Lectura de SHT30/BME280 (con reintentos) y ADXL345.
3. `Vext` OFF **y descarga del bus I2C** (SDA/SCL a 0 V). Sin esta descarga los
   sensores quedan alimentados "fantasma" por las pull-ups y no vuelven a
   responder en el siguiente ciclo.
4. Recién entonces se transmite (radio limpia).

Los valores de diagnóstico se imprimen por serie:
`[TEST-VENTANA]` (al arrancar) y `[SHT30]` / `[BME280]` (por frame).

## GPS Air530Z

El GPS usa **UART1 a 9600** y se enciende con **GPIO14 en LOW**. En la prueba de
banco siguió entregando NMEA con `Vext` apagado, así que se mantiene encendido
de forma continua sin alimentar los sensores durante el TX. El consumo todavía
no está optimizado; queda para una etapa posterior.

Cada frame, antes de los sensores, se ejecuta `leerGPS()` durante 1,5 s y se
conserva la última posición válida. El log por serie es:

```text
[GPS] fix=0 lat=0.000000 lon=0.000000 sats=0 hdop=25.50 age=0
```

Bajo techo no hay fix (`sats=0`, HDOP 25.5): hace falta vista al cielo o antena
externa. La radio y el join siguen funcionando con el GPS encendido.

### Payload v2 (23 bytes)

| Bytes | Campo | Escala |
|-------|-------|--------|
| 0–1 | Temperatura | int16 / 100 |
| 2–3 | Humedad | int16 / 100 |
| 4–5 | Presión | int16 / 10 |
| 6–7 | CO₂ | uint16 ppm |
| 8 | Impacto | 0/1 |
| 9–10 | Aceleración | uint16 / 10 |
| 11 | Flags GPS | nibble alto = 2; bit0 = última posición; bit1 = fix actual |
| 12 | Satélites | uint8 |
| 13 | HDOP | uint8 / 10 |
| 14–17 | Latitud | int32 / 1e7 |
| 18–21 | Longitud | int32 / 1e7 |
| 22 | Edad del último fix | minutos (máx. 255) |

El decoder acepta también payloads v1 de 11 bytes. Actualizar el formatter de
TTN con `Backend_Arduino/TTN_Payload_Formatter.js`; el bridge local
`TTN_MQTT.py` ya decodifica v2 aunque la consola tenga el viejo.

## Watchdog de join (auto-recuperación)

Si no hay gateway escuchando, el primer intento de join (FSB2) falla y el stack
reintenta por diseño en FSB1 (915.2) para siempre. El timer propio
`AgrilionWatchdogCallback` (cada 30 s) reinicia la placa si a los 150 s sigue
sin unir: al volver el gateway, el primer intento del arranque va en FSB2 y el
nodo se recupera solo en ≤ 3 minutos.

## Estado del SCD41/SCD40 (CO2)

El firmware actual inicializa el SCD4x después del join y usa **medición
periódica** (`scd41.begin(Wire, true, false)`). Las lecturas reales de la placa
estuvieron alrededor de **980 ppm**, por lo que el CO₂ sí se publica.

- `AGRILION_CO2=1` (actual): lee CO₂ y envía el valor en el payload.
- Si el sensor no entrega una medición nueva, se conserva la última lectura
  válida (`last_co2`); si nunca hubo una, el payload envía 0 y el frontend
  muestra **“Sin dato”**.
- El calentador del SCD4x puede consumir corriente; si aparece un `Tx Timeout`,
  revisar la alimentación antes de culpar al sensor.

El comportamiento anterior (detección como SCD40 y fallos de single-shot) quedó
como antecedente histórico, pero no describe el firmware actual.

## Troubleshooting rápido

- `TX on freq 915200000 Hz` en bucle → el nodo quedó en FSB1 (join falló antes);
  el watchdog lo reinicia solo, o flashear de nuevo.
- `Event : Tx Timeout` → sensores encendidos durante TX (revisar control de
  `Vext`) o gateway/red caídos.
- Sin `joined` y todo `Rx Timeout` → verificar que el gateway esté conectado en
  TTN (Consola → Gateway → status) antes de tocar el firmware.
