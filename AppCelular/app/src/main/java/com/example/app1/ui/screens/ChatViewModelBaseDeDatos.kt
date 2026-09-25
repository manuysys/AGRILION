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
import kotlinx.coroutines.launch

/**
 * ViewModel corregido: Maneja la sesión de forma asíncrona pero segura.
 */
class ChatViewModelBaseDeDatos : ViewModel() {
    private val apiService by lazy { ChatApiServiceBaseDeDatos.create() }
    
    val messages = mutableStateListOf<ChatManagerBaseDeDatos.ChatMessageBaseDeDatos>()
    var isSending by mutableStateOf(false)
    var currentSessionId by mutableStateOf(0)

    fun sendUserMessage(text: String) {
        if (text.isBlank() || isSending) return
        
        val userMsg = ChatManagerBaseDeDatos.ChatMessageBaseDeDatos(text, true)
        messages.add(userMsg)
        
        viewModelScope.launch {
            isSending = true
            try {
                // Llamada real al servidor
                val response = apiService.sendMessage(ChatRequestBaseDeDatos(message = text))
                
                // Respuesta de la IA
                val aiMsg = ChatManagerBaseDeDatos.ChatMessageBaseDeDatos(response.response, false)
                messages.add(aiMsg)
                
                // Actualizar sesión global
                currentSessionId = ChatManagerBaseDeDatos.onNewMessage(text, response.response, currentSessionId)
                
            } catch (e: Exception) {
                messages.add(
                    ChatManagerBaseDeDatos.ChatMessageBaseDeDatos(
                        "Error de conexión con el Asistente Lion. Verifica el servidor.", 
                        false
                    )
                )
            } finally {
                isSending = false
            }
        }
    }
}
