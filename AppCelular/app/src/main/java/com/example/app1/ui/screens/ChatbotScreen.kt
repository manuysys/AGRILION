package com.example.app1.ui.screens

import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.automirrored.filled.TrendingUp
import androidx.compose.material.icons.filled.Psychology
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Wifi
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.ChatManagerBaseDeDatos
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens
import kotlin.math.roundToInt

@Composable
fun ChatbotScreen(chatViewModel: ChatViewModelBaseDeDatos = viewModel()) {
    val scrollState = rememberScrollState()
    val silos = SilosDataManagerBaseDeDatos.silosList
    val activeSilos = silos.filter { it.estado != EstadoSilo.SIN_DATOS }
    val warningOrCriticalSilos = silos.filter { it.estado == EstadoSilo.ALERTA || it.estado == EstadoSilo.CRITICO }
    
    val apiConnected = chatViewModel.apiConnected

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // 1. CABECERA DE LA PÁGINA "CENTRO DE INTELIGENCIA ARTIFICIAL"
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = AppStateBaseDeDatos.t("Centro de Inteligencia Artificial"),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    letterSpacing = (-0.5).sp
                )
                Text(
                    text = AppStateBaseDeDatos.t("Análisis predictivo, interpretación automática y asistente de consultas"),
                    style = MaterialTheme.typography.bodySmall,
                    color = AgrilionTokens.Zinc500,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }

            Spacer(modifier = Modifier.width(8.dp))

            // Indicador de Estado de la API
            ApiStatusPill(apiConnected = apiConnected)
        }

        Spacer(modifier = Modifier.height(20.dp))

        // 2. SECCIÓN DE ANÁLISIS GLOBAL E INTERPRETACIONES ACTIVAS
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
            shape = AgrilionTokens.RadiusCard,
            colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.AutoMirrored.Filled.TrendingUp,
                        contentDescription = null,
                        tint = Color(0xFFA855F7), // Púrpura IA
                        modifier = Modifier.size(20.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = AppStateBaseDeDatos.t("Análisis Global de Riesgo"),
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }

                Spacer(modifier = Modifier.height(12.dp))

                // Grid/Row de Silos
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    if (silos.isEmpty()) {
                        Text(
                            AppStateBaseDeDatos.t("Sin silobolsas registradas"),
                            color = AgrilionTokens.Zinc500,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(vertical = 12.dp)
                        )
                    } else {
                        silos.take(4).forEach { silo ->
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .background(silo.estado.color.copy(alpha = 0.15f), CircleShape)
                                        .border(1.5.dp, silo.estado.color, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = silo.id,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(silo.nombre, fontSize = 10.sp, color = AgrilionTokens.Zinc400)
                            }
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(top = 16.dp, bottom = 8.dp), color = AgrilionTokens.BorderFaint)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = "Riesgo promedio: ${if (activeSilos.isEmpty()) 0 else activeSilos.map { it.riskScore }.average().roundToInt()}/100",
                        fontSize = 12.sp,
                        color = AgrilionTokens.Zinc400
                    )
                    Text(
                        text = "Alertas activas: ${warningOrCriticalSilos.size}",
                        fontSize = 12.sp,
                        color = if (warningOrCriticalSilos.isNotEmpty()) AgrilionTokens.Warn else AgrilionTokens.Zinc400,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // INTERPRETACIONES ACTIVAS CARD
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
            shape = AgrilionTokens.RadiusCard,
            colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = AppStateBaseDeDatos.t("Interpretaciones Activas"),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(8.dp))

                if (warningOrCriticalSilos.isEmpty()) {
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        Icon(Icons.Default.Shield, contentDescription = null, tint = AgrilionTokens.Emerald500, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = AppStateBaseDeDatos.t("Todos los silos operan normalmente"),
                            fontSize = 13.sp,
                            color = AgrilionTokens.Zinc400
                        )
                    }
                } else {
                    warningOrCriticalSilos.forEach { silo ->
                        Surface(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            color = AgrilionTokens.SurfaceDark2,
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Column(modifier = Modifier.padding(12.dp)) {
                                Text(
                                    text = "${silo.nombre} — ${silo.estado.texto.uppercase()}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = silo.estado.color
                                )
                                Text(
                                    text = silo.diagnosticoSemanal,
                                    fontSize = 12.sp,
                                    color = AgrilionTokens.Zinc400,
                                    modifier = Modifier.padding(top = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(20.dp))

        // 3. CARD DEL CHAT ASISTENTE IA (Contenedor Estilo Next.js)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .height(520.dp)
                .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
            shape = AgrilionTokens.RadiusCard,
            colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
        ) {
            Column(modifier = Modifier.fillMaxSize()) {
                
                // HEADER DEL CHAT (Púrpura)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(AgrilionTokens.GlassHeader)
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Box(
                        modifier = Modifier
                            .size(32.dp)
                            .background(Color(0x33A855F7), RoundedCornerShape(8.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.Psychology,
                            contentDescription = null,
                            tint = Color(0xFFA855F7),
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = AppStateBaseDeDatos.t("Asistente IA"),
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = Color.White
                        )
                        Text(
                            text = when (apiConnected) {
                                true -> AppStateBaseDeDatos.t("Conectado al modelo de IA")
                                false -> AppStateBaseDeDatos.t("Modo local (API no disponible)")
                                null -> AppStateBaseDeDatos.t("Conectando...")
                            },
                            fontSize = 10.sp,
                            color = AgrilionTokens.Zinc500
                        )
                    }
                }

                HorizontalDivider(color = AgrilionTokens.BorderSubtle)

                // ÁREA DE MENSAJES CON AUTO-SCROLL
                val listState = rememberLazyListState()
                
                LaunchedEffect(chatViewModel.messages.size, chatViewModel.isSending) {
                    if (chatViewModel.messages.isNotEmpty()) {
                        listState.animateScrollToItem(chatViewModel.messages.size - 1)
                    }
                }

                Box(modifier = Modifier.weight(1f).padding(horizontal = 12.dp)) {
                    if (chatViewModel.messages.isEmpty() && !chatViewModel.isSending) {
                        // ESTADO VACÍO CON COMANDOS SUGERIDOS
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .padding(16.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                Icons.Default.Psychology,
                                contentDescription = null,
                                tint = AgrilionTokens.Zinc500,
                                modifier = Modifier.size(40.dp)
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = AppStateBaseDeDatos.t("Hacé una pregunta sobre tus silobolsas"),
                                fontSize = 13.sp,
                                color = AgrilionTokens.Zinc400
                            )
                            Spacer(modifier = Modifier.height(16.dp))

                            val firstSiloId = silos.firstOrNull()?.id ?: "01"
                            val suggestedCommands = listOf(
                                "¿Qué silos están en riesgo?",
                                "Resumen de la última semana",
                                "¿Cómo está el silo $firstSiloId?",
                                "Explicá las alertas activas"
                            )

                            suggestedCommands.forEach { cmd ->
                                Surface(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(vertical = 4.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                        .border(1.dp, AgrilionTokens.BorderSubtle, RoundedCornerShape(8.dp))
                                        .clickable { chatViewModel.sendUserMessage(cmd) },
                                    color = AgrilionTokens.SurfaceDark2
                                ) {
                                    Text(
                                        text = cmd,
                                        color = AgrilionTokens.Emerald500,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                                    )
                                }
                            }
                        }
                    } else {
                        LazyColumn(
                            state = listState,
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            contentPadding = PaddingValues(vertical = 12.dp)
                        ) {
                            items(chatViewModel.messages) { msg ->
                                ChatBubbleReplica(msg)
                            }

                            if (chatViewModel.isSending) {
                                item {
                                    TypingDotsReplica()
                                }
                            }
                        }
                    }
                }

                HorizontalDivider(color = AgrilionTokens.BorderSubtle)

                // INPUT ÁREA DE TEXTO CON ENTER / SEND
                var messageText by remember { mutableStateOf("") }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = messageText,
                        onValueChange = { messageText = it },
                        modifier = Modifier.weight(1f),
                        placeholder = { Text(AppStateBaseDeDatos.t("Preguntá algo..."), color = AgrilionTokens.Zinc500, fontSize = 13.sp) },
                        shape = RoundedCornerShape(12.dp),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = AgrilionTokens.Emerald500,
                            unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                            focusedContainerColor = AgrilionTokens.SurfaceDark2,
                            unfocusedContainerColor = AgrilionTokens.SurfaceDark2
                        ),
                        enabled = !chatViewModel.isSending
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    IconButton(
                        onClick = {
                            if (messageText.isNotBlank()) {
                                chatViewModel.sendUserMessage(messageText)
                                messageText = ""
                            }
                        },
                        enabled = messageText.isNotBlank() && !chatViewModel.isSending,
                        modifier = Modifier
                            .size(48.dp)
                            .background(
                                if (messageText.isNotBlank() && !chatViewModel.isSending) AgrilionTokens.Emerald600 else AgrilionTokens.SurfaceDark2,
                                RoundedCornerShape(12.dp)
                            )
                    ) {
                        Icon(
                            Icons.AutoMirrored.Filled.Send,
                            contentDescription = "Enviar",
                            tint = if (messageText.isNotBlank() && !chatViewModel.isSending) Color.White else AgrilionTokens.Zinc500,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun ApiStatusPill(apiConnected: Boolean?) {
    val bgColor = when (apiConnected) {
        true -> Color(0x1A10B981)
        false -> Color(0x1AF59E0B)
        null -> AgrilionTokens.SurfaceDark2
    }
    val textColor = when (apiConnected) {
        true -> AgrilionTokens.Emerald500
        false -> AgrilionTokens.Warn
        null -> AgrilionTokens.Zinc400
    }
    val icon = when (apiConnected) {
        true -> Icons.Default.Wifi
        false -> Icons.Default.WifiOff
        null -> Icons.Default.Wifi
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(50),
        border = androidx.compose.foundation.BorderStroke(1.dp, textColor.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null, tint = textColor, modifier = Modifier.size(12.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = when (apiConnected) {
                    true -> "AI API conectada"
                    false -> "Modo local"
                    null -> "Verificando API..."
                },
                fontSize = 10.sp,
                fontWeight = FontWeight.Bold,
                color = textColor
            )
        }
    }
}

@Composable
fun ChatBubbleReplica(message: ChatManagerBaseDeDatos.ChatMessageBaseDeDatos) {
    val alignment = if (message.isUser) Alignment.CenterEnd else Alignment.CenterStart
    val bgColor = if (message.isUser) AgrilionTokens.Emerald700 else AgrilionTokens.SurfaceDark2
    val shape = if (message.isUser)
        RoundedCornerShape(14.dp, 14.dp, 2.dp, 14.dp) else
        RoundedCornerShape(14.dp, 14.dp, 14.dp, 2.dp)

    Box(
        modifier = Modifier.fillMaxWidth(),
        contentAlignment = alignment
    ) {
        Surface(
            color = bgColor,
            shape = shape,
            border = if (!message.isUser) androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle) else null,
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Text(
                text = message.text,
                modifier = Modifier.padding(12.dp),
                color = Color.White,
                fontSize = 13.sp,
                lineHeight = 18.sp
            )
        }
    }
}

@Composable
fun TypingDotsReplica() {
    val transition = rememberInfiniteTransition(label = "dots")
    val dot1Offset by transition.animateFloat(
        initialValue = 0f, targetValue = -6f,
        animationSpec = infiniteRepeatable(animation = tween(600, easing = LinearOutSlowInEasing), repeatMode = RepeatMode.Reverse),
        label = "d1"
    )

    Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.CenterStart) {
        Surface(
            color = AgrilionTokens.SurfaceDark2,
            shape = RoundedCornerShape(14.dp, 14.dp, 14.dp, 2.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp)
            ) {
                Box(modifier = Modifier.offset(y = dot1Offset.dp).size(6.dp).background(AgrilionTokens.Zinc400, CircleShape))
                Box(modifier = Modifier.offset(y = (-dot1Offset).dp).size(6.dp).background(AgrilionTokens.Zinc400, CircleShape))
                Box(modifier = Modifier.offset(y = dot1Offset.dp).size(6.dp).background(AgrilionTokens.Zinc400, CircleShape))
            }
        }
    }
}
