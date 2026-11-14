package com.example.app1.data

import androidx.compose.ui.graphics.Color

data class SilobolsaBaseDeDatos(
    val id: String,
    val nombre: String,
    val estado: EstadoSilo,
    val ultimaActualizacion: String,
    val tipoGrano: String,
    val toneladas: Double,
    val ubicacion: String = "", // Nuevo campo de ubicación
    val diagnosticoSemanal: String = "Pendiente de análisis por IA...",
    val tendenciaCritica: Boolean = false,
    // Lecturas reales de la AI API / InfluxDB
    val temperatura: Double = 0.0,
    val humedad: Double = 0.0,
    val co2: Double = 0.0,
    val presion: Double? = null,
    val riskScore: Int = 0,
    val riskLevel: String = "NORMAL",
    val deviceId: String? = null,
    val latitude: Double? = null,
    val longitude: Double? = null,
    val gpsFix: Boolean = false,
    val gpsHasFix: Boolean = false,
    val gpsSatellites: Int? = null,
    val gpsHdop: Double? = null,
    val gpsAgeMin: Int? = null,
    val history: List<SensorReadingBaseDeDatos> = emptyList(),
    val prediction: List<SensorReadingBaseDeDatos> = emptyList()
)

data class SensorReadingBaseDeDatos(
    val timestamp: String,
    val temperature: Double,
    val humidity: Double,
    val co2: Double,
    val pressure: Double? = null
)

enum class EstadoSilo(val color: Color, val texto: String) {
    BUENO(Color(0xFF4CAF50), "Bueno"),
    ALERTA(Color(0xFFFFC107), "Alerta"),
    CRITICO(Color(0xFFF44336), "Crítico"),
    SIN_DATOS(Color(0xFF9E9E9E), "Sin Datos")
}

data class CotizacionGranoBaseDeDatos(
    val grano: String,
    val precioUSD: Double,
    val precioARS: Double,
    val fecha: String = "10/07/2026"
)

data class NotificacionBaseDeDatos(
    val id: Int,
    val titulo: String,
    val mensaje: String,
    val hora: String,
    val esCritica: Boolean,
    val tipo: TipoNotificacion = TipoNotificacion.ALERTA
)

enum class TipoNotificacion {
    ALERTA,
    SIN_DATOS,
    CRITICA_IA
}

data class DistribucionGranoBaseDeDatos(
    val grano: String,
    val toneladas: Double,
    val progreso: Float
)

/**
 * Severidad de una notificación del sistema (portado de Agrilion+).
 */
enum class AlertSeverity(val label: String, val color: Color, val bgColor: Color) {
    CRITICAL("CRÍTICA", Color(0xFFDC2626), Color(0x33DC2626)),
    HIGH("ALTA", Color(0xFFF87171), Color(0x33F87171)),
    MEDIUM("MEDIA", Color(0xFFF59E0B), Color(0x33F59E0B)),
    LOW("BAJA", Color(0xFF60A5FA), Color(0x3360A5FA)),
    INFO("INFO", Color(0xFF16A34A), Color(0x3316A34A))
}

/**
 * Notificación centralizada del sistema, independiente del modelo de silo.
 */
data class AlertBaseDeDatos(
    val id: String,
    val siloId: String,
    val siloName: String,
    val severity: AlertSeverity,
    val title: String,
    val description: String,
    val recommendation: String,
    val timestamp: String,
    var acknowledged: Boolean = false,
    val resolvedAt: String? = null
)

/**
 * Metadatos de la respuesta de predicción IA (LSTM) para el detalle del silo:
 * estado del modelo, lecturas disponibles/requeridas y mapas de anomalías y riesgo compuesto.
 */
data class PredictionMeta(
    val siloId: String,
    val status: String,
    val readings: Int,
    val required: Int,
    val model: String,
    val anomalies: Map<String, Any>? = null,
    val risk: Map<String, Any>? = null
)
