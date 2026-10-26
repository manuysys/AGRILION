# Integración GPS — Air530Z / CubeCell AB02S

Estado: integrado en firmware, backend, app Android y dashboard web.
La placa de prueba sigue **sin fix** bajo techo (`sats=0`, HDOP 25.5); falta
probar con vista al cielo o antena externa.

## Hardware y alimentación

| Dato | Valor |
|------|-------|
| Placa | HTCC-AB02S / CubeCell GPS-6502 |
| Módulo | Air530Z |
| UART | UART1 a 9600 baudios |
| Encendido | GPIO14 en LOW (VGPS) |
| LED | GPIO12 |
| Fix | NMEA por UART; sin fix no se publican coordenadas |

Prueba de banco: el GPS **sigue enviando NMEA con `Vext` apagado**. Por eso se
mantiene encendido con GPIO14 en LOW mientras los sensores y la radio usan
`Vext` normalmente. Esto evita el problema histórico de `Tx Timeout` por
alimentar los sensores durante el TX.

Por ahora el GPS queda encendido de forma continua para pruebas. El consumo
todavía no está optimizado; más adelante se puede pasar a una ventana de
adquisición o duty cycle.

## Firmware

El sketch es `Backend_Arduino/Codigo_TransmisionLoraWAN_Sensores/`.

- En `setup()` se configura GPIO14 como salida LOW y `GPSSerial.begin(9600)`.
- Antes de leer sensores se ejecuta `leerGPS()` durante 1,5 s.
- Se conserva la última posición válida (`gpsLastLat/Lng`, `gpsLastFixMs`).
- `[GPS] fix=... lat=... lon=... sats=... hdop=...` se imprime por serie.
- La radio y el join siguen funcionando con el GPS encendido (verificado con
  uplinks reales).

### Payload v2 (23 bytes)

| Bytes | Campo | Escala |
|-------|-------|--------|
| 0–1 | Temperatura | int16 / 100 |
| 2–3 | Humedad | int16 / 100 |
| 4–5 | Presión | int16 / 10 |
| 6–7 | CO₂ | uint16 ppm |
| 8 | Impacto | 0/1 |
| 9–10 | Aceleración | uint16 / 10 |
| 11 | Flags GPS | nibble alto = 2 (v2); bit0 = hay última posición; bit1 = fix actual |
| 12 | Satélites | uint8 |
| 13 | HDOP | uint8 / 10 |
| 14–17 | Latitud | int32 / 1e7 |
| 18–21 | Longitud | int32 / 1e7 |
| 22 | Edad del último fix | minutos, saturado a 255 |

Los nodos v1 siguen funcionando: el decoder acepta payloads de 11 bytes sin
bloque GPS. Si no hay fix, se envían flags de versión y coordenadas en cero.

## TTN y backend

Archivos:

- `Backend_Arduino/TTN_Payload_Formatter.js`: formatter para pegar en
  **TTN Console → Applications → Payload formatters → Uplink**.
- `Backend_Arduino/TTN_MQTT.py`: bridge TTN → HiveMQ. Además del
  `decoded_payload`, decodifica `frm_payload` localmente, por lo que el GPS
  funciona aunque el formatter de TTN todavía sea el viejo.
- `Backend_Arduino/MQTT_INFLUXDB_FIREBASE.py`: escribe los campos GPS en
  InfluxDB y actualiza la ubicación en Firestore sin esperar el cooldown de
  alertas.
- `Inteligencia_Artificial/api/schemas.py` y `routes.py`: exponen los campos
  GPS en `GET /api/v1/silos/overview`.
- `Inteligencia_Artificial/src/services/influx_repository.py`: consulta GPS con
  fallback si InfluxDB todavía no tiene esas columnas.

Campos publicados en el JSON y la API:

```text
latitude, longitude,
gps_fix, gps_has_fix, gps_satellites, gps_hdop, gps_age_min,
payload_version
```

En InfluxDB se escriben siempre `gps_fix`, `gps_has_fix`, satélites, HDOP, edad
y `latitude`/`longitude` (0 si no hay fix), para que el esquema exista desde el
primer punto. La API oculta las coordenadas cuando `gps_has_fix=false`.

### Pasos pendientes en TTN Console

1. Pegar el contenido actualizado de `TTN_Payload_Formatter.js`.
2. Verificar un uplink con payload de 23 bytes.
3. Confirmar que el JSON decodificado incluya `gps_has_fix`, `latitude` y
   `longitude`.

El bridge local ya interpreta v2 sin este paso, pero actualizar el formatter
deja la consola y otros consumidores alineados.

## App Android

- Dependencia `org.osmdroid:osmdroid-android:6.1.20`.
- `SiloMapCard.kt` muestra un mapa oscuro con tiles OpenStreetMap estándar y
  `TilesOverlay.INVERT_COLORS` (sin API key).
- User-Agent identificable:
  `AgrilionAndroid/1.0 (+https://github.com/manuysys/AGRILION)`.
- Marcadores para silos con `gpsHasFix=true`; al tocar un marcador se abre el
  detalle.
- El Dashboard muestra la tarjeta **MAPA DE SILOS**. Si no hay coordenadas,
  muestra un estado vacío explicando que falta vista al cielo.
- `SilosDataManagerBaseDeDatos` combina GPS de la API y, como respaldo, los
  metadatos `latitude`/`longitude` de Firestore.

Prueba realizada: build `assembleDebug`, instalación en emulador, login de
prueba, marcador visible, click al detalle. El usuario y el silo de prueba se
eliminaron al terminar.

## Dashboard web

- `paginaweb/src/components/dashboard/silo-map.tsx` usa Leaflet 1.9.4.
- El mapa está dentro de un gate de autenticación: un visitante ve el aviso de
  login; las coordenadas no se muestran en la página pública.
- Tiles OpenStreetMap con filtro CSS oscuro en el pane de tiles, sin API key.
- Marcadores con color por estado, popup y link al detalle del silo.
- `data-service.ts` mapea `latitude`, `longitude` y `gps_*` al modelo `SiloBag`.

Prueba realizada: build de Next.js, gate de invitado, login, carga de tiles y
marcador con un punto GPS temporal en InfluxDB (luego reemplazado por las
lecturas reales sin fix).

## Verificación pendiente

- Sacar la placa al exterior o conectar antena GPS y esperar un fix real.
- Verificar la cadena completa con coordenadas reales: TTN → bridge →
  InfluxDB/Firestore → API → app y web.
- Ajustar el consumo del GPS (hoy encendido continuo).
- Actualizar el formatter en TTN Console.

## Privacidad

La web solo muestra el mapa con sesión iniciada. La app autenticada sí muestra
las coordenadas al usuario. No se publican coordenadas exactas en el dashboard
público ni en el landing.
