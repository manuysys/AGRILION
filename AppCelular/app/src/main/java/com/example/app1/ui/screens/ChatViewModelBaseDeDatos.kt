package com.example.app1.ui.screens

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.app1.data.ChatApiServiceBaseDeDatos
import com.example.app1.data.ChatManagerBaseDeDatos
import com.example.app1.data.ChatRequestBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.data.EstadoSilo
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class ChatViewModelBaseDeDatos : ViewModel() {
    private val apiService by lazy { ChatApiServiceBaseDeDatos.create() }
    
    val messages = mutableStateListOf<ChatManagerBaseDeDatos.ChatMessageBaseDeDatos>()
    var isSending by mutableStateOf(false)
    var currentSessionId by mutableStateOf(0)
    
    // Estado de conexión con la AI API (null = verificando, true = conectada, false = modo local)
    var apiConnected by mutableStateOf<Boolean?>(null)
        private set

    private val clientSessionId = "app-${System.currentTimeMillis()}"

    init {
        checkHealthStatus()
    }

    fun checkHealthStatus() {
        viewModelScope.launch {
            apiConnected = null
            try {
                val health = apiService.checkHealth()
                apiConnected = health.status.equals("ok", ignoreCase = true) || health.status.equals("healthy", ignoreCase = true)
            } catch (e: Exception) {
                apiConnected = false
            }
        }
    }

    fun sendUserMessage(text: String, siloId: String? = null) {
        if (text.isBlank() || isSending) return
        
        val userMsg = ChatManagerBaseDeDatos.ChatMessageBaseDeDatos(text, true)
        messages.add(userMsg)
        
        viewModelScope.launch {
            isSending = true
            try {
                if (apiConnected != false) {
                    val response = apiService.sendMessage(
                        ChatRequestBaseDeDatos(
                            message = text,
                            silo_id = siloId,
                            session_id = clientSessionId
                        )
                    )
                    
                    if (response.response.isNotBlank()) {
                        val aiMsg = ChatManagerBaseDeDatos.ChatMessageBaseDeDatos(response.response, false)
                        messages.add(aiMsg)
                        currentSessionId = ChatManagerBaseDeDatos.onNewMessage(text, response.response, currentSessionId)
                        apiConnected = true
                        return@launch
                    }
                }
                
                // Fallback local con delay artificial
                delay((800 + Math.random() * 600).toLong())
                val fallbackText = localFallbackResponse(text, SilosDataManagerBaseDeDatos.silosList)
                val aiMsg = ChatManagerBaseDeDatos.ChatMessageBaseDeDatos(fallbackText, false)
                messages.add(aiMsg)
                currentSessionId = ChatManagerBaseDeDatos.onNewMessage(text, fallbackText, currentSessionId)
                
            } catch (e: Exception) {
                apiConnected = false
                delay((800 + Math.random() * 600).toLong())
                val fallbackText = localFallbackResponse(text, SilosDataManagerBaseDeDatos.silosList)
                val aiMsg = ChatManagerBaseDeDatos.ChatMessageBaseDeDatos(fallbackText, false)
                messages.add(aiMsg)
                currentSessionId = ChatManagerBaseDeDatos.onNewMessage(text, fallbackText, currentSessionId)
            } finally {
                isSending = false
            }
        }
    }

    /**
     * Fallback determinista local con datos reales del sistema.
     * Replica exactamente la función localFallbackResponse de ia-client.tsx
     */
    private fun localFallbackResponse(query: String, silos: List<SilobolsaBaseDeDatos>): String {
        val q = query.lowercase()

        if (q.contains("riesgo") || q.contains("peligro") || q.contains("crítico") || q.contains("critico")) {
            val critical = silos.filter { it.estado == EstadoSilo.CRITICO }
            val warn = silos.filter { it.estado == EstadoSilo.ALERTA }
            if (critical.isNotEmpty() || warn.isNotEmpty()) {
                val critNames = if (critical.isNotEmpty()) critical.joinToString(", ") { it.id } else "ninguno"
                val warnNames = if (warn.isNotEmpty()) warn.joinToString(", ") { it.id } else "ninguno"
                return "Actualmente hay ${critical.size} silo(s) en estado crítico ($critNames) y ${warn.size} en atención ($warnNames). Recomiendo inspección inmediata para los silos críticos."
            }
            return "No hay silos en estado de riesgo actualmente. Todos operan dentro de parámetros normales."
        }

        if (q.contains("batería") || q.contains("bateria") || q.contains("battery")) {
            return "No hay datos de batería baja reportados por los sensores en este momento. Todos transmiten señal óptima."
        }

        if (q.contains("resumen") || q.contains("semana") || q.contains("general")) {
            val critical = silos.count { it.estado == EstadoSilo.CRITICO }
            val warn = silos.count { it.estado == EstadoSilo.ALERTA }
            val ok = silos.count { it.estado == EstadoSilo.BUENO }
            return "Resumen del sistema: $ok silos estables, $warn en atención, $critical crítico(s). Tendencia general: los parámetros se mantienen dentro de márgenes esperados para la época."
        }

        // Buscar silo específico por ID o nombre
        for (silo in silos) {
            if (q.contains(silo.id.lowercase()) || q.contains(silo.nombre.lowercase())) {
                return "${silo.nombre} (ID: ${silo.id}) presenta estado ${silo.estado.texto.lowercase()}. Diagnóstico: ${silo.diagnosticoSemanal} Tipo de grano: ${silo.tipoGrano}."
            }
        }

        return "No tengo suficiente información para responder esa consulta específica. Probá con alguna de las sugerencias o preguntá sobre el estado de un silo específico."
    }
}
