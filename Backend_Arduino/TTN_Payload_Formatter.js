// AGRILION — TTN Payload Formatter (Uplink)
// Pegar esta función en: TTN Console → Applications → Payload Formatters → Uplink
// Decodifica el payload binario del CubeCell.
// v1: 11 bytes (sensores)
// v2: 23 bytes (sensores + GPS Air530Z)

function int32be(bytes, offset) {
  var value = (bytes[offset] << 24) |
              (bytes[offset + 1] << 16) |
              (bytes[offset + 2] << 8) |
              bytes[offset + 3];
  return value;
}

function decodeUplink(input) {
  var bytes = input.bytes;

  if (bytes.length < 11) {
    return {
      errors: ["Payload demasiado corto: " + bytes.length + " bytes"]
    };
  }

  // Byte 0-1: Temperatura (int16 big-endian, escalado ×100)
  var tempRaw = (bytes[0] << 8) | bytes[1];
  if (tempRaw >= 0x8000) tempRaw -= 0x10000;
  var temperatura = tempRaw / 100.0;

  // Byte 2-3: Humedad (int16 big-endian, escalado ×100)
  var humRaw = (bytes[2] << 8) | bytes[3];
  if (humRaw >= 0x8000) humRaw -= 0x10000;
  var humedad = humRaw / 100.0;

  // Byte 4-5: Presión (int16 big-endian, escalado ×10 → hPa con 1 decimal)
  var presRaw = (bytes[4] << 8) | bytes[5];
  if (presRaw >= 0x8000) presRaw -= 0x10000;
  var presion = presRaw / 10.0;

  // Byte 6-7: CO2 (uint16 big-endian, ppm)
  var co2 = (bytes[6] << 8) | bytes[7];

  // Byte 8: Flag de impacto (0 = normal, 1 = impacto)
  var impacto = bytes[8];

  // Byte 9-10: Aceleración (uint16 big-endian, escalado ×10 → m/s²)
  var acelRaw = (bytes[9] << 8) | bytes[10];
  var aceleracion = acelRaw / 10.0;

  var data = {
    temperatura: Math.round(temperatura * 100) / 100,
    humedad: Math.round(humedad * 100) / 100,
    presion: Math.round(presion * 10) / 10,
    co2: co2,
    impacto: impacto === 1,
    aceleracion: Math.round(aceleracion * 10) / 10,
    dispositivo: "agrilion-v2",
    payload_version: 1
  };

  // Bloque GPS v2 (opcional, para mantener compatibilidad con nodos v1).
  if (bytes.length >= 23) {
    var flags = bytes[11];
    var version = (flags >> 4) & 0x0F;

    if (version === 2) {
      var hasFix = (flags & 0x01) !== 0;
      var currentFix = (flags & 0x02) !== 0;
      var latRaw = int32be(bytes, 14);
      var lonRaw = int32be(bytes, 18);

      data.payload_version = 2;
      data.gps_has_fix = hasFix;
      data.gps_fix = currentFix;
      data.gps_satellites = bytes[12];
      data.gps_hdop = Math.round((bytes[13] / 10.0) * 10) / 10;
      data.gps_age_min = bytes[22];
      data.latitude = hasFix ? Math.round((latRaw / 10000000.0) * 10000000) / 10000000 : null;
      data.longitude = hasFix ? Math.round((lonRaw / 10000000.0) * 10000000) / 10000000 : null;
    }
  }

  return {
    data: data,
    warnings: []
  };
}
