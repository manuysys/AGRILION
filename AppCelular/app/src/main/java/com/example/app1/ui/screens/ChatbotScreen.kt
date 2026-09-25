package com.example.app1.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.ChatManagerBaseDeDatos
import java.util.Calendar

@Composable
fun ChatbotScreen(chatViewModel: ChatViewModelBaseDeDatos = viewModel()) {
    var messageText by remember { mutableStateOf("") }
    
    // Saludo inicial dinámico
    val initialGreeting = remember(AppStateBaseDeDatos.userName, AppStateBaseDeDatos.currentLanguage) {
        val currentTime = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
        val saludo = when (currentTime) {
            in 6..11 -> AppStateBaseDeDatos.t("Buenos Días")
            in 12..19 -> AppStateBaseDeDatos.t("Buenas Tardes")
            else -> AppStateBaseDeDatos.t("Buenas Noches")
        }
        "$saludo, ${AppStateBaseDeDatos.userName}.\n" +
                AppStateBaseDeDatos.t("Mi nombre es Lion. Aquí puedes consultarme tus dudas")
    }

    val localMessages = chatViewModel.messages

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Mostrar saludo inicial
            item {
                ChatBubble(message = ChatManagerBaseDeDatos.ChatMessageBaseDeDatos(initialGreeting, false))
            }
            
            items(localMessages) { msg ->
                ChatBubble(message = msg)
            }
            
            if (chatViewModel.isSending) {
                item {
                    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp))
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = messageText,
            onValueChange = { messageText = it },
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text(AppStateBaseDeDatos.t("Preguntame")) },
            shape = RoundedCornerShape(24.dp),
            trailingIcon = {
                IconButton(
                    onClick = { 
                        if (messageText.isNotBlank()) {
                            chatViewModel.sendUserMessage(messageText)
                            messageText = ""
                        }
                    },
                    enabled = !chatViewModel.isSending
                ) {
                    Icon(
                        Icons.AutoMirrored.Filled.Send, 
                        contentDescription = "Enviar",
                        tint = if (chatViewModel.isSending) Color.Gray else MaterialTheme.colorScheme.primary
                    )
                }
            },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = MaterialTheme.colorScheme.primary,
                unfocusedBorderColor = Color.Gray
            ),
            enabled = !chatViewModel.isSending
        )
    }
}

@Composable
fun ChatBubble(message: ChatManagerBaseDeDatos.ChatMessageBaseDeDatos) {
    val alignment = if (message.isUser) Alignment.CenterEnd else Alignment.CenterStart
    val bgColor = if (message.isUser) MaterialTheme.colorScheme.primary else Color(0xFFF0F0F0)
    val txtColor = if (message.isUser) Color.White else Color.Black
    val shape = if (message.isUser) 
        RoundedCornerShape(16.dp, 16.dp, 2.dp, 16.dp) else 
        RoundedCornerShape(16.dp, 16.dp, 16.dp, 2.dp)

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = alignment
    ) {
        Surface(
            color = bgColor,
            shape = shape,
            tonalElevation = 1.dp
        ) {
            Text(
                text = message.text,
                modifier = Modifier.padding(12.dp),
                color = txtColor,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}
