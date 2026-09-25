// ============================================================
// Código de Lectura de Sensores — Solo Serial Monitor
// Basado en: Codigo_TransmisionLoraWAN_Sensores.ino
// Sin LoRaWAN: solo lee y muestra datos por Serial.
// Sensores: BME280 + SHT30 + SCD41 + ADXL345
// ============================================================

#include "Arduino.h"
#include <Wire.h>
#include <Adafruit_Sensor.h>
#include <Adafruit_BME280.h>
#include <Adafruit_SHT31.h>
#include <SparkFun_SCD4x_Arduino_Library.h>
#include <Adafruit_ADXL345_U.h>

// ================== Sensores ==================
Adafruit_BME280 bme;
Adafruit_SHT31  sht30 = Adafruit_SHT31();
SCD4x           scd41;
Adafruit_ADXL345_Unified accel = Adafruit_ADXL345_Unified(12345);

// ================== Flags de sensores detectados ==================
bool bme_ok   = false;
bool sht_ok   = false;
bool scd_ok   = false;
bool adxl_ok  = false;

// ================== Interrupción ADXL345 ==================
#define PIN_INTERRUPCION GPIO5

volatile bool flag_interrupcion  = false;
bool     impactoPendiente        = false;
uint16_t aceleracionGuardada     = 0;

// ================== Intervalo de lectura ==================
unsigned long tiempoAnterior = 0;
const unsigned long INTERVALO_LECTURA = 5000; // 5 segundos
uint32_t numeroLectura = 0;

// ================== CONFIGURAR ADXL345 ==================
void configurarADXL345()
{
  if (!accel.begin())
  {
    Serial.println("  ❌ ADXL345 no detectado.");
    adxl_ok = false;
    return;
  }

  adxl_ok = true;
  Serial.println("  ✅ ADXL345 detectado.");

  accel.setRange(ADXL345_RANGE_16_G);

  // THRESH_ACT: umbral de actividad
  Wire.beginTransmission(0x53);
  Wire.write(0x24); Wire.write(10);
  Wire.endTransmission();

  // ACT_INACT_CTL: habilitar detección AC en X, Y, Z
  Wire.beginTransmission(0x53);
  Wire.write(0x27); Wire.write(0x70);
  Wire.endTransmission();

  // INT_ENABLE: Activity es bit 4 = 0x10
  // NOTA: En el código LoRaWAN original estaba 0x01 (DATA_READY),
  // lo cual generaría falsos disparos. Aquí se corrige a 0x10.
  Wire.beginTransmission(0x53);
  Wire.write(0x2E); Wire.write(0x10); // ← CORREGIDO: bit 4 = Activity
  Wire.endTransmission();

  // INT_MAP: Activity → INT1 (pin)
  Wire.beginTransmission(0x53);
  Wire.write(0x2F); Wire.write(0x00);
  Wire.endTransmission();

  delay(50);

  // Limpiar cualquier interrupción pendiente al inicio
  Wire.beginTransmission(0x53);
  Wire.write(0x30);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)0x53, (uint8_t)1);
  if (Wire.available()) Wire.read();
}

// ================== LEER ACELERACIÓN ==================
float leerAcelerometroInstantaneo()
{
  if (!adxl_ok) return 0.0;

  sensors_event_t event;
  accel.getEvent(&event);

  float ax = event.acceleration.x;
  float ay = event.acceleration.y;
  float az = event.acceleration.z;
  float magnitud = sqrt(ax * ax + ay * ay + az * az);

  // Limpiar flag de interrupción del ADXL345
  Wire.beginTransmission(0x53);
  Wire.write(0x30);
  Wire.endTransmission(false);
  Wire.requestFrom((uint8_t)0x53, (uint8_t)1);
  if (Wire.available()) Wire.read();

  return abs(magnitud - 9.81);
}

// ================== INTERRUPCIÓN ==================
void ISR_Movimiento()
{
  flag_interrupcion = true;
}

// ================== SETUP ==================
void setup()
{
  Serial.begin(115200);
  delay(2000); // Esperar a que abra el Serial Monitor

  Serial.println();
  Serial.println("============================================");
  Serial.println("  AGRILION — Lectura de Sensores (Serial)");
  Serial.println("  BME280 + SHT30 + SCD41 + ADXL345");
  Serial.println("============================================");
  Serial.println();

  // Encender Vext para alimentar sensores I2C
  pinMode(Vext, OUTPUT);
  digitalWrite(Vext, LOW);
  delay(3000); // Estabilización de energía

  // Iniciar bus I2C
  Wire.begin();
  Wire.setClock(50000);

  // --- Inicializar BME280 ---
  Serial.println("Inicializando sensores...");
  if (bme.begin(0x76)) {
    bme_ok = true;
    Serial.println("  ✅ BME280 detectado en 0x76.");
  } else if (bme.begin(0x77)) {
    bme_ok = true;
    Serial.println("  ✅ BME280 detectado en 0x77.");
  } else {
    Serial.println("  ❌ BME280 no detectado.");
  }

  // --- Inicializar SHT30 ---
  if (sht30.begin(0x44)) {
    sht_ok = true;
    Serial.println("  ✅ SHT30 detectado en 0x44.");
  } else {
    Serial.println("  ❌ SHT30 no detectado.");
  }

  // --- Inicializar SCD41 ---
  if (scd41.begin(Wire)) {
    scd_ok = true;
    Serial.println("  ✅ SCD41 detectado.");
  } else {
    Serial.println("  ❌ SCD41 no detectado.");
  }
  delay(600);

  // --- Inicializar ADXL345 ---
  configurarADXL345();

  // --- Configurar interrupción ---
  if (adxl_ok) {
    pinMode(PIN_INTERRUPCION, INPUT_PULLDOWN);
    attachInterrupt(digitalPinToInterrupt(PIN_INTERRUPCION), ISR_Movimiento, RISING);
  }

  Serial.println();
  Serial.println("============================================");
  Serial.print("  Sensores activos: ");
  int count = 0;
  if (bme_ok)  count++;
  if (sht_ok)  count++;
  if (scd_ok)  count++;
  if (adxl_ok) count++;
  Serial.print(count);
  Serial.println("/4");
  Serial.print("  Intervalo de lectura: ");
  Serial.print(INTERVALO_LECTURA / 1000);
  Serial.println(" segundos");
  Serial.println("============================================");
  Serial.println();
}

// ================== LOOP ==================
void loop()
{
  // --- Detectar impacto por interrupción ---
  if (flag_interrupcion)
  {
    flag_interrupcion = false;
    float valorImpacto  = leerAcelerometroInstantaneo();
    aceleracionGuardada = (uint16_t)(valorImpacto * 10);
    impactoPendiente    = true;

    Serial.println();
    Serial.println("🚨🚨🚨 ¡IMPACTO DETECTADO! 🚨🚨🚨");
    Serial.print("  Aceleración neta: ");
    Serial.print(valorImpacto, 2);
    Serial.println(" m/s²");
    Serial.println();
  }

  // --- Lectura periódica de sensores ---
  unsigned long tiempoActual = millis();

  if (tiempoActual - tiempoAnterior >= INTERVALO_LECTURA)
  {
    tiempoAnterior = tiempoActual;
    numeroLectura++;

    Wire.setClock(50000);

    Serial.println("────────────────────────────────────────");
    Serial.print("  Lectura #");
    Serial.print(numeroLectura);
    Serial.print("  |  Uptime: ");
    Serial.print(tiempoActual / 1000);
    Serial.println("s");
    Serial.println("────────────────────────────────────────");

    // ---- SHT30: Temperatura y Humedad ----
    Serial.println("  [ SHT30 ]");
    if (sht_ok) {
      float temp_sht = sht30.readTemperature();
      float hum_sht  = sht30.readHumidity();

      if (!isnan(temp_sht)) {
        Serial.print("    Temperatura: ");
        Serial.print(temp_sht, 2);
        Serial.println(" °C");
      } else {
        Serial.println("    Temperatura: ERROR de lectura");
      }

      if (!isnan(hum_sht)) {
        Serial.print("    Humedad:     ");
        Serial.print(hum_sht, 2);
        Serial.println(" %");
      } else {
        Serial.println("    Humedad:     ERROR de lectura");
      }
    } else {
      Serial.println("    (no conectado)");
    }

    // ---- BME280: Presión (+ temp/hum de respaldo) ----
    Serial.println("  [ BME280 ]");
    if (bme_ok) {
      float temp_bme = bme.readTemperature();
      float hum_bme  = bme.readHumidity();
      float pres_bme = bme.readPressure() / 100.0F;

      Serial.print("    Presión:     ");
      Serial.print(pres_bme, 1);
      Serial.println(" hPa");
      Serial.print("    Temp (ref):  ");
      Serial.print(temp_bme, 2);
      Serial.println(" °C");
      Serial.print("    Hum  (ref):  ");
      Serial.print(hum_bme, 2);
      Serial.println(" %");
    } else {
      Serial.println("    (no conectado)");
    }

    // ---- SCD41: CO2 ----
    Serial.println("  [ SCD41 ]");
    if (scd_ok) {
      uint16_t co2 = 0;
      scd41.measureSingleShot();

      bool medicionLista = false;
      for (int i = 0; i < 13; i++) {
        delay(500);
        // NOTA: readMeasurement() retorna false cuando la lectura es EXITOSA
        // (true = error CRC / fallo comunicación). Corregido respecto al original.
        if (scd41.readMeasurement() == false) {
          co2 = scd41.getCO2();
          medicionLista = true;
          break;
        }
      }

      if (medicionLista && co2 > 0) {
        Serial.print("    CO2:         ");
        Serial.print(co2);
        Serial.println(" ppm");

        // Contexto del valor
        if (co2 < 400) {
          Serial.println("    Estado:      ⬇️ Bajo (exterior o ventilado)");
        } else if (co2 < 1000) {
          Serial.println("    Estado:      ✅ Normal");
        } else if (co2 < 2000) {
          Serial.println("    Estado:      ⚠️ Elevado — revisar");
        } else {
          Serial.println("    Estado:      🚨 CRÍTICO — posible fermentación");
        }
      } else {
        Serial.println("    CO2:         Sin datos (timeout 6.5s)");
      }
    } else {
      Serial.println("    (no conectado)");
    }

    // ---- ADXL345: Acelerómetro ----
    Serial.println("  [ ADXL345 ]");
    if (adxl_ok) {
      float accelVal = leerAcelerometroInstantaneo();
      Serial.print("    Acel. neta:  ");
      Serial.print(accelVal, 2);
      Serial.println(" m/s²");

      if (impactoPendiente) {
        Serial.print("    ⚡ Impacto pendiente: ");
        Serial.print(aceleracionGuardada / 10.0, 1);
        Serial.println(" m/s²");
        impactoPendiente = false;
        aceleracionGuardada = 0;
      }
    } else {
      Serial.println("    (no conectado)");
    }

    // ---- Resumen compacto (fácil de copiar) ----
    Serial.println("  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─");
    Serial.print("  CSV: ");
    Serial.print(tiempoActual / 1000); Serial.print(",");

    if (sht_ok) {
      float t = sht30.readTemperature();
      float h = sht30.readHumidity();
      Serial.print(isnan(t) ? 0 : t, 2); Serial.print(",");
      Serial.print(isnan(h) ? 0 : h, 2); Serial.print(",");
    } else {
      Serial.print("NaN,NaN,");
    }

    if (bme_ok) {
      Serial.print(bme.readPressure() / 100.0F, 1); Serial.print(",");
    } else {
      Serial.print("NaN,");
    }

    // CO2 ya fue leído arriba, no re-leer (tarda 6.5s)
    Serial.print("(ver arriba),");

    if (adxl_ok) {
      Serial.print(leerAcelerometroInstantaneo(), 2);
    } else {
      Serial.print("NaN");
    }

    Serial.println();
    Serial.println();
  }

  delay(50); // Estabilidad del loop
}
