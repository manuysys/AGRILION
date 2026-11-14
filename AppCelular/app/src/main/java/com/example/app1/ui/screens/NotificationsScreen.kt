package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.RemoveRedEye
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.AlertBaseDeDatos
import com.example.app1.data.AlertSeverity
import com.example.app1.data.AlertsManagerBaseDeDatos
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SettingsManager
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens

@Composable
fun NotificationsScreen(
    onNotificationClick: (String) -> Unit,
    onLoginClick: () -> Unit = {}
) {
    var selectedFilter by remember { mutableStateOf("all") }
    var searchQuery by remember { mutableStateOf("") }

    val allAlerts = AlertsManagerBaseDeDatos.alertsList
    val isLoggedIn = AppStateBaseDeDatos.isUserLoggedIn || AppStateBaseDeDatos.isDemoMode

    // Alertas sintéticas on-the-fly para silos reales en ALERTA/CRÍTICO
    // que aún no tengan una notificación con el mismo siloId en AlertsManager.
    val silosList = SilosDataManagerBaseDeDatos.silosList
    val syntheticAlerts = if (AppStateBaseDeDatos.isDemoMode) {
        emptyList()
    } else {
        silosList
            .filter { it.estado == EstadoSilo.ALERTA || it.estado == EstadoSilo.CRITICO }
            .filter { silo -> allAlerts.none { it.siloId == silo.id } }
            .map { silo ->
                AlertBaseDeDatos(
                    id = "SILO-${silo.id}",
                    siloId = silo.id,
                    siloName = silo.nombre,
                    severity = if (silo.estado == EstadoSilo.CRITICO) AlertSeverity.CRITICAL else AlertSeverity.MEDIUM,
                    title = "${AppStateBaseDeDatos.t("Estado del silo")}: ${silo.estado.texto}",
                    description = silo.diagnosticoSemanal,
                    recommendation = "",
                    timestamp = silo.ultimaActualizacion
                )
            }
    }

    val mergedAlerts = allAlerts + syntheticAlerts

    val filteredAlerts = mergedAlerts.filter { alert ->
        val matchesSettings = if (selectedFilter == "resolved" && alert.resolvedAt != null) {
            true
        } else {
            when (alert.severity) {
                AlertSeverity.CRITICAL -> SettingsManager.bannerCritical
                AlertSeverity.HIGH -> SettingsManager.bannerHigh
                AlertSeverity.MEDIUM -> SettingsManager.bannerMedium
                AlertSeverity.LOW -> SettingsManager.bannerLow
                AlertSeverity.INFO -> true
            }
        }

        val matchesCategory = when (selectedFilter) {
            "viewed" -> alert.acknowledged && alert.resolvedAt == null
            "resolved" -> alert.resolvedAt != null
            "critical" -> alert.severity == AlertSeverity.CRITICAL && !alert.acknowledged && alert.resolvedAt == null
            "medium" -> alert.severity == AlertSeverity.MEDIUM && !alert.acknowledged && alert.resolvedAt == null
            "low" -> alert.severity == AlertSeverity.LOW && !alert.acknowledged && alert.resolvedAt == null
            else -> true
        }

        val matchesSearch = if (searchQuery.isBlank()) true else {
            val q = searchQuery.lowercase()
            alert.title.lowercase().contains(q) ||
            alert.siloName.lowercase().contains(q) ||
            alert.description.lowercase().contains(q) ||
            alert.siloId.lowercase().contains(q)
        }

        matchesCategory && matchesSearch && matchesSettings
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
    ) {
        // BARRA DE FILTROS
        val filterOptions = listOf(
            "all" to AppStateBaseDeDatos.t("Todas"),
            "critical" to AppStateBaseDeDatos.t("Críticas"),
            "medium" to AppStateBaseDeDatos.t("Atención"),
            "low" to AppStateBaseDeDatos.t("Bajas"),
            "viewed" to AppStateBaseDeDatos.t("Vistas"),
            "resolved" to AppStateBaseDeDatos.t("Resueltas")
        )

        LazyRow(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            items(filterOptions) { (key, label) ->
                val isActive = selectedFilter == key
                val (pillBg, pillText) = when (key) {
                    "critical" -> Color(0x33DC2626) to Color(0xFFF87171)
                    "medium" -> Color(0x33F59E0B) to Color(0xFFFBBF24)
                    "low" -> Color(0x3360A5FA) to Color(0xFF93C5FD)
                    "viewed" -> Color(0x33A1A1AA) to Color(0xFFE4E4E7)
                    "resolved" -> Color(0x3316A34A) to Color(0xFF4ADE80)
                    else -> Color(0x26FFFFFF) to Color.White
                }

                Surface(
                    onClick = { selectedFilter = key },
                    shape = RoundedCornerShape(12.dp),
                    color = if (isActive) pillBg else AgrilionTokens.SurfaceDark1,
                    border = androidx.compose.foundation.BorderStroke(
                        1.dp,
                        if (isActive) pillText.copy(alpha = 0.5f) else AgrilionTokens.BorderSubtle
                    )
                ) {
                    Text(
                        text = label.uppercase(),
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp,
                        color = if (isActive) pillText else AgrilionTokens.Zinc500
                    )
                }
            }
        }

        // BUSCADOR
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            placeholder = { Text(AppStateBaseDeDatos.t("Buscar..."), color = AgrilionTokens.Zinc500, fontSize = 13.sp) },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = AgrilionTokens.Zinc500) },
            shape = RoundedCornerShape(14.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = AgrilionTokens.Emerald500,
                unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                focusedContainerColor = AgrilionTokens.SurfaceDark1,
                unfocusedContainerColor = AgrilionTokens.SurfaceDark1
            )
        )

        // ESTADO SIN SESIÓN
        if (!isLoggedIn) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
                shape = AgrilionTokens.RadiusCard,
                colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(AppStateBaseDeDatos.t("Iniciá sesión para ver tus notificaciones"), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = onLoginClick,
                        colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Text(AppStateBaseDeDatos.t("INICIAR SESIÓN"), fontWeight = FontWeight.Bold, fontSize = 12.sp)
                    }
                }
            }
        } else if (filteredAlerts.isEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
                shape = AgrilionTokens.RadiusCard,
                colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
            ) {
                Column(
                    modifier = Modifier.padding(28.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(Icons.Default.FilterList, contentDescription = null, tint = AgrilionTokens.Zinc500, modifier = Modifier.size(36.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(AppStateBaseDeDatos.t("No hay notificaciones"), color = Color.White, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    Text(AppStateBaseDeDatos.t("Cuando tu equipo reporte eventos, aparecerán acá"), color = AgrilionTokens.Zinc500, fontSize = 12.sp, modifier = Modifier.padding(top = 4.dp))
                }
            }
        } else {
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(12.dp),
                contentPadding = PaddingValues(bottom = 100.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(filteredAlerts) { alert ->
                    AlertCardReplica(
                        alert = alert,
                        onAcknowledge = {
                            // Si es sintética (on-the-fly), persistirla en memoria antes de marcar
                            // para que la acción sobreviva a la recomposición y al filtrado.
                            if (allAlerts.none { it.id == alert.id }) {
                                allAlerts.add(alert)
                            }
                            AlertsManagerBaseDeDatos.acknowledgeAlert(alert.id)
                        },
                        onResolve = {
                            if (allAlerts.none { it.id == alert.id }) {
                                allAlerts.add(alert)
                            }
                            AlertsManagerBaseDeDatos.resolveAlert(alert.id)
                        },
                        onNavigate = { if (alert.siloId.isNotBlank()) onNotificationClick(alert.siloId) }
                    )
                }
            }
        }
    }
}

/**
 * Renderiza el card compacto de notificación con barra de severidad lateral a la izquierda,
 * encabezado con icono + severidad + siloName + título, timestamp monospace, descripción,
 * caja opcional de acción recomendada y la fila inferior de botones únicos de acción.
 * SIN clickables en la superficie del card.
 */
@Composable
fun AlertCardReplica(
    alert: AlertBaseDeDatos,
    onAcknowledge: () -> Unit,
    onResolve: () -> Unit,
    onNavigate: () -> Unit
) {
    val isResolved = alert.resolvedAt != null

    val (icon, borderClr, bgClr, textClr, label) = resolveAlertVisuals(alert, isResolved)
    val isCritical = alert.severity == AlertSeverity.CRITICAL && !alert.acknowledged && !isResolved

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .alpha(if (alert.acknowledged || isResolved) 0.65f else 1f)
            .border(
                width = if (isCritical) 1.5.dp else 1.dp,
                color = if (isCritical) AgrilionTokens.Critical else AgrilionTokens.BorderSubtle,
                shape = AgrilionTokens.RadiusCard
            ),
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(
            containerColor = if (isCritical) AgrilionTokens.CriticalBg else AgrilionTokens.SurfaceDark1
        )
    ) {
        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
            // BARRA LATERAL DE SEVERIDAD A LA IZQUIERDA (6.dp)
            Box(
                modifier = Modifier
                    .width(6.dp)
                    .fillMaxHeight()
                    .background(borderClr)
            )

            // COLUMNA PRINCIPAL DE CONTENIDO
            Column(
                modifier = Modifier
                    .weight(1f)
                    .padding(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Row(
                        modifier = Modifier.weight(1f),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(36.dp)
                                .background(bgClr, RoundedCornerShape(10.dp)),
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(icon, contentDescription = null, tint = textClr, modifier = Modifier.size(20.dp))
                        }

                        Spacer(modifier = Modifier.width(12.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = label,
                                    fontSize = 10.sp,
                                    fontWeight = FontWeight.Black,
                                    color = textClr,
                                    letterSpacing = 1.2.sp
                                )
                                if (alert.siloName.isNotBlank()) {
                                    Text(" · ", color = AgrilionTokens.Zinc500, fontSize = 10.sp)
                                    Text(
                                        text = alert.siloName,
                                        fontSize = 11.sp,
                                        fontFamily = FontFamily.Monospace,
                                        color = AgrilionTokens.Zinc400
                                    )
                                }
                            }
                            Text(
                                text = alert.title,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }

                    if (alert.timestamp.isNotBlank()) {
                        Surface(
                            color = AgrilionTokens.SurfaceDark2,
                            shape = RoundedCornerShape(50)
                        ) {
                            Text(
                                text = alert.timestamp,
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                color = AgrilionTokens.Zinc500,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }

                if (alert.description.isNotBlank()) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = alert.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = AgrilionTokens.Zinc400,
                        lineHeight = 18.sp
                    )
                }

                if (alert.recommendation.isNotBlank()) {
                    Surface(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 12.dp)
                            .border(1.dp, AgrilionTokens.BorderFaint, RoundedCornerShape(10.dp)),
                        color = AgrilionTokens.SurfaceDark2,
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(
                                text = AppStateBaseDeDatos.t("ACCIÓN RECOMENDADA:"),
                                fontSize = 11.sp,
                                fontWeight = FontWeight.Black,
                                color = Color.White,
                                letterSpacing = 1.sp
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = alert.recommendation,
                                fontSize = 12.sp,
                                color = AgrilionTokens.Zinc400
                            )
                        }
                    }
                }

                // FILA ÚNICA DE BOTONES DE ACCIÓN (REGLA: MARCAR RESUELTA SOLO TRAS SER MARCADA COMO VISTA)
                val hasSiloLink = alert.siloId.isNotBlank()
                val canMarkViewed = !alert.acknowledged && !isResolved
                val canMarkResolved = alert.acknowledged && !isResolved

                if (hasSiloLink || canMarkViewed || canMarkResolved) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(top = 14.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        if (hasSiloLink) {
                            Button(
                                onClick = onNavigate,
                                shape = RoundedCornerShape(10.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600)
                            ) {
                                Text(AppStateBaseDeDatos.t("VER DETALLE"), fontWeight = FontWeight.Bold, fontSize = 11.sp)
                                Spacer(modifier = Modifier.width(4.dp))
                                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, modifier = Modifier.size(14.dp))
                            }
                        }

                        if (canMarkViewed) {
                            OutlinedButton(
                                onClick = onAcknowledge,
                                shape = RoundedCornerShape(10.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
                            ) {
                                Icon(Icons.Default.RemoveRedEye, contentDescription = null, tint = AgrilionTokens.Zinc400, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(AppStateBaseDeDatos.t("MARCAR VISTA"), color = AgrilionTokens.Zinc400, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }

                        if (canMarkResolved) {
                            OutlinedButton(
                                onClick = onResolve,
                                shape = RoundedCornerShape(10.dp),
                                border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.Ok)
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, tint = AgrilionTokens.Ok, modifier = Modifier.size(14.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(AppStateBaseDeDatos.t("MARCAR RESUELTA"), color = AgrilionTokens.Ok, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

/**
 * Resuelve el conjunto visual del card (icono, borde, fondo, texto y etiqueta)
 * sin Tuple5: variables individuales en un data class local.
 */
private data class AlertVisuals(
    val icon: ImageVector,
    val borderClr: Color,
    val bgClr: Color,
    val textClr: Color,
    val label: String
)

@Composable
private fun resolveAlertVisuals(alert: AlertBaseDeDatos, isResolved: Boolean): AlertVisuals {
    return when {
        isResolved -> AlertVisuals(
            Icons.Default.CheckCircle, AgrilionTokens.Ok, Color(0x3316A34A), AgrilionTokens.Ok,
            AppStateBaseDeDatos.t("RESUELTA")
        )
        alert.severity == AlertSeverity.CRITICAL || alert.severity == AlertSeverity.HIGH -> AlertVisuals(
            Icons.Default.Cancel, AgrilionTokens.Critical, Color(0x33DC2626), AgrilionTokens.Critical,
            AppStateBaseDeDatos.t("CRÍTICA")
        )
        alert.severity == AlertSeverity.MEDIUM -> AlertVisuals(
            Icons.Default.Warning, AgrilionTokens.Warn, Color(0x33F59E0B), AgrilionTokens.Warn,
            AppStateBaseDeDatos.t("MEDIA")
        )
        alert.severity == AlertSeverity.LOW -> AlertVisuals(
            Icons.Default.Info, Color(0xFF60A5FA), Color(0x3360A5FA), Color(0xFF60A5FA),
            AppStateBaseDeDatos.t("BAJA")
        )
        else -> AlertVisuals(
            Icons.Default.CheckCircle, AgrilionTokens.Ok, Color(0x3316A34A), AgrilionTokens.Ok,
            AppStateBaseDeDatos.t("INFO")
        )
    }
}
