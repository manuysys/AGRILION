#include "LoRaWan_APP.h"
#include "Arduino.h"

#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_SHT31.h>
#include "MHZCO2.h"

// ================== LoRaWAN Credenciales ==================
uint8_t devEui[] = { 0x70, 0xB3, 0xD5, 0x7E, 0xD0, 0x07, 0x6D, 0xC9 };
uint8_t appEui[] = { 0xA2, 0xF4, 0x2E, 0x5B, 0xA3, 0x9F, 0x0F, 0x21 };
uint8_t appKey[] = { 0xDF, 0x89, 0xBD, 0xB2, 0xA5, 0x64, 0x92, 0xCF, 0x23, 0x17, 0x1D, 0x4A, 0xEC, 0xB8, 0xEA, 0x5F };

uint32_t devAddr = 0;
uint8_t nwkSKey[] = { 0 };
uint8_t appSKey[] = { 0 };

LoRaMacRegion_t loraWanRegion = LORAMAC_REGION_AU915;
DeviceClass_t loraWanClass = CLASS_A;
bool overTheAirActivation = true;
bool loraWanAdr = true;
bool isTxConfirmed = true;
uint8_t appPort = 2;
uint8_t confirmedNbTrials = 8;
bool keepNet = true;

uint16_t userChannelsMask[6] = { 0xFF00, 0x0000, 0x0000, 0x0000, 0x0002, 0x0000 };
uint32_t appTxDutyCycle = 20000;

// ================== Sensores ==================
Adafruit_BME280 bme;
Adafruit_SHT31 sht30 = Adafruit_SHT31();
MHZ19 mhz19; 

#define PIN_INTERRUPCION GPIO5 

// Variables globales para el impacto
volatile bool flag_interrupcion = false; 
bool impactoPendiente = false;           
uint16_t aceleracionGuardada = 0;        

// ================== MPU6050 ==================
void configurarMPU6050() {
  Wire.beginTransmission(0x68);
  Wire.write(0x6B); 
  Wire.write(0x00); 
  Wire.endTransmission();
  delay(10);

  Wire.beginTransmission(0x68);
  Wire.write(0x1C); 
  Wire.write(0x18); // +/- 16g
  Wire.endTransmission();
  delay(10);
  
  Wire.beginTransmission(0x68);
  Wire.write(0x1A);
  Wire.write(0x05); 
  Wire.endTransmission();

  // 🔥 SENSIBILIDAD DEL IMPACTO (MOT_THR)
  Wire.beginTransmission(0x68);
  Wire.write(0x1F); 
  Wire.write(3);    // Bajamos a 3 para más sensibilidad (antes 10)
  Wire.endTransmission();

  Wire.beginTransmission(0x68);
  Wire.write(0x20); // MOT_DUR
  Wire.write(1); 
  Wire.endTransmission();

  Wire.beginTransmission(0x68);
  Wire.write(0x37); // INT_PIN_CFG
  Wire.write(0x20); // Latch enable
  Wire.endTransmission();

  Wire.beginTransmission(0x68);
  Wire.write(0x38); // INT_ENABLE
  Wire.write(0x40); // Motion Detection
  Wire.endTransmission();
  
  delay(50);
}

// ================== ACELERÓMETRO PRO ==================
float leerAcelerometroInstantaneo() {
  int16_t ax, ay, az;

  Wire.beginTransmission(0x68);
  Wire.write(0x3B);
  if (Wire.endTransmission(false) != 0) return 0;

  if (Wire.requestFrom((uint8_t)0x68, (uint8_t)6, (uint8_t)true) != 6) return 0;

  ax = (Wire.read() << 8) | Wire.read();
  ay = (Wire.read() << 8) | Wire.read();
  az = (Wire.read() << 8) | Wire.read();

  float ax_ms2 = (ax / 2048.0) * 9.81;
  float ay_ms2 = (ay / 2048.0) * 9.81;
  float az_ms2 = (az / 2048.0) * 9.81;

  float magnitud = sqrt(ax_ms2*ax_ms2 + ay_ms2*ay_ms2 + az_ms2*az_ms2);
  
  // Limpiar el registro de interrupciones
  Wire.beginTransmission(0x68);
  Wire.write(0x3A); 
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)0x68, (uint8_t)1, (uint8_t)true);
  Wire.read();

  return abs(magnitud - 9.81); 
}

// ================== INTERRUPCIÓN ==================
void ISR_Movimiento() {
  flag_interrupcion = true;
}

// ================== PAYLOAD ==================
void prepareTxFrame(uint8_t port)
{
  digitalWrite(Vext, LOW);
  delay(200); 
  
  float temp = sht30.readTemperature();
  float hum = sht30.readHumidity();
  float pres = bme.readPressure() / 100.0F;

  mhz19.measure();
  int co2 = mhz19.getCO2();

  // Si no hubo impacto (es un mensaje de ciclo normal), leemos el valor base
  if (!impactoPendiente) {
      float inst = leerAcelerometroInstantaneo();
      aceleracionGuardada = (uint16_t)(inst * 10);
  }

  int t = (isnan(temp)) ? 0 : (int)(temp * 100);
  int h = (isnan(hum)) ? 0 : (int)(hum * 100);
  int p = (isnan(pres)) ? 0 : (int)pres; 

  appDataSize = 11;

  appData[0] = highByte(t); appData[1] = lowByte(t);
  appData[2] = highByte(h); appData[3] = lowByte(h);
  appData[4] = highByte(p); appData[5] = lowByte(p);
  appData[6] = highByte(co2); appData[7] = lowByte(co2);
  
  appData[8] = impactoPendiente ? 1 : 0;
  appData[9]  = highByte(aceleracionGuardada);
  appData[10] = lowByte(aceleracionGuardada);
  
  // Limpiamos la información del impacto una vez agregada al paquete
  impactoPendiente = false;
  aceleracionGuardada = 0;
}

// ================== SETUP ==================
void setup() {
  Serial.begin(115200);
  
  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, LOW); 
  delay(500);

  Wire.begin();
  Wire.setClock(50000);

  Serial1.begin(9600);
  mhz19.begin(&Serial1);

  bme.begin(0x76);
  sht30.begin(0x44);

  configurarMPU6050();

  pinMode(PIN_INTERRUPCION, INPUT_PULLDOWN);
  attachInterrupt(digitalPinToInterrupt(PIN_INTERRUPCION), ISR_Movimiento, RISING);

  deviceState = DEVICE_STATE_INIT;
}

// ================== LOOP ==================
void loop() {

  // Capturar el dato INMEDIATAMENTE ocurre el impacto
  if (flag_interrupcion) {
    flag_interrupcion = false; // Resetear flag de ISR
    float valorImpacto = leerAcelerometroInstantaneo();
    aceleracionGuardada = (uint16_t)(valorImpacto * 10);
    impactoPendiente = true;   // Dejar listo para enviar
  }

  // Si hay impacto y LoRaWAN está libre/durmiendo, forzar envío
  if (impactoPendiente && deviceState == DEVICE_STATE_SLEEP) {
    if (IsLoRaMacNetworkJoined) {
      deviceState = DEVICE_STATE_SEND; 
    } else {
      impactoPendiente = false; 
    }
  }

  switch (deviceState)
  {
    case DEVICE_STATE_INIT:
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