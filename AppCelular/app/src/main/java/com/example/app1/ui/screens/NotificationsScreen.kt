package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens

@Composable
fun NotificationsScreen(onNotificationClick: (String) -> Unit) {
    val silos = SilosDataManagerBaseDeDatos.silosList
    val alerts = silos.filter { it.estado == EstadoSilo.ALERTA || it.estado == EstadoSilo.CRITICO }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
    ) {
        if (alerts.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No tienes notificaciones pendientes",
                    color = AgrilionTokens.Zinc400,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                items(alerts) { silo ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .border(
                                1.dp,
                                if (silo.estado == EstadoSilo.CRITICO) AgrilionTokens.Critical
                                else AgrilionTokens.Warn,
                                AgrilionTokens.RadiusCard
                            )
                            .clickable { onNotificationClick(silo.id) },
                        shape = AgrilionTokens.RadiusCard,
                        colors = CardDefaults.cardColors(
                            containerColor = AgrilionTokens.SurfaceDark1
                        )
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = if (silo.estado == EstadoSilo.CRITICO) AgrilionTokens.Critical
                                else AgrilionTokens.Warn
                            )
                            Spacer(Modifier.width(12.dp))
                            Column(Modifier.weight(1f)) {
                                Text(
                                    text = silo.nombre,
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = silo.diagnosticoSemanal,
                                    color = AgrilionTokens.Zinc400,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = "Riesgo ${silo.riskScore}/100 · ${silo.ultimaActualizacion}",
                                    color = AgrilionTokens.Zinc500,
                                    fontSize = 10.sp
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
