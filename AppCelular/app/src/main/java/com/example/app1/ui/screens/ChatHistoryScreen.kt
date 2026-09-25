package com.example.app1.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.text.TextStyle
import com.example.app1.data.ChatManagerBaseDeDatos
import com.example.app1.data.AppStateBaseDeDatos

@Composable
fun ChatHistoryScreen(onChatClick: (Int) -> Unit) {
    // REQUERIMIENTO 1: Mostrar el historial de conversaciones guardadas automáticamente.
    val chatList = ChatManagerBaseDeDatos.chatList

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        if (chatList.isEmpty()) {
            Column(
                modifier = Modifier.fillMaxSize(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(modifier = Modifier.height(20.dp))
                Text(
                    text = AppStateBaseDeDatos.t("Empezar una conversación"),
                    style = TextStyle(
                        color = Color(0xFF00008B), 
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    ),
                    textAlign = TextAlign.Center,
                    modifier = Modifier.clickable { onChatClick(0) }
                )
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxWidth()) {
                items(chatList) { chat ->
                    ChatHistoryItem(
                        chat = chat,
                        onChatClick = { onChatClick(chat.id) },
                        onDelete = { ChatManagerBaseDeDatos.chatList.remove(chat) },
                        onRename = { newName -> 
                            val index = ChatManagerBaseDeDatos.chatList.indexOf(chat)
                            if (index != -1) ChatManagerBaseDeDatos.chatList[index] = chat.copy(name = newName)
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun ChatHistoryItem(
    chat: ChatManagerBaseDeDatos.ChatSessionBaseDeDatos, 
    onChatClick: () -> Unit,
    onDelete: () -> Unit,
    onRename: (String) -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    var showRenameDialog by remember { mutableStateOf(false) }
    var newNameText by remember { mutableStateOf(chat.name) }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clickable { onChatClick() },
        color = Color(0xFFF5F5F5),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = chat.name, 
                    style = MaterialTheme.typography.bodyLarge, 
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = chat.date, 
                    style = MaterialTheme.typography.bodySmall, 
                    color = Color.Gray
                )
            }
            
            // REQUERIMIENTO 1: 3 puntitos para eliminar y cambiar nombre
            Box {
                IconButton(onClick = { showMenu = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "Opciones")
                }
                
                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(AppStateBaseDeDatos.t("Editar nombre")) },
                        onClick = { 
                            showMenu = false
                            showRenameDialog = true 
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(AppStateBaseDeDatos.t("Eliminar"), color = Color.Red) },
                        onClick = { 
                            showMenu = false
                            onDelete() 
                        }
                    )
                }
            }
        }
    }

    if (showRenameDialog) {
        AlertDialog(
            onDismissRequest = { showRenameDialog = false },
            title = { Text(AppStateBaseDeDatos.t("Editar nombre")) },
            text = {
                OutlinedTextField(
                    value = newNameText,
                    onValueChange = { newNameText = it },
                    singleLine = true
                )
            },
            confirmButton = {
                TextButton(onClick = { 
                    onRename(newNameText)
                    showRenameDialog = false 
                }) {
                    Text(AppStateBaseDeDatos.t("Guardar"))
                }
            },
            dismissButton = {
                TextButton(onClick = { showRenameDialog = false }) {
                    Text(AppStateBaseDeDatos.t("Cancelar"))
                }
            }
        )
    }
}
