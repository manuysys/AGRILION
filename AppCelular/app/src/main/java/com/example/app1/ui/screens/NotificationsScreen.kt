package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.app1.ui.theme.AgrilionTokens

@Composable
fun NotificationsScreen(onNotificationClick: (String) -> Unit) {
    val alerts = listOf<NotificationItem>()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
    ) {
        if (alerts.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .offset(y = (-30).dp), 
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No tienes notificaciones pendientes",
                    color = AgrilionTokens.Zinc400,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        } else {
            // Renderizado de alertas
        }
    }
}

data class NotificationItem(val id: String, val title: String, val message: String, val time: String)
