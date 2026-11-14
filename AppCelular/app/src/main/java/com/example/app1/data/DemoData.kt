package com.example.app1.data

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import kotlin.math.PI
import kotlin.math.roundToInt
import kotlin.math.sin

/**
 * Módulo central de Datos de Ejemplo para el MODO DEMO.
 * Todo dato de ejemplo posee el prefijo rígido 'DEMO-' para garantizar
 * que jamás colisionen con IDs reales del backend ni persistan en la base real.
 *
 * Portación: los silos se construyen con el modelo aplanado de AppCelular
 * (temperatura/humedad/co2/presion/riskScore/riskLevel + lat/lng GPS aplanados).
 */
object DemoData {

    fun loadDemoData() {
        if (SilosDataManagerBaseDeDatos.silosList.any { it.id.startsWith("DEMO-") }) {
            return
        }
        purgeDemoData()

        val demoSilos = listOf(
            SilobolsaBaseDeDatos(
                id = "DEMO-SB-001",
                nombre = "Silo Lote Norte 01",
                estado = EstadoSilo.BUENO,
                ultimaActualizacion = "hace 5 min",
                tipoGrano = "Trigo",
                toneladas = 220.0,
                ubicacion = "Sector Norte - Parcela 4",
                diagnosticoSemanal = "Excelente conservación. Parámetros térmicos y de concentración de CO₂ en niveles óptimos.",
                temperatura = 21.5,
                humedad = 52.0,
                co2 = 450.0,
                presion = 1013.0,
                riskScore = 14,
                riskLevel = "NORMAL",
                deviceId = "DEMO-DEV-001",
                latitude = -35.0421,
                longitude = -58.7702,
                gpsFix = true,
                gpsHasFix = true,
                gpsSatellites = 9,
                gpsHdop = 0.9,
                gpsAgeMin = 5,
                history = synthHistory(
                    tempBase = 21.5, tempAmp = 1.2,
                    humBase = 52.0, co2Base = 450.0, presBase = 1013.0
                ),
                prediction = synthPrediction(
                    tempBase = 21.5, tempDrift = 0.3,
                    humBase = 52.0, humDrift = 0.4,
                    co2Base = 450.0, co2Drift = 10.0, presBase = 1013.0
                )
            ),
            SilobolsaBaseDeDatos(
                id = "DEMO-SB-002",
                nombre = "Silo Lote Sur 02",
                estado = EstadoSilo.ALERTA,
                ultimaActualizacion = "hace 12 min",
                tipoGrano = "Maíz",
                toneladas = 310.0,
                ubicacion = "Sector Sur - Parcela 12",
                diagnosticoSemanal = "Elevación moderada de temperatura (27.8 °C) y incremento de CO₂. Monitorear posible actividad biológica.",
                temperatura = 27.8,
                humedad = 64.0,
                co2 = 680.0,
                presion = 1011.0,
                riskScore = 48,
                riskLevel = "WARNING",
                deviceId = "DEMO-DEV-002",
                latitude = -35.0489,
                longitude = -58.7811,
                gpsFix = true,
                gpsHasFix = true,
                gpsSatellites = 8,
                gpsHdop = 1.1,
                gpsAgeMin = 12,
                history = synthHistory(
                    tempBase = 27.0, tempAmp = 1.0,
                    humBase = 64.0, co2Base = 640.0, presBase = 1011.0
                ),
                prediction = synthPrediction(
                    tempBase = 27.8, tempDrift = 0.5,
                    humBase = 64.0, humDrift = 0.8,
                    co2Base = 680.0, co2Drift = 35.0, presBase = 1011.0
                )
            ),
            SilobolsaBaseDeDatos(
                id = "DEMO-SB-003",
                nombre = "Silo Reserva A 03",
                estado = EstadoSilo.CRITICO,
                ultimaActualizacion = "hace 2 min",
                tipoGrano = "Soja",
                toneladas = 180.0,
                ubicacion = "Sector Este - Galpón Central",
                diagnosticoSemanal = "ALERTA CRÍTICA: Anomalía térmica sostenida (34.2 °C) y CO₂ elevado (920 ppm). Riesgo de pérdida por calentamiento.",
                tendenciaCritica = true,
                temperatura = 34.2,
                humedad = 71.0,
                co2 = 920.0,
                presion = 1008.0,
                riskScore = 87,
                riskLevel = "CRITICAL",
                deviceId = "DEMO-DEV-003",
                latitude = -35.0372,
                longitude = -58.7648,
                gpsFix = true,
                gpsHasFix = true,
                gpsSatellites = 11,
                gpsHdop = 0.8,
                gpsAgeMin = 2,
                history = synthHistory(
                    tempBase = 32.0, tempAmp = 2.2,
                    humBase = 71.0, co2Base = 860.0, presBase = 1008.0
                ),
                prediction = synthPrediction(
                    tempBase = 34.2, tempDrift = 0.9,
                    humBase = 71.0, humDrift = 1.1,
                    co2Base = 920.0, co2Drift = 60.0, presBase = 1008.0
                )
            ),
            SilobolsaBaseDeDatos(
                id = "DEMO-SB-004",
                nombre = "Silo Reserva B 04",
                estado = EstadoSilo.BUENO,
                ultimaActualizacion = "hace 20 min",
                tipoGrano = "Girasol",
                toneladas = 290.0,
                ubicacion = "Sector Oeste - Parcela 8",
                diagnosticoSemanal = "Parámetros estables dentro de los rangos de seguridad para almacenamiento de oleaginosas.",
                temperatura = 19.8,
                humedad = 48.0,
                co2 = 420.0,
                presion = 1014.0,
                riskScore = 10,
                riskLevel = "NORMAL",
                deviceId = "DEMO-DEV-004",
                latitude = -35.0534,
                longitude = -58.7765,
                gpsFix = true,
                gpsHasFix = true,
                gpsSatellites = 7,
                gpsHdop = 1.3,
                gpsAgeMin = 20,
                history = synthHistory(
                    tempBase = 19.8, tempAmp = 0.8,
                    humBase = 48.0, co2Base = 420.0, presBase = 1014.0
                ),
                prediction = synthPrediction(
                    tempBase = 19.8, tempDrift = 0.2,
                    humBase = 48.0, humDrift = 0.3,
                    co2Base = 420.0, co2Drift = 8.0, presBase = 1014.0
                )
            ),
            SilobolsaBaseDeDatos(
                id = "DEMO-SB-005",
                nombre = "Silo Campo Este 05",
                estado = EstadoSilo.BUENO,
                ultimaActualizacion = "hace 1 h",
                tipoGrano = "Cebada",
                toneladas = 410.0,
                ubicacion = "Campo Abierto - Sector Este",
                diagnosticoSemanal = "Monitoreo continuo estable. Sin desviaciones en humedad ni en temperatura de atmósfera interna.",
                temperatura = 20.4,
                humedad = 50.0,
                co2 = 460.0,
                presion = 1012.0,
                riskScore = 12,
                riskLevel = "NORMAL",
                deviceId = "DEMO-DEV-005",
                latitude = -35.0298,
                longitude = -58.7843,
                gpsFix = true,
                gpsHasFix = true,
                gpsSatellites = 10,
                gpsHdop = 0.9,
                gpsAgeMin = 60,
                history = synthHistory(
                    tempBase = 20.4, tempAmp = 1.0,
                    humBase = 50.0, co2Base = 460.0, presBase = 1012.0
                ),
                prediction = synthPrediction(
                    tempBase = 20.4, tempDrift = 0.2,
                    humBase = 50.0, humDrift = 0.3,
                    co2Base = 460.0, co2Drift = 10.0, presBase = 1012.0
                )
            ),
            SilobolsaBaseDeDatos(
                id = "DEMO-SB-006",
                nombre = "Silo Auxiliar 06",
                estado = EstadoSilo.SIN_DATOS,
                ultimaActualizacion = "Sin lecturas recientes",
                tipoGrano = "Trigo",
                toneladas = 150.0,
                ubicacion = "Sector Norte - Parcela 2",
                diagnosticoSemanal = "Módulo de transmisión offline o pendiente de primera sincronización.",
                temperatura = 0.0,
                humedad = 0.0,
                co2 = 0.0,
                presion = null,
                riskScore = 0,
                riskLevel = "UNKNOWN",
                deviceId = "DEMO-DEV-006",
                latitude = null,
                longitude = null,
                gpsFix = false,
                gpsHasFix = false,
                gpsSatellites = 0,
                gpsHdop = null,
                gpsAgeMin = null,
                history = emptyList(),
                prediction = emptyList()
            )
        )

        SilosDataManagerBaseDeDatos.silosList.addAll(demoSilos)

        val demoAlerts = listOf(
            AlertsManagerBaseDeDatos.toAppNotification(
                id = "DEMO-ALT-001",
                siloId = "DEMO-SB-003",
                siloName = "Silo Reserva A 03",
                severityStr = "CRITICAL",
                title = "CO₂ crítico en DEMO-SB-003",
                description = "Actividad biológica confirmada (≈920 ppm) con anomalía térmica sostenida; requiere revisar sellado.",
                recommendation = "Realizar aireación inmediata o priorizar despacho urgente de la materia prima.",
                timestamp = "Hace 12 min",
                acknowledged = false,
                resolvedAt = null
            ),
            AlertsManagerBaseDeDatos.toAppNotification(
                id = "DEMO-ALT-002",
                siloId = "DEMO-SB-002",
                siloName = "Silo Lote Sur 02",
                severityStr = "HIGH",
                title = "Temperatura elevada en DEMO-SB-002",
                description = "27.8 °C con CO₂ en ascenso (680 ppm); monitoreo reforzado requerido.",
                recommendation = "Inspeccionar la cubierta plástica para verificar sellado hermético.",
                timestamp = "Hace 2 hs",
                acknowledged = false,
                resolvedAt = null
            ),
            AlertsManagerBaseDeDatos.toAppNotification(
                id = "DEMO-ALT-003",
                siloId = "DEMO-SB-006",
                siloName = "Silo Auxiliar 06",
                severityStr = "CRITICAL",
                title = "Sensor sin conexión en DEMO-SB-006",
                description = "Hace 6 horas que no envía telemetría.",
                recommendation = "Verificar estado de batería solar y conexión del nodo emisor.",
                timestamp = "Hace 5 hs",
                acknowledged = false,
                resolvedAt = null
            ),
            AlertsManagerBaseDeDatos.toAppNotification(
                id = "DEMO-ALT-004",
                siloId = "DEMO-SB-005",
                siloName = "Silo Campo Este 05",
                severityStr = "LOW",
                title = "Batería baja en DEMO-SB-005",
                description = "22% restante en módulo solar.",
                recommendation = "Limpiar panel solar o reemplazar batería.",
                timestamp = "Ayer",
                acknowledged = true,
                resolvedAt = null
            ),
            AlertsManagerBaseDeDatos.toAppNotification(
                id = "DEMO-ALT-005",
                siloId = "DEMO-SB-003",
                siloName = "Silo Reserva A 03",
                severityStr = "INFO",
                title = "Resumen diario disponible",
                description = "Abrís con 3 estados buenos, 1 en alerta y 1 silo en crítico.",
                recommendation = "Mantener esquema de monitoreo diario.",
                timestamp = "Ayer",
                acknowledged = true,
                resolvedAt = "Ayer 18:30"
            )
        )

        AlertsManagerBaseDeDatos.alertsList.addAll(demoAlerts)
    }

    fun purgeDemoData() {
        SilosDataManagerBaseDeDatos.silosList.removeAll { it.id.startsWith("DEMO-") }
        AlertsManagerBaseDeDatos.alertsList.removeAll { it.id.startsWith("DEMO-") }
        ChatManagerBaseDeDatos.chatList.removeAll { it.name.startsWith("DEMO-") || it.id > 1000 }
    }

    /**
     * Serie temporal sintética de 24 lecturas hacia atrás, determinista
     * respecto de los parámetros (la fase depende del índice, no del reloj).
     */
    private fun synthHistory(
        tempBase: Double,
        tempAmp: Double,
        humBase: Double,
        co2Base: Double,
        presBase: Double?
    ): List<SensorReadingBaseDeDatos> {
        val now = Calendar.getInstance()
        val fmt = SimpleDateFormat("HH:mm", Locale.getDefault())
        val list = mutableListOf<SensorReadingBaseDeDatos>()
        for (i in 23 downTo 0) {
            val cal = (now.clone() as Calendar).apply { add(Calendar.HOUR_OF_DAY, -i) }
            val phase = (23 - i) / 23.0
            list += SensorReadingBaseDeDatos(
                timestamp = fmt.format(cal.time),
                temperature = round1(tempBase + tempAmp * sin(phase * PI)),
                humidity = round1(humBase + 2.0 * sin(phase * PI / 2.0)),
                co2 = (co2Base + 40.0 * sin(phase * PI)).roundToInt().toDouble(),
                pressure = presBase?.let { round1(it + 0.8 * sin(phase * PI / 3.0)) }
            )
        }
        return list
    }

    /**
     * Proyección sintética de 6 pasos futuros (una lectura por hora).
     */
    private fun synthPrediction(
        tempBase: Double,
        tempDrift: Double,
        humBase: Double,
        humDrift: Double,
        co2Base: Double,
        co2Drift: Double,
        presBase: Double?
    ): List<SensorReadingBaseDeDatos> {
        val list = mutableListOf<SensorReadingBaseDeDatos>()
        for (step in 1..6) {
            list += SensorReadingBaseDeDatos(
                timestamp = "+${step}h",
                temperature = round1(tempBase + tempDrift * step),
                humidity = round1(humBase + humDrift * step),
                co2 = (co2Base + co2Drift * step).roundToInt().toDouble(),
                pressure = presBase
            )
        }
        return list
    }

    private fun round1(value: Double): Double = (value * 10).roundToInt() / 10.0
}
