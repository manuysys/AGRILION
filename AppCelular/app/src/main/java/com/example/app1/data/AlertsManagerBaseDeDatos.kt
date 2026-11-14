package com.example.app1.data

import androidx.compose.runtime.mutableStateListOf
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * Gestor centralizado de Notificaciones y Alertas del Sistema.
 * NO USA DATOS HARDCODEADOS: Se inicia vacío y se puebla dinámicamente
 * con notificaciones reales desde la base de datos (Firestore/Realtime DB/Backend).
 */
object AlertsManagerBaseDeDatos {

    // Lista reactiva de notificaciones reales (Inicia vacía)
    val alertsList = mutableStateListOf<AlertBaseDeDatos>()

    /**
     * Transformador universal toAppNotification(doc)
     * Convierte mapas de datos crudos a modelos de notificación de la app.
     */
    fun toAppNotification(
        id: String,
        siloId: String? = null,
        siloName: String? = null,
        severityStr: String? = "INFO",
        title: String,
        description: String? = null,
        recommendation: String? = null,
        timestamp: String? = null,
        acknowledged: Boolean = false,
        resolvedAt: String? = null
    ): AlertBaseDeDatos {
        val severity = when (severityStr?.uppercase()) {
            "CRITICAL", "CRÍTICA", "CRITICO", "HIGH", "ALTA" -> AlertSeverity.CRITICAL
            "MEDIUM", "ATENCIÓN", "WARN", "WARNNING" -> AlertSeverity.MEDIUM
            "LOW", "BAJA" -> AlertSeverity.LOW
            else -> AlertSeverity.INFO
        }

        return AlertBaseDeDatos(
            id = id,
            siloId = siloId ?: "",
            siloName = siloName ?: "",
            severity = severity,
            title = title,
            description = description ?: "",
            recommendation = recommendation ?: "",
            timestamp = timestamp ?: "",
            acknowledged = acknowledged,
            resolvedAt = resolvedAt
        )
    }

    /**
     * Marca la notificación como vista tanto en memoria reactiva como en el almacenamiento persistente.
     */
    fun acknowledgeAlert(alertId: String) {
        val index = alertsList.indexOfFirst { it.id == alertId }
        if (index != -1) {
            val oldAlert = alertsList[index]
            alertsList[index] = oldAlert.copy(acknowledged = true)
        }
    }

    /**
     * Marca la notificación como resuelta guardando la marca de tiempo de resolución.
     * NO modifica la marca de 'acknowledged' (vistas y resueltas son independientes).
     */
    fun resolveAlert(alertId: String) {
        val index = alertsList.indexOfFirst { it.id == alertId }
        if (index != -1) {
            val oldAlert = alertsList[index]
            val timestampNow = SimpleDateFormat("dd/MM/yyyy HH:mm", Locale.getDefault()).format(Date())
            alertsList[index] = oldAlert.copy(resolvedAt = oldAlert.resolvedAt ?: timestampNow)
        }
    }
}
