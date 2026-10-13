# Firmware CubeCell — AGRILION

Sketch LoRaWAN OTAA del nodo CubeCell-GPS con sensores:

| Sensor | Variable | Dirección I2C |
|--------|----------|---------------|
| SHT30  | temperatura / humedad | 0x44 |
| BME280 | presión | 0x76 / 0x77 |
| SCD41  | CO2 | 0x62 |
| ADXL345 | impacto / aceleración | 0x53 |

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

## Watchdog de join (auto-recuperación)

Si no hay gateway escuchando, el primer intento de join (FSB2) falla y el stack
reintenta por diseño en FSB1 (915.2) para siempre. El timer propio
`AgrilionWatchdogCallback` (cada 30 s) reinicia la placa si a los 150 s sigue
sin unir: al volver el gateway, el primer intento del arranque va en FSB2 y el
nodo se recupera solo en ≤ 3 minutos.

## Estado del SCD41 (CO2)

El sensor físico actual responde en I2C (0x62) pero **no acepta
`measureSingleShot()`** (NACK) — pareciera una variante/clon sin ese modo. Por
eso el payload viaja con `co2 = 0`. Flag `AGRILION_CO2`:

- `1` (actual): intenta leer (imprime el warning; si algún día se cambia por un
  SCD41 sano, funciona directo).
- `0`: no lo toca (menos ruido en serie).

Nota histórica: `scd41.begin(Wire, true)` arranca medición periódica aunque
falle la detección — el calentador (~200 mA en pulsos) tumbaba la radio. Con
single-shot no se enciende calentador.

## Troubleshooting rápido

- `TX on freq 915200000 Hz` en bucle → el nodo quedó en FSB1 (join falló antes);
  el watchdog lo reinicia solo, o flashear de nuevo.
- `Event : Tx Timeout` → sensores encendidos durante TX (revisar control de
  `Vext`) o gateway/red caídos.
- Sin `joined` y todo `Rx Timeout` → verificar que el gateway esté conectado en
  TTN (Consola → Gateway → status) antes de tocar el firmware.
