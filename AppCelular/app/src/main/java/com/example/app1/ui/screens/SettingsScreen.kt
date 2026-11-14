package com.example.app1.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.ExpandMore
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.app1.data.ApiConfig
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.ChatApiServiceBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.data.SettingsManager
import com.example.app1.data.UserPreferences
import com.example.app1.ui.theme.AgrilionTokens
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen() {
    val scrollState = rememberScrollState()
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    val languages = listOf("Español", "English", "Português")
    var showLanguageMenu by remember { mutableStateOf(false) }

    var tempUnit by remember { mutableStateOf("Celsius (°C)") }
    var co2Unit by remember { mutableStateOf("PPM") }
    var pressUnit by remember { mutableStateOf("Hectopascales (hPa)") }
    var humUnit by remember { mutableStateOf("Porcentaje (%)") }

    // Estado URL API Backend
    var apiUrlText by remember { mutableStateOf(ApiConfig.baseUrl) }
    var apiSaveResult by remember { mutableStateOf<String?>(null) }
    var apiOk by remember { mutableStateOf<Boolean?>(null) }
    var apiTesting by remember { mutableStateOf(false) }

    // Estados Diálogos Numéricos
    var showSensorOfflineDialog by remember { mutableStateOf(false) }
    var showBateriaBajaDialog by remember { mutableStateOf(false) }

    // Estado local para edición de umbrales
    var tempWarnText by remember { mutableStateOf(SettingsManager.tempWarn.toInt().toString()) }
    var tempCritText by remember { mutableStateOf(SettingsManager.tempCrit.toInt().toString()) }
    var humWarnText by remember { mutableStateOf(SettingsManager.humWarn.toInt().toString()) }
    var humCritText by remember { mutableStateOf(SettingsManager.humCrit.toInt().toString()) }
    var co2WarnText by remember { mutableStateOf(SettingsManager.co2Warn.toInt().toString()) }
    var co2CritText by remember { mutableStateOf(SettingsManager.co2Crit.toInt().toString()) }
    var presWarnText by remember { mutableStateOf(SettingsManager.presWarn.toInt().toString()) }
    var presCritText by remember { mutableStateOf(SettingsManager.presCrit.toInt().toString()) }
    var thresholdErrorMsg by remember { mutableStateOf<String?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    )

    {

        // 1. IDIOMA (PRIMER LUGAR)
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

        // 2. UNIDADES DE MEDIDA
        Text(
            text = AppStateBaseDeDatos.t("UNIDADES DE MEDIDA"),
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
        )
        Spacer(modifier = Modifier.height(12.dp))

        UnitSelectorRow(AppStateBaseDeDatos.t("Temperatura"), tempUnit, listOf("Celsius (°C)", "Fahrenheit (°F)")) { tempUnit = it }
        UnitSelectorRow(AppStateBaseDeDatos.t("CO2"), co2Unit, listOf("PPM", "Porcentaje (%)")) { co2Unit = it }
        UnitSelectorRow(AppStateBaseDeDatos.t("Peso"), AppStateBaseDeDatos.unidadPesoSeleccionada, listOf("Toneladas (TN)", "Kilogramos (Kg)")) {
            AppStateBaseDeDatos.unidadPesoSeleccionada = it
            UserPreferences.saveWeightUnit(context, it)
        }
        UnitSelectorRow(AppStateBaseDeDatos.t("Presión"), pressUnit, listOf("Hectopascales (hPa)", "Bar")) { pressUnit = it }
        UnitSelectorRow(AppStateBaseDeDatos.t("Humedad"), humUnit, listOf("Porcentaje (%)", "Gramos/m3")) { humUnit = it }

        Spacer(modifier = Modifier.height(24.dp))

        // 3. NOTIFICACIONES (BOXES EMAIL Y BANNERS CON FILAS E INTERRUPTORES)
        Text(
            text = AppStateBaseDeDatos.t("NOTIFICACIONES"),
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
        )
        Spacer(modifier = Modifier.height(12.dp))

        // BOX EMAIL
        NotificationBoxWithAccordion(
            title = AppStateBaseDeDatos.t("Email"),
            channelType = "email",
            context = context,
            onOpenSensorOfflineDialog = { showSensorOfflineDialog = true },
            onOpenBateriaBajaDialog = { showBateriaBajaDialog = true }
        )

        Spacer(modifier = Modifier.height(12.dp))

        // BOX BANNERS
        NotificationBoxWithAccordion(
            title = AppStateBaseDeDatos.t("Banners"),
            channelType = "banner",
            context = context,
            onOpenSensorOfflineDialog = { showSensorOfflineDialog = true },
            onOpenBateriaBajaDialog = { showBateriaBajaDialog = true }
        )

        Spacer(modifier = Modifier.height(24.dp))

        // 4. UMBRALES DE ALERTA (COMPACTO DOS COLUMNAS POR FILA CON ALINEACIÓN RECTA)
        Text(
            text = AppStateBaseDeDatos.t("UMBRALES DE ALERTA"),
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
        )
        Spacer(modifier = Modifier.height(8.dp))

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard),
            color = AgrilionTokens.SurfaceDark1,
            shape = AgrilionTokens.RadiusCard
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                if (thresholdErrorMsg != null) {
                    Text(
                        text = thresholdErrorMsg ?: "",
                        fontSize = 11.sp,
                        color = AgrilionTokens.Critical,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                }

                ThresholdInputRow(AppStateBaseDeDatos.t("Temperatura — advertencia"), tempWarnText, "°C") { tempWarnText = it }
                ThresholdInputRow(AppStateBaseDeDatos.t("Temperatura — crítica"), tempCritText, "°C") { tempCritText = it }
                HorizontalDivider(color = AgrilionTokens.BorderSubtle, modifier = Modifier.padding(vertical = 6.dp))

                ThresholdInputRow(AppStateBaseDeDatos.t("Humedad — advertencia"), humWarnText, "%") { humWarnText = it }
                ThresholdInputRow(AppStateBaseDeDatos.t("Humedad — crítica"), humCritText, "%") { humCritText = it }
                HorizontalDivider(color = AgrilionTokens.BorderSubtle, modifier = Modifier.padding(vertical = 6.dp))

                ThresholdInputRow(AppStateBaseDeDatos.t("CO2 — advertencia"), co2WarnText, "ppm") { co2WarnText = it }
                ThresholdInputRow(AppStateBaseDeDatos.t("CO2 — crítica"), co2CritText, "ppm") { co2CritText = it }
                HorizontalDivider(color = AgrilionTokens.BorderSubtle, modifier = Modifier.padding(vertical = 6.dp))

                ThresholdInputRow(AppStateBaseDeDatos.t("Presión — advertencia"), presWarnText, "hPa") { presWarnText = it }
                ThresholdInputRow(AppStateBaseDeDatos.t("Presión — crítica"), presCritText, "hPa") { presCritText = it }

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val tw = tempWarnText.toDoubleOrNull()
                            val tc = tempCritText.toDoubleOrNull()
                            val hw = humWarnText.toDoubleOrNull()
                            val hc = humCritText.toDoubleOrNull()
                            val cw = co2WarnText.toDoubleOrNull()
                            val cc = co2CritText.toDoubleOrNull()
                            val pw = presWarnText.toDoubleOrNull()
                            val pc = presCritText.toDoubleOrNull()

                            if (tw == null || tc == null || hw == null || hc == null || cw == null || cc == null || pw == null || pc == null) {
                                thresholdErrorMsg = AppStateBaseDeDatos.t("Ingresá números válidos")
                                return@Button
                            }
                            if (tc <= tw || hc <= hw || cc <= cw || pc <= pw) {
                                thresholdErrorMsg = AppStateBaseDeDatos.t("Los valores críticos deben ser mayores que los de advertencia")
                                return@Button
                            }
                            if (pw !in 300.0..1500.0 || pc !in 300.0..1500.0) {
                                thresholdErrorMsg = AppStateBaseDeDatos.t("Ingresá números válidos")
                                return@Button
                            }

                            thresholdErrorMsg = null
                            SettingsManager.tempWarn = tw
                            SettingsManager.tempCrit = tc
                            SettingsManager.humWarn = hw
                            SettingsManager.humCrit = hc
                            SettingsManager.co2Warn = cw
                            SettingsManager.co2Crit = cc
                            SettingsManager.presWarn = pw
                            SettingsManager.presCrit = pc
                            SettingsManager.save(context)
                        },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(AppStateBaseDeDatos.t("GUARDAR UMBRALES"), fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            SettingsManager.resetThresholds(context)
                            tempWarnText = SettingsManager.tempWarn.toInt().toString()
                            tempCritText = SettingsManager.tempCrit.toInt().toString()
                            humWarnText = SettingsManager.humWarn.toInt().toString()
                            humCritText = SettingsManager.humCrit.toInt().toString()
                            co2WarnText = SettingsManager.co2Warn.toInt().toString()
                            co2CritText = SettingsManager.co2Crit.toInt().toString()
                            presWarnText = SettingsManager.presWarn.toInt().toString()
                            presCritText = SettingsManager.presCrit.toInt().toString()
                        },
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(AppStateBaseDeDatos.t("RESTABLECER"), color = AgrilionTokens.Zinc400, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 5. CONEXIÓN API BACKEND (SIN BLOQUEO EN MODO DEMO)
        Text(
            text = AppStateBaseDeDatos.t("CONEXIÓN API BACKEND"),
            style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
        )
        Spacer(modifier = Modifier.height(8.dp))

        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard),
            color = AgrilionTokens.SurfaceDark1,
            shape = AgrilionTokens.RadiusCard
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(
                    text = AppStateBaseDeDatos.t("URL Base del Servidor"),
                    fontWeight = FontWeight.Bold,
                    fontSize = 13.sp,
                    color = Color.White
                )
                Text(
                    text = "http://10.0.2.2:8000/ para emulador · IP local para celular físico",
                    fontSize = 11.sp,
                    color = AgrilionTokens.Zinc400,
                    modifier = Modifier.padding(top = 2.dp, bottom = 12.dp)
                )

                OutlinedTextField(
                    value = apiUrlText,
                    onValueChange = { apiUrlText = it },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AgrilionTokens.Emerald500,
                        unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                        focusedContainerColor = AgrilionTokens.SurfaceDark2,
                        unfocusedContainerColor = AgrilionTokens.SurfaceDark2
                    )
                )

                if (apiSaveResult != null) {
                    Text(
                        text = apiSaveResult ?: "",
                        fontSize = 11.sp,
                        color = when (apiOk) {
                            true -> AgrilionTokens.Emerald500
                            false -> AgrilionTokens.Critical
                            else -> AgrilionTokens.Zinc400
                        },
                        modifier = Modifier.padding(top = 6.dp)
                    )
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Button(
                        onClick = {
                            val err = ApiConfig.save(context, apiUrlText)
                            apiOk = err == null
                            apiSaveResult = err ?: AppStateBaseDeDatos.t("URL guardada correctamente")
                            if (err == null) apiUrlText = ApiConfig.baseUrl
                        },
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(AppStateBaseDeDatos.t("GUARDAR URL"), fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }

                    OutlinedButton(
                        onClick = {
                            ApiConfig.reset(context)
                            apiUrlText = ApiConfig.baseUrl
                            apiOk = true
                            apiSaveResult = AppStateBaseDeDatos.t("Restablecido a URL por defecto")
                        },
                        shape = RoundedCornerShape(10.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(AppStateBaseDeDatos.t("RESTABLECER"), color = AgrilionTokens.Zinc400, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                    }
                }

                Spacer(modifier = Modifier.height(8.dp))

                // PROBAR CONEXIÓN (de AppCelular): health check del backend de chat + refresh de silos
                Button(
                    onClick = {
                        scope.launch {
                            apiTesting = true
                            apiSaveResult = AppStateBaseDeDatos.t("Probando conexión...")
                            apiOk = null
                            try {
                                val health = ChatApiServiceBaseDeDatos.create().checkHealth()
                                apiOk = true
                                apiSaveResult = "Conexión OK (${health.status})"
                                SilosDataManagerBaseDeDatos.refresh()
                            } catch (e: Exception) {
                                apiOk = false
                                apiSaveResult = "Sin conexión: ${e.message ?: e.javaClass.simpleName}"
                            } finally {
                                apiTesting = false
                            }
                        }
                    },
                    enabled = !apiTesting,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.SurfaceDark2)
                ) {
                    Text(
                        if (apiTesting) AppStateBaseDeDatos.t("Probando...") else AppStateBaseDeDatos.t("Probar conexión"),
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // 6. INFORMACIÓN DEL SISTEMA (Regla D2: Franja de Créditos del Autor al pie del Card)
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
                    SystemInfoRow("Versión App", "1.5 (Production)")
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

        Spacer(modifier = Modifier.height(100.dp))
    }

    // DIÁLOGOS EDICIÓN NUMÉRICA
    if (showSensorOfflineDialog) {
        NumericChooserDialog(
            title = AppStateBaseDeDatos.t("Horas sin datos (Sensor Offline)"),
            currentValue = SettingsManager.sensorOfflineHours,
            minValue = 1,
            maxValue = 72,
            unitSuffix = "horas",
            onDismiss = { showSensorOfflineDialog = false },
            onConfirm = { newVal ->
                SettingsManager.sensorOfflineHours = newVal
                SettingsManager.save(context)
                showSensorOfflineDialog = false
            }
        )
    }

    if (showBateriaBajaDialog) {
        NumericChooserDialog(
            title = AppStateBaseDeDatos.t("Porcentaje de Batería Baja"),
            currentValue = SettingsManager.bateriaBajaPercent,
            minValue = 5,
            maxValue = 95,
            unitSuffix = "%",
            onDismiss = { showBateriaBajaDialog = false },
            onConfirm = { newVal ->
                SettingsManager.bateriaBajaPercent = newVal
                SettingsManager.save(context)
                showBateriaBajaDialog = false
            }
        )
    }
}

@Composable
fun NotificationBoxWithAccordion(
    title: String,
    channelType: String,
    context: android.content.Context,
    onOpenSensorOfflineDialog: () -> Unit,
    onOpenBateriaBajaDialog: () -> Unit
) {
    var expandedAlerts by remember { mutableStateOf(false) }
    val rotationAngle by animateFloatAsState(targetValue = if (expandedAlerts) 180f else 0f, label = "chevron")

    val isEmail = channelType == "email"

    val parentChecked = if (isEmail)
        SettingsManager.emailCritical && SettingsManager.emailHigh && SettingsManager.emailMedium && SettingsManager.emailLow
    else
        SettingsManager.bannerCritical && SettingsManager.bannerHigh && SettingsManager.bannerMedium && SettingsManager.bannerLow

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

            // FILA ALERTAS CON ACORDEÓN: [TEXTO ALERTAS] [CHEVRON] [SWITCH ALINEADO DERECHA]
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { expandedAlerts = !expandedAlerts }
                    .padding(vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = AppStateBaseDeDatos.t("Alertas"),
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White,
                    modifier = Modifier.weight(1f)
                )

                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(
                        onClick = { expandedAlerts = !expandedAlerts },
                        modifier = Modifier.size(32.dp)
                    ) {
                        Icon(
                            Icons.Default.ExpandMore,
                            contentDescription = AppStateBaseDeDatos.t("Desplegar"),
                            tint = AgrilionTokens.Zinc400,
                            modifier = Modifier.rotate(rotationAngle)
                        )
                    }
                    Spacer(modifier = Modifier.width(6.dp))
                    Switch(
                        checked = parentChecked,
                        onCheckedChange = {
                            if (isEmail) {
                                SettingsManager.emailCritical = it
                                SettingsManager.emailHigh = it
                                SettingsManager.emailMedium = it
                                SettingsManager.emailLow = it
                            } else {
                                SettingsManager.bannerCritical = it
                                SettingsManager.bannerHigh = it
                                SettingsManager.bannerMedium = it
                                SettingsManager.bannerLow = it
                            }
                            SettingsManager.save(context)
                        },
                        colors = SwitchDefaults.colors(
                            checkedThumbColor = Color.White,
                            checkedTrackColor = AgrilionTokens.Emerald600,
                            uncheckedThumbColor = AgrilionTokens.Zinc400,
                            uncheckedTrackColor = AgrilionTokens.SurfaceDark2
                        )
                    )
                }
            }

            // SUBCATEGORÍAS INDENTADAS COMPACTAS CON SWITCHES
            AnimatedVisibility(visible = expandedAlerts) {
                Column(
                    modifier = Modifier.padding(start = 12.dp, top = 4.dp, bottom = 4.dp)
                ) {
                    SubCategoryRow(
                        label = AppStateBaseDeDatos.t("Alertas críticas"),
                        checked = if (isEmail) SettingsManager.emailCritical else SettingsManager.bannerCritical,
                        onCheckedChange = {
                            if (isEmail) SettingsManager.emailCritical = it else SettingsManager.bannerCritical = it
                            SettingsManager.save(context)
                        }
                    )

                    SubCategoryRow(
                        label = AppStateBaseDeDatos.t("Alertas altas"),
                        checked = if (isEmail) SettingsManager.emailHigh else SettingsManager.bannerHigh,
                        onCheckedChange = {
                            if (isEmail) SettingsManager.emailHigh = it else SettingsManager.bannerHigh = it
                            SettingsManager.save(context)
                        }
                    )

                    SubCategoryRow(
                        label = AppStateBaseDeDatos.t("Alertas de atención"),
                        checked = if (isEmail) SettingsManager.emailMedium else SettingsManager.bannerMedium,
                        onCheckedChange = {
                            if (isEmail) SettingsManager.emailMedium = it else SettingsManager.bannerMedium = it
                            SettingsManager.save(context)
                        }
                    )

                    SubCategoryRow(
                        label = AppStateBaseDeDatos.t("Alertas bajas"),
                        checked = if (isEmail) SettingsManager.emailLow else SettingsManager.bannerLow,
                        onCheckedChange = {
                            if (isEmail) SettingsManager.emailLow = it else SettingsManager.bannerLow = it
                            SettingsManager.save(context)
                        }
                    )
                }
            }

            HorizontalDivider(color = AgrilionTokens.BorderSubtle, thickness = 1.dp, modifier = Modifier.padding(vertical = 8.dp))

            // RESTO DE FILAS CON INTERRUPTORES (SWITCHES)
            Column {
                // 1. RECORDATORIOS
                NotificationRowWithSwitch(
                    title = AppStateBaseDeDatos.t("Recordatorios"),
                    checked = if (isEmail) SettingsManager.emailRecordatorios else SettingsManager.bannerRecordatorios,
                    onCheckedChange = {
                        if (isEmail) SettingsManager.emailRecordatorios = it else SettingsManager.bannerRecordatorios = it
                        SettingsManager.save(context)
                    }
                )

                // 2. INFORMATIVOS
                NotificationRowWithSwitch(
                    title = AppStateBaseDeDatos.t("Informativos"),
                    checked = if (isEmail) SettingsManager.emailInformativos else SettingsManager.bannerInformativos,
                    onCheckedChange = {
                        if (isEmail) SettingsManager.emailInformativos = it else SettingsManager.bannerInformativos = it
                        SettingsManager.save(context)
                    }
                )

                // 3. RESUMEN DIARIO
                NotificationRowWithSwitch(
                    title = AppStateBaseDeDatos.t("Resumen Diario"),
                    checked = if (isEmail) SettingsManager.resumenDiarioEmail else SettingsManager.resumenDiarioBanner,
                    subtitle = AppStateBaseDeDatos.t("Todos los días a las 8:00"),
                    onCheckedChange = {
                        if (isEmail) SettingsManager.resumenDiarioEmail = it else SettingsManager.resumenDiarioBanner = it
                        SettingsManager.save(context)
                    }
                )

                // 4. SENSOR OFFLINE
                NotificationRowWithSwitch(
                    title = AppStateBaseDeDatos.t("Sensor Offline"),
                    checked = if (isEmail) SettingsManager.sensorOfflineEmail else SettingsManager.sensorOfflineBanner,
                    subtitle = AppStateBaseDeDatos.tSensorOffline(SettingsManager.sensorOfflineHours),
                    onCheckedChange = {
                        if (isEmail) SettingsManager.sensorOfflineEmail = it else SettingsManager.sensorOfflineBanner = it
                        SettingsManager.save(context)
                    },
                    onEditClick = onOpenSensorOfflineDialog
                )

                // 5. BATERÍA BAJA
                NotificationRowWithSwitch(
                    title = AppStateBaseDeDatos.t("Batería Baja"),
                    checked = if (isEmail) SettingsManager.bateriaBajaEmail else SettingsManager.bateriaBajaBanner,
                    subtitle = AppStateBaseDeDatos.tBateriaBaja(SettingsManager.bateriaBajaPercent),
                    onCheckedChange = {
                        if (isEmail) SettingsManager.bateriaBajaEmail = it else SettingsManager.bateriaBajaBanner = it
                        SettingsManager.save(context)
                    },
                    onEditClick = onOpenBateriaBajaDialog
                )
            }
        }
    }
}

/**
 * Fila compacta de subcategoría con interruptor alineado a la derecha.
 */
@Composable
fun SubCategoryRow(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = AgrilionTokens.Zinc400,
            modifier = Modifier.weight(1f)
        )
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = AgrilionTokens.Emerald600,
                uncheckedThumbColor = AgrilionTokens.Zinc400,
                uncheckedTrackColor = AgrilionTokens.SurfaceDark2
            )
        )
    }
}

/**
 * Fila de notificación con título, subtítulo opcional y switch (e icono de lápiz opcional).
 */
@Composable
fun NotificationRowWithSwitch(
    title: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    subtitle: String? = null,
    onEditClick: (() -> Unit)? = null
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onCheckedChange(!checked) }
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
            if (subtitle != null) {
                Text(
                    text = subtitle,
                    fontSize = 11.sp,
                    color = AgrilionTokens.Zinc400,
                    modifier = Modifier.padding(top = 2.dp)
                )
            }
        }

        Row(verticalAlignment = Alignment.CenterVertically) {
            if (onEditClick != null) {
                IconButton(
                    onClick = onEditClick,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Edit,
                        contentDescription = "Editar",
                        tint = AgrilionTokens.Zinc400,
                        modifier = Modifier.size(16.dp)
                    )
                }
                Spacer(modifier = Modifier.width(4.dp))
            }

            Switch(
                checked = checked,
                onCheckedChange = onCheckedChange,
                colors = SwitchDefaults.colors(
                    checkedThumbColor = Color.White,
                    checkedTrackColor = AgrilionTokens.Emerald600,
                    uncheckedThumbColor = AgrilionTokens.Zinc400,
                    uncheckedTrackColor = AgrilionTokens.SurfaceDark2
                )
            )
        }
    }
}

/**
 * Fila de edición de umbrales con alineación vertical perfecta de cuadros de texto de 80.dp.
 */
@Composable
fun ThresholdInputRow(label: String, valueText: String, unit: String, onValueChange: (String) -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = label,
            fontWeight = FontWeight.Medium,
            color = Color.White,
            fontSize = 13.sp,
            modifier = Modifier.weight(1f)
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = valueText,
                onValueChange = onValueChange,
                modifier = Modifier.width(80.dp),
                shape = RoundedCornerShape(12.dp),
                singleLine = true,
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedTextColor = Color.White,
                    unfocusedTextColor = Color.White,
                    focusedBorderColor = AgrilionTokens.Emerald500,
                    unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                    focusedContainerColor = AgrilionTokens.SurfaceDark2,
                    unfocusedContainerColor = AgrilionTokens.SurfaceDark2
                )
            )
            Spacer(modifier = Modifier.width(8.dp))
            Box(
                modifier = Modifier.width(42.dp),
                contentAlignment = Alignment.CenterStart
            ) {
                Text(
                    text = unit,
                    fontSize = 13.sp,
                    color = AgrilionTokens.Zinc400,
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun NumericChooserDialog(
    title: String,
    currentValue: Int,
    minValue: Int,
    maxValue: Int,
    unitSuffix: String,
    onDismiss: () -> Unit,
    onConfirm: (Int) -> Unit
) {
    var valText by remember { mutableStateOf(currentValue.toString()) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = AgrilionTokens.RadiusCard,
            color = AgrilionTokens.SurfaceDark1,
            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(title, fontWeight = FontWeight.Black, fontSize = 16.sp, color = Color.White)
                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = valText,
                    onValueChange = { valText = it },
                    label = { Text(AppStateBaseDeDatos.tNumericChooserRange(minValue, maxValue, unitSuffix), color = AgrilionTokens.Zinc400) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AgrilionTokens.Emerald500,
                        unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                        focusedContainerColor = AgrilionTokens.SurfaceDark2,
                        unfocusedContainerColor = AgrilionTokens.SurfaceDark2
                    )
                )

                Spacer(modifier = Modifier.height(20.dp))

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
                    TextButton(onClick = onDismiss) {
                        Text(AppStateBaseDeDatos.t("Cancelar"), color = AgrilionTokens.Zinc400)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            val parsed = valText.toIntOrNull()
                            if (parsed != null && parsed in minValue..maxValue) {
                                onConfirm(parsed)
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600)
                    ) {
                        Text(AppStateBaseDeDatos.t("Guardar"), fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
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
