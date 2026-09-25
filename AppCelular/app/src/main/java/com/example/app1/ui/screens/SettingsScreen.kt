package com.example.app1.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.AppStateBaseDeDatos

@Composable
fun SettingsScreen() {
    val scrollState = rememberScrollState()
    
    // Idiomas disponibles
    val languages = listOf("Español", "English", "Português")
    var showLanguageMenu by remember { mutableStateOf(false) }

    var tempUnit by remember { mutableStateOf("Celsius (°C)") }
    var co2Unit by remember { mutableStateOf("PPM") }
    var pressUnit by remember { mutableStateOf("Hectopascales (hPa)") }
    var humUnit by remember { mutableStateOf("Porcentaje (%)") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        
        // IDIOMA TRADUCIDO
        Text(
            text = AppStateBaseDeDatos.t("Idioma"), 
            style = TextStyle(fontSize = 23.sp, fontWeight = FontWeight.Bold)
        )
        Box(modifier = Modifier.padding(vertical = 8.dp)) {
            OutlinedButton(
                onClick = { showLanguageMenu = true },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.fillMaxWidth(0.7f),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Start) {
                    Text(
                        text = AppStateBaseDeDatos.currentLanguage,
                        style = MaterialTheme.typography.bodyLarge
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
                            // 2. ACTUALIZACIÓN DE IDIOMA GLOBAL
                            AppStateBaseDeDatos.currentLanguage = lang
                            showLanguageMenu = false
                        }
                    )
                }
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))

        // UNIDADES TRADUCIDAS
        Text(
            text = AppStateBaseDeDatos.t("Unidades de Medida"), 
            style = TextStyle(fontSize = 23.sp, fontWeight = FontWeight.Bold)
        )
        Spacer(modifier = Modifier.height(16.dp))

        UnitSelectorRow(AppStateBaseDeDatos.t("Temperatura"), tempUnit, listOf("Celsius (°C)", "Fahrenheit (°F)")) { tempUnit = it }
        UnitSelectorRow("CO2", co2Unit, listOf("PPM", "Porcentaje (%)")) { co2Unit = it }
        UnitSelectorRow(AppStateBaseDeDatos.t("Peso"), AppStateBaseDeDatos.unidadPesoSeleccionada, listOf("Toneladas (TN)", "Kilogramos (Kg)")) { 
            AppStateBaseDeDatos.unidadPesoSeleccionada = it 
        }
        UnitSelectorRow(AppStateBaseDeDatos.t("Presión"), pressUnit, listOf("Hectopascales (hPa)", "Bar")) { pressUnit = it }
        UnitSelectorRow(AppStateBaseDeDatos.t("Humedad"), humUnit, listOf("Porcentaje (%)", "Gramos/m3")) { humUnit = it }

        Spacer(modifier = Modifier.height(24.dp))
        
        Text(
            text = AppStateBaseDeDatos.t("Notificaciones"), 
            style = TextStyle(fontSize = 23.sp, fontWeight = FontWeight.Bold)
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

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun NotificationBox(title: String, opt1: String, opt2: String, opt3: String) {
    var check1 by remember { mutableStateOf(true) }
    var check2 by remember { mutableStateOf(true) }
    var check3 by remember { mutableStateOf(false) }

    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color(0xFFF0F0F0),
        shape = RoundedCornerShape(8.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.bodyLarge)
            HorizontalDivider(color = Color.Gray, thickness = 1.dp, modifier = Modifier.padding(vertical = 8.dp))
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
        Text(text, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        Checkbox(checked = isChecked, onCheckedChange = onCheckedChange)
    }
}

@Composable
fun UnitSelectorRow(label: String, selected: String, options: List<String>, onSelect: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        Text(label, style = MaterialTheme.typography.labelMedium)
        Box {
            OutlinedButton(
                onClick = { expanded = true },
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth(0.7f), 
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Start) {
                    Text(selected, style = MaterialTheme.typography.bodyMedium)
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
