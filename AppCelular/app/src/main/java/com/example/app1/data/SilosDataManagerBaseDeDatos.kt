package com.example.app1.data

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

/**
 * Gestor centralizado de datos de silobolsas.
 *
 * Fuente de verdad:
 * - AI API / InfluxDB: lecturas, estado y riesgo de cada silo.
 * - Firestore: nombre, ubicación, toneladas y tipo de grano del usuario.
 */
object SilosDataManagerBaseDeDatos {

    val silosList = mutableStateListOf<SilobolsaBaseDeDatos>()

    var isLoading by mutableStateOf(false)
        private set
    var error by mutableStateOf<String?>(null)
        private set
    var lastRefresh by mutableStateOf<Long?>(null)
        private set

    private val api by lazy { SilosApiService.create() }
    private val auth by lazy { AuthManager.getInstance() }

    suspend fun refresh() {
        isLoading = true
        error = null
        try {
            val overview = api.getOverview().silos
            val userSilos = try {
                auth.getUserSilos()
            } catch (_: Exception) {
                emptyList()
            }
            val metaById = userSilos.associateBy { it["siloId"]?.toString().orEmpty() }

            val fromApi = overview.map { dto ->
                val meta = metaById[dto.siloId]
                val latitude = dto.latitude ?: meta?.double("latitude")
                val longitude = dto.longitude ?: meta?.double("longitude")
                val stale = isStale(dto.lastUpdate)
                SilobolsaBaseDeDatos(
                    id = dto.siloId,
                    nombre = meta?.string("name") ?: "Silobolsa ${dto.siloId}",
                    estado = if (stale) EstadoSilo.SIN_DATOS else estadoFrom(dto.riskLevel),
                    ultimaActualizacion = relativeTime(dto.lastUpdate),
                    tipoGrano = meta?.string("grainType") ?: dto.grainType ?: "Sin dato",
                    toneladas = meta?.double("tons") ?: 0.0,
                    ubicacion = meta?.string("location") ?: "Sin ubicación",
                    diagnosticoSemanal = if (stale) {
                        "Sin lecturas recientes. Verificá la alimentación, la señal LoRa y el estado del nodo."
                    } else {
                        diagnostico(dto)
                    },
                    temperatura = dto.temperature,
                    humedad = dto.humidity,
                    co2 = dto.co2,
                    presion = dto.pressure,
                    riskScore = dto.riskScore,
                    riskLevel = dto.riskLevel,
                    deviceId = dto.deviceId,
                    latitude = latitude,
                    longitude = longitude,
                    gpsFix = dto.gpsFix ?: meta?.bool("gps_fix") ?: false,
                    gpsHasFix = dto.gpsHasFix ?: (latitude != null && longitude != null),
                    gpsSatellites = dto.gpsSatellites ?: meta?.int("gps_satellites"),
                    gpsHdop = dto.gpsHdop ?: meta?.double("gps_hdop"),
                    gpsAgeMin = dto.gpsAgeMin ?: meta?.int("gps_age_min")
                )
            }

            // Silos creados por el usuario que todavía no tienen lecturas.
            val apiIds = fromApi.map { it.id }.toSet()
            val onlyFirestore = userSilos
                .filter { meta -> (meta["siloId"]?.toString().orEmpty()) !in apiIds }
                .map { meta ->
                    val id = meta["siloId"]?.toString().orEmpty()
                    val latitude = meta.double("latitude")
                    val longitude = meta.double("longitude")
                    SilobolsaBaseDeDatos(
                        id = id,
                        nombre = meta.string("name") ?: "Silobolsa $id",
                        estado = EstadoSilo.SIN_DATOS,
                        ultimaActualizacion = "Sin lecturas",
                        tipoGrano = meta.string("grainType") ?: "Sin dato",
                        toneladas = meta.double("tons") ?: 0.0,
                        ubicacion = meta.string("location") ?: "Sin ubicación",
                        diagnosticoSemanal = "Todavía no se recibieron lecturas de este silo.",
                        latitude = latitude,
                        longitude = longitude,
                        gpsFix = meta.bool("gps_fix") ?: false,
                        gpsHasFix = latitude != null && longitude != null,
                        gpsSatellites = meta.int("gps_satellites"),
                        gpsHdop = meta.double("gps_hdop"),
                        gpsAgeMin = meta.int("gps_age_min")
                    )
                }

            val merged = (fromApi + onlyFirestore)
                .sortedWith(compareByDescending<SilobolsaBaseDeDatos> { it.riskScore }
                    .thenBy { it.nombre })

            silosList.clear()
            silosList.addAll(merged)
            lastRefresh = System.currentTimeMillis()
        } catch (e: Exception) {
            error = e.message ?: "No se pudo conectar con la API"
        } finally {
            isLoading = false
        }
    }

    suspend fun loadDetail(siloId: String): SilobolsaBaseDeDatos? {
        val current = silosList.find { it.id == siloId } ?: return null
        return try {
            val history = api.getHistory(siloId, 24).history.map {
                SensorReadingBaseDeDatos(
                    timestamp = it.timestamp,
                    temperature = it.temperature,
                    humidity = it.humidity,
                    co2 = it.co2,
                    pressure = it.pressure
                )
            }
            val prediction = api.getPrediction(siloId).predictions.map {
                SensorReadingBaseDeDatos(
                    timestamp = it.timestamp,
                    temperature = it.temperature,
                    humidity = it.humidity ?: 0.0,
                    co2 = it.co2 ?: 0.0
                )
            }
            val updated = current.copy(history = history, prediction = prediction)
            val index = silosList.indexOfFirst { it.id == siloId }
            if (index >= 0) silosList[index] = updated
            updated
        } catch (_: Exception) {
            current
        }
    }

    fun clear() {
        silosList.clear()
        error = null
        lastRefresh = null
    }

    /**
     * Análisis agregado por tipo de grano, calculado con las lecturas reales.
     */
    fun getAnalisisGralPorGrano(grano: String): String {
        val grupo = silosList.filter { it.tipoGrano.equals(grano, ignoreCase = true) }
        if (grupo.isEmpty()) {
            return "No hay silos de $grano con lecturas disponibles."
        }

        val avgTemp = grupo.map { it.temperatura }.average()
        val avgHum = grupo.map { it.humedad }.average()
        val avgCo2 = grupo.map { it.co2 }.average()
        val maxRisk = grupo.maxOf { it.riskScore }
        val conDatos = grupo.count { it.estado != EstadoSilo.SIN_DATOS }

        val estado = when {
            maxRisk >= 70 -> "crítico"
            maxRisk >= 40 -> "en observación"
            else -> "estable"
        }

        val recomendacion = when {
            avgCo2 > 1200 -> "Priorizar ventilación y revisar el sellado: el CO₂ promedio supera el umbral crítico."
            avgCo2 > 600 -> "Aumentar la frecuencia de monitoreo y verificar la hermeticidad de las bolsas."
            avgHum > 70 -> "Revisar la humedad y evitar condensación dentro de la silobolsa."
            else -> "Mantener el monitoreo periódico y conservar las condiciones actuales."
        }

        return "Estado $estado: $conDatos de ${grupo.size} silos con datos. " +
            "Temperatura media ${String.format(Locale.US, "%.1f", avgTemp)} °C, " +
            "humedad media ${String.format(Locale.US, "%.1f", avgHum)} %, " +
            "CO₂ medio ${avgCo2.toInt()} ppm. $recomendacion"
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private fun estadoFrom(level: String): EstadoSilo = when (level.uppercase()) {
        "CRITICAL" -> EstadoSilo.CRITICO
        "WARNING" -> EstadoSilo.ALERTA
        "NORMAL" -> EstadoSilo.BUENO
        else -> EstadoSilo.SIN_DATOS
    }

    private fun diagnostico(dto: SiloOverviewDto): String {
        val co2 = if (dto.co2 <= 0) "sin dato" else "${dto.co2.toInt()} ppm"
        return when (dto.riskLevel.uppercase()) {
            "CRITICAL" -> "Riesgo crítico. CO₂: $co2. Revisar sellado y ventilación."
            "WARNING" -> "Condiciones inestables. CO₂: $co2. Monitorear las próximas 24 h."
            else -> "Parámetros dentro de rangos normales. CO₂: $co2."
        }
    }

    private fun relativeTime(iso: String): String {
        if (iso.isBlank()) return "Sin fecha"
        return try {
            val date = parseUtc(iso) ?: return iso
            val diff = System.currentTimeMillis() - date.time
            val minutes = diff / 60000
            when {
                minutes < 1 -> "hace unos segundos"
                minutes < 60 -> "hace $minutes min"
                minutes < 1440 -> "hace ${minutes / 60} h"
                else -> "hace ${minutes / 1440} días"
            }
        } catch (_: Exception) {
            iso
        }
    }

    private fun isStale(iso: String): Boolean {
        if (iso.isBlank()) return false
        return try {
            val date = parseUtc(iso) ?: return false
            System.currentTimeMillis() - date.time >= 6 * 60 * 60 * 1000L
        } catch (_: Exception) {
            false
        }
    }

    private fun parseUtc(iso: String): Date? {
        val clean = iso.take(19)
        val parser = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        return parser.parse(clean)
    }

    private fun Map<String, Any>.string(key: String): String? =
        this[key]?.toString()?.takeIf { it.isNotBlank() }

    private fun Map<String, Any>.double(key: String): Double? =
        (this[key] as? Number)?.toDouble()

    private fun Map<String, Any>.int(key: String): Int? =
        (this[key] as? Number)?.toInt()

    private fun Map<String, Any>.bool(key: String): Boolean? =
        this[key] as? Boolean
}
