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
