#include "LoRaWan_APP.h"
#include "Arduino.h"
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_SHT31.h>
#include <SparkFun_SCD4x_Arduino_Library.h>
#include <Adafruit_ADXL345_U.h>

// ================== LoRaWAN Credenciales ==================
uint8_t devEui[] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x07, 0x6D, 0xC9 };
uint8_t appEui[] = { 0xA2, 0xF4, 0x2E, 0x5B, 0xA3, 0x9F, 0x0F, 0x21 };
uint8_t appKey[] = { 0xDF, 0x89, 0xBD, 0xB2, 0xA5, 0x64, 0x92, 0xCF, 0x23, 0x17, 0x1D, 0x4A, 0xEC, 0xB8, 0xEA, 0x5F };

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
uint32_t appTxDutyCycle = 20000;

// ================== Sensores ==================
Adafruit_BME280 bme;
Adafruit_SHT31  sht30 = Adafruit_SHT31();
SCD4x           scd41;
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);

#define PIN_INTERRUPCION GPIO5

volatile bool flag_interrupcion  = false;
bool     impactoPendiente        = false;
uint16_t aceleracionGuardada     = 0;

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
  Wire.write(0x2E); Wire.write(0x10); // INT_ENABLE → Activity
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

// ================== INTERRUPCIÓN ==================
void ISR_Movimiento()
{
  flag_interrupcion = true;
}

// ================== PAYLOAD ==================
void prepareTxFrame(uint8_t port)
{
  // 1. REANIMAR EL BUS I2C POR SI EL MODO SLEEP LO "DURMIÓ"
  Wire.end();
  delay(10);
  Wire.begin();
  Wire.setClock(50000);
  delay(100);

  float temp = sht30.readTemperature();
  float hum  = sht30.readHumidity();
  float pres = bme.readPressure() / 100.0F;

  // 2. RE-INICIALIZAR EL SCD41 DE FORMA ROBUSTA
  uint16_t co2 = 0;
  
  if(scd41.begin(Wire)) { 
      scd41.measureSingleShot();
      
      bool medicionLista = false;
      for (int i = 0; i < 13; i++) {
        delay(500);
        if (scd41.readMeasurement()) {
          co2 = scd41.getCO2();
          medicionLista = true;
          Serial.printf("SCD41 OK tras %d ms: CO2=%d ppm\n", (i + 1) * 500, co2);
          break;
        }
      }
      
      if (!medicionLista) {
        Serial.println("WARNING: SCD41 no logró devolver datos en 6.5s");
      }
  } else {
      Serial.println("WARNING: SCD41 no respondió al begin() antes de medir");
  }

  if (!impactoPendiente) {
    float inst = leerAcelerometroInstantaneo();
    aceleracionGuardada = (uint16_t)(inst * 10);
  }

  int t = isnan(temp) ? 0 : (int)(temp * 100);
  int h = isnan(hum)  ? 0 : (int)(hum  * 100);
  int p = isnan(pres) ? 0 : (int)pres;

  appDataSize = 11;
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

  impactoPendiente    = false;
  aceleracionGuardada = 0;
}

// ================== SETUP ==================
void setup()
{
  Serial.begin(115200);

  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, LOW); 
  delay(3000); 

  Wire.begin();
  Wire.setClock(50000);

  bme.begin(0x76);
  sht30.begin(0x44);

  if (!scd41.begin(Wire)) {
    Serial.println("WARNING: SCD41 no detectado en setup.");
  }
  delay(600);

  configurarADXL345();

  pinMode(PIN_INTERRUPCION, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(PIN_INTERRUPCION), ISR_Movimiento, RISING);

  deviceState = DEVICE_STATE_INIT;
}

// ================== LOOP ==================
void loop()
{
  if (flag_interrupcion)
  {
    flag_interrupcion = false;
    float valorImpacto  = leerAcelerometroInstantaneo();
    aceleracionGuardada = (uint16_t)(valorImpacto * 10);
    impactoPendiente    = true;
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