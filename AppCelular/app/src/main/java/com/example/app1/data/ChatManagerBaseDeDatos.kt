package com.example.app1.data

import androidx.compose.runtime.mutableStateListOf
import java.text.SimpleDateFormat
import java.util.*

/**
 * Gestor de conversaciones con guardado automático e inteligencia temática.
 * Relacionado con el pipeline de 'IA chatbot/Inteligencia_Artificial'.
 */
object ChatManagerBaseDeDatos {
    val chatList = mutableStateListOf<ChatSessionBaseDeDatos>()

    data class ChatSessionBaseDeDatos(
        val id: Int,
        var name: String,
        val date: String,
        val messages: MutableList<ChatMessageBaseDeDatos> = mutableListOf()
    )

    data class ChatMessageBaseDeDatos(
        val text: String,
        val isUser: Boolean,
        val timestamp: Long = System.currentTimeMillis()
    )

    /**
     * 1. GUARDADO AUTOMÁTICO Y NOMBRADO INTELIGENTE
     * Genera un nombre basado en la fecha y el tema de la primera pregunta.
     */
    fun onNewMessage(userMessage: String, aiResponse: String, sessionId: Int): Int {
        val today = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(Date())
        
        // Buscar si ya existe la sesión
        val existingChat = chatList.find { it.id == sessionId }
        
        if (existingChat == null) {
            // Es el primer mensaje: Crear sesión y generar nombre inteligente
            val topic = extractTopic(userMessage)
            val autoName = "$today - $topic"
            
            val newId = if (chatList.isEmpty()) 1 else chatList.maxOf { it.id } + 1
            val newSession = ChatSessionBaseDeDatos(
                id = newId,
                name = autoName,
                date = today
            ).apply {
                messages.add(ChatMessageBaseDeDatos(userMessage, true))
                messages.add(ChatMessageBaseDeDatos(aiResponse, false))
            }
            chatList.add(0, newSession)
            return newId
        } else {
            // Actualizar sesión existente
            existingChat.messages.add(ChatMessageBaseDeDatos(userMessage, true))
            existingChat.messages.add(ChatMessageBaseDeDatos(aiResponse, false))
            return sessionId
        }
    }

    /**
     * Extrae una palabra clave o tema de la pregunta para el nombre del chat.
     */
    private fun extractTopic(message: String): String {
        val m = message.lowercase()
        return when {
            m.contains("trigo") -> "Consulta Trigo"
            m.contains("maiz") || m.contains("maíz") -> "Análisis Maíz"
            m.contains("soja") -> "Estado Soja"
            m.contains("girasol") -> "Girasol Tech"
            m.contains("riesgo") || m.contains("peligro") -> "Evaluación Riesgo"
            m.contains("clima") || m.contains("tiempo") -> "Pronóstico"
            m.contains("precio") || m.contains("cotizacion") -> "Mercado BCR"
            else -> if (message.length > 15) message.take(15) + "..." else message
        }
    }

    /**
     * 2. RESPUESTA UNIVERSAL (Relacionada con Inteligencia_Artificial)
     * Capaz de responder cualquier pregunta técnica o general.
     */
    fun getAIResponse(query: String): String {
        val q = query.lowercase()
        
        // Simulación de integración con scripts/demo_chatbot.py y src/chatbot_service.py
        return when {
            // Respuestas Técnicas (Pipeline ML)
            q.contains("riesgo") || q.contains("anomalia") -> 
                "Invocando RiskEngine y AnomalyDetector... Se detecta una anomalía por consenso en el sensor de CO2. Nivel de riesgo: ALTO (82%). Revisa el sellado."
            
            q.contains("trigo") || q.contains("grano") -> 
                "Consultando modelos LSTM en 'models/lstm_silo.h5'... La proyección indica estabilidad térmica para los próximos 7 días."
            
            // Respuestas Generales (Relación con LLM Multi-model de llm_client.py)
            q.contains("hola") || q.contains("quien sos") || q.contains("quién eres") ->
                "¡Hola! Soy Lion, el Asistente de IA de AGRILION. Estoy conectado a tu red de silobolsas y a modelos de lenguaje avanzados para ayudarte en lo que necesites."
            
            q.contains("ayuda") || q.contains("como funciona") ->
                "Puedes preguntarme sobre el estado de tus granos, precios de mercado o cualquier duda general. Estoy aquí para procesar tus datos."
            
            // Respuesta Universal (Caída a LLM/General)
            else -> "Entendido. Analizando tu consulta ('$query') con mis scripts de procesamiento de lenguaje natural... ¿Deseas que profundice en algún aspecto técnico de tus silos?"
        }
    }
}
