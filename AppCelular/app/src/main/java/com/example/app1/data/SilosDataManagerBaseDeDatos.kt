package com.example.app1.data

import androidx.compose.runtime.mutableStateListOf

/**
 * Gestor centralizado de datos de silobolsas.
 * AHORA VACÍO: Solo recibirá datos reales desde el Backend (Python/IA).
 */
object SilosDataManagerBaseDeDatos {
    
    // Lista maestra vacía (Se poblará mediante Retrofit tras conectar con el servidor)
    val silosList = mutableStateListOf<SilobolsaBaseDeDatos>()

    /**
     * Devuelve un análisis consolidado por tipo de grano.
     */
    fun getAnalisisGralPorGrano(grano: String): String {
        val silosDelGrano = silosList.filter { it.tipoGrano.equals(grano, ignoreCase = true) }
        
        // REQUERIMIENTO: Si no hay datos, informar correctamente.
        if (silosDelGrano.isEmpty()) return "No hay silobolsas registradas con este grano o no se recibieron datos del servidor."
        
        val criticos = silosDelGrano.count { it.estado == EstadoSilo.CRITICO }
        val totalTn = silosDelGrano.sumOf { it.toneladas }
        
        return when {
            criticos > 0 -> "ALERTA: Se detectaron $criticos silobolsas en estado CRÍTICO. El $totalTn TN de $grano están bajo riesgo de pérdida de calidad. Priorizar despacho."
            else -> "ESTADO ESTABLE: El estado general de las silobolsas de $grano es ÓPTIMO. Parámetros de conservación estables en $totalTn TN analizadas."
        }
    }
}
