#include "LoRaWan_APP.h"
#include "Arduino.h"
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_SHT31.h>
#include <SparkFun_SCD4x_Arduino_Library.h>
#include <Adafruit_ADXL345_U.h>
#include "GPS_Air530Z.h"

// ================== LoRaWAN Credenciales ==================
// devEui/appEui/appKey viven en secrets.h (IGNORADO por git).
// Copiar secrets.h.example -> secrets.h y completar con los valores de TTN.
#include "secrets.h"

uint32_t devAddr = 0;
uint8_t nwkSKey[] = { 0 };
uint8_t appSKey[] = { 0 };

LoRaMacRegion_t loraWanRegion = LORAMAC_REGION_AU915;
DeviceClass_t   loraWanClass  = CLASS_A;
bool overTheAirActivation = true;
bool loraWanAdr           = true; // Lo devolvemos a la normalidad
bool isTxConfirmed        = false;
uint8_t appPort           = 2;
uint8_t confirmedNbTrials = 8;
bool keepNet              = true;

// ======== EL CAMBIO ESTÁ AQUÍ ========
// Cambiamos el penúltimo valor de 0x0002 a 0x0000. 
// Esto apaga los canales de 500kHz y fuerza a la placa a unirse en DR2 o DR3.
uint16_t userChannelsMask[6] = { 0xFF00, 0x0000, 0x0000, 0x0000, 0x0000, 0x0000 };
uint32_t appTxDutyCycle = 16000;  // + ~4 s de lectura = ~20 s entre transmisiones

// ================== Sensores ==================
Adafruit_BME280 bme;
Adafruit_SHT31  sht30 = Adafruit_SHT31();
SCD4x           scd41(SCD4x_SENSOR_SCD41);
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);
bool scd41_initialized = false;
uint16_t last_co2 = 0;

// GPS Air530Z integrado en la HTCC-AB02S. Usa UART1 y se controla con
// GPIO14 (VGPS). En la prueba de banco quedó encendido de forma continua
// aunque Vext esté apagado, así que no compite con el riel de los sensores.
Air530ZClass GPS;
bool     gpsCurrentFix   = false;
bool     gpsLastFixValid = false;
double   gpsLastLat      = 0.0;
double   gpsLastLng      = 0.0;
uint32_t gpsLastFixMs    = 0;
uint8_t  gpsSats         = 0;
float    gpsHdop         = 0.0;

#define AGRILION_GPS_READ_MS 1500

#define PIN_INTERRUPCION GPIO5

// CO2 (SCD41): el sensor responde correctamente en modo single-shot.
// Se habilita para enviar CO2 real en el payload.
#define AGRILION_CO2 1

// El SCD41 queda encendido de forma continua y en modo periódico.
// Solo se espera un poco para estabilizar SHT30/BME280 en el primer ciclo.
#define AGRILION_CO2_WARMUP_MS 2000

volatile bool flag_interrupcion  = false;
bool     impactoPendiente        = false;
uint16_t aceleracionGuardada     = 0;

TimerEvent_t agrilionWatchdog;

// ================== CONFIGURAR ADXL345 ==================
void configurarADXL345()
{
  if (!accel.begin())
  {
    Serial.println("WARNING: ADXL345 no detectado. Continuando sin acelerómetro.");
    return;
  }

  accel.setRange(ADXL345_RANGE_16_G);

  Wire.beginTransmission(0x53);
  Wire.write(0x24); Wire.write(10);  // THRESH_ACT
  Wire.endTransmission();

  Wire.beginTransmission(0x53);
  Wire.write(0x27); Wire.write(0x70); // ACT_INACT_CTL
  Wire.endTransmission();

  Wire.beginTransmission(0x53);
  Wire.write(0x2E); Wire.write(0x10); // INT_ENABLE → Activity (bit 4, no DATA_READY)
  Wire.endTransmission();

  Wire.beginTransmission(0x53);
  Wire.write(0x2F); Wire.write(0x00); // INT_MAP → INT1
  Wire.endTransmission();

  delay(50);
}

// ================== LEER ACELERACIÓN ==================
float leerAcelerometroInstantaneo()
{
  sensors_event_t event;
  accel.getEvent(&event);

  float ax = event.acceleration.x;
  float ay = event.acceleration.y;
  float az = event.acceleration.z;
  float magnitud = sqrt(ax * ax + ay * ay + az * az);

  // Limpiar flag de interrupción
  Wire.beginTransmission(0x53);
  Wire.write(0x30);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)0x53, (uint8_t)1);
  Wire.read();

  return abs(magnitud - 9.81);
}

// ================== GPS ==================
// Lee NMEA durante una ventana corta. El GPS queda encendido entre frames
// (GPIO14 LOW) para conservar el fix; más adelante se puede pasar a duty cycle.
void leerGPS()
{
  uint32_t start = millis();
  while (millis() - start < AGRILION_GPS_READ_MS) {
    while (GPSSerial.available() > 0) {
      GPS.encode(GPSSerial.read());
    }
  }

  gpsCurrentFix = GPS.location.isValid() && GPS.location.age() < 5000;
  if (gpsCurrentFix) {
    gpsLastLat = GPS.location.lat();
    gpsLastLng = GPS.location.lng();
    gpsLastFixValid = true;
    gpsLastFixMs = millis();
  }

  gpsSats = GPS.satellites.isValid() ? (uint8_t)GPS.satellites.value() : 0;
  gpsHdop = GPS.hdop.isValid() ? GPS.hdop.hdop() : 0.0;

  Serial.printf(
    "[GPS] fix=%d lat=%.6f lon=%.6f sats=%u hdop=%.2f age=%lu\n",
    gpsCurrentFix ? 1 : 0,
    gpsLastLat, gpsLastLng,
    (unsigned)gpsSats, gpsHdop,
    (unsigned long)(gpsLastFixValid ? (millis() - gpsLastFixMs) / 1000 : 0)
  );
}

// ================== INTERRUPCIÓN ==================
void ISR_Movimiento()
{
  flag_interrupcion = true;
}

// ================== WATCHDOG DE JOIN ==================
// Si no hay gateway escuchando, el primer intento (FSB2) falla y el stack
// reintenta por diseño en FSB1 (915.2), donde el gateway nunca escucha.
// Solución: si a los 150s sigue sin unir, reiniciar la placa; al volver el
// gateway, el primer intento en FSB2 acierta y el device se auto-recupera.
static void AgrilionWatchdogCallback(void)
{
  if (IsLoRaMacNetworkJoined)
  {
    return;   // ya unido: no hace falta seguir vigilando
  }

  if (TimerGetCurrentTime() > 150000UL)
  {
    Serial.println("WATCHDOG: join sin exito 150s, reiniciando placa...");
    delay(100);
    CySoftwareReset();
  }

  TimerSetValue(&agrilionWatchdog, 30000);
  TimerStart(&agrilionWatchdog);
}

// ================== PAYLOAD ==================
void prepareTxFrame(uint8_t port)
{
  // Los sensores se alimentan SOLO durante la lectura y se apagan antes de
  // transmitir: con el riel cargado la radio entra en Tx Timeout.
  // Se libera el bus I2C y se deja asentar la alimentación (POR limpio);
  // con el bus en 0 mientras están apagados no hay alimentación fantasma.
  pinMode(SDA, INPUT);
  pinMode(SCL, INPUT);
  digitalWrite(Vext, LOW);

  // El GPS está alimentado por VGPS y no por Vext; se puede leer mientras
  // los sensores siguen apagados. Mantener GPIO14 en LOW entre frames.
  leerGPS();

#if AGRILION_CO2
  delay(AGRILION_CO2_WARMUP_MS);
#else
  delay(1500);
#endif

  Wire.begin();          // reinicia el controlador I2C tras el corte de energía
  Wire.setClock(50000);

  configurarADXL345();   // el ADXL pierde su config al cortarle la energía

  // SHT30 (temp/humedad) con reintentos
  float temp = NAN, hum = NAN;
  for (int i = 0; i < 3 && (isnan(temp) || isnan(hum)); i++) {
    temp = sht30.readTemperature();
    hum  = sht30.readHumidity();
    if (isnan(temp) || isnan(hum)) {
      sht30.begin(0x44);   // re-init tras el corte de energía
      delay(150);
    }
  }
  Serial.printf("[SHT30] t=%.2f h=%.2f\n", temp, hum);

  // BME280 (presión) con reintentos y validación de rango
  float pres = NAN;
  for (int i = 0; i < 3 && (isnan(pres) || pres < 300 || pres > 1100); i++) {
    bme.begin(0x76) || bme.begin(0x77);   // recalibrar tras el corte
    delay(100);
    float p = bme.readPressure() / 100.0F;
    if (!isnan(p) && p >= 300 && p <= 1100) pres = p;
    else delay(150);
  }
  Serial.printf("[BME280] p=%.2f\n", pres);

  // Leer el acelerómetro ANTES del SCD41: la medición de CO2 ocupa el bus
  // I2C durante varios segundos y puede corromper la lectura del ADXL345.
  if (!impactoPendiente) {
    float inst = leerAcelerometroInstantaneo();
    if (inst >= 0 && inst <= 160) {   // 16 g máximo del ADXL345
      aceleracionGuardada = (uint16_t)(inst * 10);
    } else {
      aceleracionGuardada = 0;
    }
  } else if (aceleracionGuardada > 1600) {
    // Impacto inválido (>16 g): descartarlo y no reportarlo.
    impactoPendiente = false;
    aceleracionGuardada = 0;
  }

  // ================== CO2 (SCD41) ==================
  // Modo single-shot: hay que esperar ~5s a que el dato esté listo.
  // La librería devuelve TRUE cuando hay medición fresca (ver Example8).
  uint16_t co2 = last_co2;
#if AGRILION_CO2
  // Inicialización diferida después del join. El sensor queda encendido
  // y en modo periódico (mide cada 5 s), sin single-shot ni warm-up largo.
  if (!scd41_initialized) {
    if (scd41.begin(Wire, true, false)) {  // measBegin=true, ASC=false
      scd41_initialized = true;
      delay(5000);                         // primera medición
      scd41.readMeasurement();
      last_co2 = scd41.getCO2();
      co2 = last_co2;
    } else {
      Serial.println("WARNING: SCD41 no detectado en prepareTxFrame.");
    }
  } else {
    // Compensación de presión (BME280 en hPa -> librería en Pa)
    if (!isnan(pres) && pres > 0) {
      scd41.setAmbientPressure(pres * 100.0F);
    }
    if (scd41.readMeasurement()) {
      uint16_t c = scd41.getCO2();
      if (c > 0 && c <= 5000) last_co2 = c;
    }
    co2 = last_co2;
  }
#endif

  // Vext y el SCD41 quedan encendidos de forma continua. Se deja un pequeño
  // margen antes de transmitir; si la radio falla por consumo, habrá que
  // volver al apagado entre lecturas.
  delay(20);

  int16_t t = isnan(temp) ? 0 : (int16_t)(temp * 100);
  int16_t h = isnan(hum)  ? 0 : (int16_t)(hum  * 100);
  int16_t p = isnan(pres) ? 0 : (int16_t)(pres * 10);  // conserva 1 decimal

  appDataSize = 23;
  appData[0]  = highByte(t);
  appData[1]  = lowByte(t);
  appData[2]  = highByte(h);
  appData[3]  = lowByte(h);
  appData[4]  = highByte(p);
  appData[5]  = lowByte(p);
  appData[6]  = highByte(co2);
  appData[7]  = lowByte(co2);
  appData[8]  = impactoPendiente ? 1 : 0;
  appData[9]  = highByte(aceleracionGuardada);
  appData[10] = lowByte(aceleracionGuardada);

  // Bloque GPS (payload v2, 23 bytes):
  // [11] flags: bit0 = última posición válida, bit1 = fix actual,
  //             nibble alto = versión 2
  // [12] satélites, [13] HDOP x10
  // [14..17] latitud int32 x1e7, [18..21] longitud int32 x1e7
  // [22] edad de la última posición en minutos (saturada a 255)
  uint8_t gpsFlags = 0x20;
  if (gpsLastFixValid) gpsFlags |= 0x01;
  if (gpsCurrentFix)   gpsFlags |= 0x02;

  uint32_t gpsAgeMin = 0;
  if (gpsLastFixValid) {
    gpsAgeMin = (millis() - gpsLastFixMs) / 60000UL;
    if (gpsAgeMin > 255) gpsAgeMin = 255;
  }

  int32_t latRaw = gpsLastFixValid ? (int32_t)lround(gpsLastLat * 10000000.0) : 0;
  int32_t lonRaw = gpsLastFixValid ? (int32_t)lround(gpsLastLng * 10000000.0) : 0;
  uint8_t hdopRaw = (uint8_t)min(255.0f, max(0.0f, gpsHdop * 10.0f));

  appData[11] = gpsFlags;
  appData[12] = gpsSats;
  appData[13] = hdopRaw;
  appData[14] = (uint8_t)((latRaw >> 24) & 0xFF);
  appData[15] = (uint8_t)((latRaw >> 16) & 0xFF);
  appData[16] = (uint8_t)((latRaw >> 8) & 0xFF);
  appData[17] = (uint8_t)(latRaw & 0xFF);
  appData[18] = (uint8_t)((lonRaw >> 24) & 0xFF);
  appData[19] = (uint8_t)((lonRaw >> 16) & 0xFF);
  appData[20] = (uint8_t)((lonRaw >> 8) & 0xFF);
  appData[21] = (uint8_t)(lonRaw & 0xFF);
  appData[22] = (uint8_t)gpsAgeMin;

  impactoPendiente    = false;
  aceleracionGuardada = 0;
}

// ================== SETUP ==================
void setup()
{
  Serial.begin(115200);

  // GPS: VGPS se controla con GPIO14 y quedó independiente de Vext en la
  // prueba de banco. Se mantiene encendido para conservar el fix entre frames.
  pinMode(GPIO14, OUTPUT);
  digitalWrite(GPIO14, LOW);
  GPSSerial.begin(9600);

  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, LOW); 
  delay(3000); 

  Wire.begin();
  Wire.setClock(50000);

  // BME280
  if (!bme.begin(0x76) && !bme.begin(0x77)) {
    Serial.println("WARNING: BME280 no detectado.");
  }
  
  // SHT30
  if (!sht30.begin(0x44)) {
    Serial.println("WARNING: SHT30 no detectado en 0x44.");
  }

  // SCD41
// El SCD41 se inicializa después del join, dentro de prepareTxFrame.
// Inicializarlo en setup (antes del join LoRaWAN) impedía que la placa
// se uniera a la red.
  delay(600);

  configurarADXL345();

  pinMode(PIN_INTERRUPCION, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(PIN_INTERRUPCION), ISR_Movimiento, RISING);

  // ---- Diagnóstico: probar la secuencia de ventana de sensores del frame ----
  // (apagado -> descarga del bus -> encendido -> lectura), igual que en
  // prepareTxFrame. Sirve para verificar los valores sin gateway.
  digitalWrite(Vext, HIGH);
  Wire.end();
  pinMode(SDA, OUTPUT); digitalWrite(SDA, LOW);
  pinMode(SCL, OUTPUT); digitalWrite(SCL, LOW);
  delay(1000);
  pinMode(SDA, INPUT); pinMode(SCL, INPUT);
  digitalWrite(Vext, LOW);
  delay(1500);
  Wire.begin();
  Wire.setClock(50000);
  configurarADXL345();
  {
    float t2 = sht30.readTemperature();
    float h2 = sht30.readHumidity();
    bme.begin(0x76) || bme.begin(0x77);
    float p2 = bme.readPressure() / 100.0F;
    Serial.printf("[TEST-VENTANA] t=%.2f h=%.2f p=%.2f\n", t2, h2, p2);
  }
  digitalWrite(Vext, HIGH);
  Wire.end();
  pinMode(SDA, OUTPUT); digitalWrite(SDA, LOW);
  pinMode(SCL, OUTPUT); digitalWrite(SCL, LOW);
  // ---------------------------------------------------------------------------

  // Sensores apagados durante toda la actividad de radio (join incluido).
  // Con LORAWAN_RGB=0 la librería no toca Vext: lo controlamos 100% nosotros.
  digitalWrite(Vext, HIGH);

  TimerInit(&agrilionWatchdog, AgrilionWatchdogCallback);
  TimerSetValue(&agrilionWatchdog, 30000);
  TimerStart(&agrilionWatchdog);

  deviceState = DEVICE_STATE_INIT;
}

// ================== LOOP ==================
unsigned long ultimoImpacto = 0;

void loop()
{
  if (flag_interrupcion)
  {
    flag_interrupcion = false;
    float valorImpacto = leerAcelerometroInstantaneo();

    // Debounce: solo impactos reales (>1.5 m/s²) y máximo uno cada 30s
    // (el ADXL con Vext siempre encendido puede disparar en ráfaga).
    if (valorImpacto > 1.5 && valorImpacto <= 160 && (millis() - ultimoImpacto > 30000)) {
      aceleracionGuardada = (uint16_t)(valorImpacto * 10);
      impactoPendiente    = true;
      ultimoImpacto       = millis();
    }
  }

  if (impactoPendiente && deviceState == DEVICE_STATE_SLEEP)
  {
    if (IsLoRaMacNetworkJoined) deviceState = DEVICE_STATE_SEND;
    else                        impactoPendiente = false;
  }

  switch (deviceState)
  {
    case DEVICE_STATE_INIT:
      delay(200);
      LoRaWAN.init(loraWanClass, loraWanRegion);
      deviceState = DEVICE_STATE_JOIN;
      break;
    case DEVICE_STATE_JOIN:
      LoRaWAN.join();
      break;
    case DEVICE_STATE_SEND:
      prepareTxFrame(appPort);
      LoRaWAN.send();
      deviceState = DEVICE_STATE_CYCLE;
      break;
    case DEVICE_STATE_CYCLE:
      txDutyCycleTime = appTxDutyCycle + randr(0, 2000);
      LoRaWAN.cycle(txDutyCycleTime);
      deviceState = DEVICE_STATE_SLEEP;
      break;
    case DEVICE_STATE_SLEEP:
      LoRaWAN.sleep();
      break;
    default:
      deviceState = DEVICE_STATE_INIT;
      break;
  }
}