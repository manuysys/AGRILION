package com.example.app1.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.app1.data.AppStateBaseDeDatos

@Composable
fun NotificationsScreen(onNotificationClick: (String) -> Unit) {
    // La lista está vacía hasta recibir datos del backend real.
    val alerts = listOf<NotificationItem>()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        if (alerts.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    // REQUERIMIENTO 3: Subir 30px hacia arriba (aprox -30dp)
                    .offset(y = (-30).dp), 
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No tienes notificaciones pendientes",
                    color = Color.Gray,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        } else {
            // Renderizado de alertas reales...
        }
    }
}

data class NotificationItem(val id: String, val title: String, val message: String, val time: String)
