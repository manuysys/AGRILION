package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.ApiConfig
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.ChatApiServiceBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.data.UserPreferences
import com.example.app1.ui.theme.AgrilionTokens
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen() {
    val scrollState = rememberScrollState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var apiUrl by remember { mutableStateOf(ApiConfig.baseUrl) }
    var apiMessage by remember { mutableStateOf<String?>(null) }
    var apiTesting by remember { mutableStateOf(false) }
    
    val languages = listOf("Español", "English", "Português")
    var showLanguageMenu by remember { mutableStateOf(false) }

    var tempUnit by remember { mutableStateOf("Celsius (°C)") }
    var co2Unit by remember { mutableStateOf("PPM") }
    var pressUnit by remember { mutableStateOf("Hectopascales (hPa)") }
    var humUnit by remember { mutableStateOf("Porcentaje (%)") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // CONEXIÓN API
        Text(
            text = "CONEXIÓN API",
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = apiUrl,
            onValueChange = { apiUrl = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("URL de la API", color = AgrilionTokens.Zinc400) },
            singleLine = true,
            shape = RoundedCornerShape(12.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = AgrilionTokens.Emerald500,
                unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                focusedContainerColor = AgrilionTokens.SurfaceDark1,
                unfocusedContainerColor = AgrilionTokens.SurfaceDark1
            )
        )
        Spacer(modifier = Modifier.height(8.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    val error = ApiConfig.save(context, apiUrl)
                    if (error == null) {
                        apiUrl = ApiConfig.baseUrl
                        apiMessage = "URL guardada. Probá la conexión."
                    } else {
                        apiMessage = error
                    }
                },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600)
            ) {
                Text("Guardar")
            }
            OutlinedButton(
                onClick = {
                    ApiConfig.reset(context)
                    apiUrl = ApiConfig.baseUrl
                    apiMessage = "URL restablecida al valor por defecto."
                },
                modifier = Modifier.weight(1f),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
            ) {
                Text("Restablecer", color = Color.White)
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(
            onClick = {
                scope.launch {
                    apiTesting = true
                    apiMessage = "Probando conexión..."
                    try {
                        val health = ChatApiServiceBaseDeDatos.create().checkHealth()
                        apiMessage = "Conexión OK (${health.status})"
                        SilosDataManagerBaseDeDatos.refresh()
                    } catch (e: Exception) {
                        apiMessage = "Sin conexión: ${e.message ?: e.javaClass.simpleName}"
                    } finally {
                        apiTesting = false
                    }
                }
            },
            enabled = !apiTesting,
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.SurfaceDark2)
        ) {
            Text(if (apiTesting) "Probando..." else "Probar conexión", color = Color.White)
        }
        if (apiMessage != null) {
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = apiMessage!!,
                color = when {
                    apiMessage!!.startsWith("Conexión OK") -> AgrilionTokens.Emerald500
                    apiMessage!!.startsWith("Sin conexión") || apiMessage!!.contains("inválida") -> AgrilionTokens.Critical
                    else -> AgrilionTokens.Zinc400
                },
                fontSize = 12.sp
            )
        }
        Text(
            text = "Emulador: http://10.0.2.2:8000/ · Celular: IP de la PC",
            color = AgrilionTokens.Zinc500,
            fontSize = 11.sp,
            modifier = Modifier.padding(top = 4.dp)
        )

        Spacer(modifier = Modifier.height(24.dp))

        // IDIOMA
        Text(
            text = AppStateBaseDeDatos.t("IDIOMA"), 
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
        )
        Box(modifier = Modifier.padding(vertical = 8.dp)) {
            OutlinedButton(
                onClick = { showLanguageMenu = true },
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
                border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = AppStateBaseDeDatos.currentLanguage,
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.White
                    )
                }
            }
            DropdownMenu(
                expanded = showLanguageMenu,
                onDismissRequest = { showLanguageMenu = false }
            ) {
                languages.forEach { lang ->
                    DropdownMenuItem(
                        text = { Text(lang) },
                        onClick = {
                            AppStateBaseDeDatos.currentLanguage = lang
                            UserPreferences.saveLanguage(context, lang)
                            showLanguageMenu = false
                        }
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))

        // UNIDADES DE MEDIDA
        Text(
            text = AppStateBaseDeDatos.t("UNIDADES DE MEDIDA"), 
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
        )
        Spacer(modifier = Modifier.height(12.dp))

        UnitSelectorRow(AppStateBaseDeDatos.t("Temperatura"), tempUnit, listOf("Celsius (°C)", "Fahrenheit (°F)")) { tempUnit = it }
        UnitSelectorRow("CO2", co2Unit, listOf("PPM", "Porcentaje (%)")) { co2Unit = it }
        UnitSelectorRow(AppStateBaseDeDatos.t("Peso"), AppStateBaseDeDatos.unidadPesoSeleccionada, listOf("Toneladas (TN)", "Kilogramos (Kg)")) { 
            AppStateBaseDeDatos.unidadPesoSeleccionada = it
            UserPreferences.saveWeightUnit(context, it)
        }
        UnitSelectorRow(AppStateBaseDeDatos.t("Presión"), pressUnit, listOf("Hectopascales (hPa)", "Bar")) { pressUnit = it }
        UnitSelectorRow(AppStateBaseDeDatos.t("Humedad"), humUnit, listOf("Porcentaje (%)", "Gramos/m3")) { humUnit = it }

        Spacer(modifier = Modifier.height(24.dp))

        // NOTIFICACIONES
        Text(
            text = AppStateBaseDeDatos.t("NOTIFICACIONES"), 
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
        )
        Spacer(modifier = Modifier.height(12.dp))
        
        NotificationBox(
            title = "Email",
            opt1 = AppStateBaseDeDatos.t("Alertas"),
            opt2 = AppStateBaseDeDatos.t("Recordatorios"),
            opt3 = AppStateBaseDeDatos.t("Informativos")
        )
        
        Spacer(modifier = Modifier.height(12.dp))
        
        NotificationBox(
            title = "Banners",
            opt1 = AppStateBaseDeDatos.t("Alertas"),
            opt2 = AppStateBaseDeDatos.t("Recordatorios"),
            opt3 = AppStateBaseDeDatos.t("Informativos")
        )

        Spacer(modifier = Modifier.height(28.dp))

        // INFORMACIÓN DEL SISTEMA (Regla D2: Franja de Créditos del Autor al pie del Card)
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard),
            shape = AgrilionTokens.RadiusCard,
            colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
        ) {
            Column {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text(
                        text = AppStateBaseDeDatos.t("INFORMACIÓN DEL SISTEMA"),
                        style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    SystemInfoRow("Plataforma", "Agrilion+ Operational Native")
                    SystemInfoRow("Versión App", "1.0.0 (Production)")
                    SystemInfoRow("Estado Módulo", "Conectado LoRaWAN / InfluxDB")
                }

                // FRANJA DISCRETA AL PIE DEL CARD (Regla del AUTOR D2)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(bottomStart = 20.dp, bottomEnd = 20.dp)),
                    color = AgrilionTokens.Zinc800Translucent
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 20.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = AppStateBaseDeDatos.t("AUTOR"),
                            style = AgrilionTokens.LabelSmallMuted
                        )
                        Text(
                            text = "Juan Manuel Iglesias",
                            style = TextStyle(
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = AgrilionTokens.Zinc400
                            )
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun SystemInfoRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(label, style = MaterialTheme.typography.bodyMedium, color = AgrilionTokens.Zinc400)
        Text(value, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.Bold, color = Color.White)
    }
}

@Composable
fun NotificationBox(title: String, opt1: String, opt2: String, opt3: String) {
    var check1 by remember { mutableStateOf(true) }
    var check2 by remember { mutableStateOf(true) }
    var check3 by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard),
        color = AgrilionTokens.SurfaceDark1,
        shape = AgrilionTokens.RadiusCard
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge, color = Color.White)
            HorizontalDivider(color = AgrilionTokens.BorderSubtle, thickness = 1.dp, modifier = Modifier.padding(vertical = 12.dp))
            NotificationOptionRowSimplificada(opt1, check1) { check1 = it }
            NotificationOptionRowSimplificada(opt2, check2) { check2 = it }
            NotificationOptionRowSimplificada(opt3, check3) { check3 = it }
        }
    }
}

@Composable
fun NotificationOptionRowSimplificada(text: String, isChecked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold, color = AgrilionTokens.Zinc400)
        Checkbox(
            checked = isChecked,
            onCheckedChange = onCheckedChange,
            colors = CheckboxDefaults.colors(
                checkedColor = AgrilionTokens.Emerald600,
                uncheckedColor = AgrilionTokens.Zinc500
            )
        )
    }
}

@Composable
fun UnitSelectorRow(label: String, selected: String, options: List<String>, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium, color = AgrilionTokens.Zinc400)
        Spacer(modifier = Modifier.height(4.dp))
        Box {
            OutlinedButton(
                onClick = { expanded = true },
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(),
                border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 10.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Start) {
                    Text(selected, style = MaterialTheme.typography.bodyMedium, color = Color.White)
                }
            }
            DropdownMenu(
                expanded = expanded, 
                onDismissRequest = { expanded = false }
            ) {
                options.forEach { opt ->
                    DropdownMenuItem(text = { Text(opt) }, onClick = { onSelect(opt); expanded = false })
                }
            }
        }
    }
}
