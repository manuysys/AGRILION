package com.example.app1.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.R
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.CotizacionGranoBaseDeDatos
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SilosDataManagerBaseDeDatos
import java.util.Locale

@Composable
fun DashboardScreen() {
    val scrollState = rememberScrollState()
    
    // DATOS DESDE EL BACKEND / IA
    val silos = SilosDataManagerBaseDeDatos.silosList
    val totalBueno = silos.count { it.estado == EstadoSilo.BUENO }
    val totalAlerta = silos.count { it.estado == EstadoSilo.ALERTA }
    val totalCritico = silos.count { it.estado == EstadoSilo.CRITICO }
    val totalSinDatos = silos.count { it.estado == EstadoSilo.SIN_DATOS }
    val total = silos.size.toFloat()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // 1. BANNER DE ALERTA (Solo si hay datos críticos)
        if (silos.isNotEmpty() && (totalSinDatos > 0 || totalCritico > 0)) {
            Card(
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                colors = CardDefaults.cardColors(containerColor = Color(0xFFFFEBEE))
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (totalSinDatos > 0) Icons.Default.WifiOff else Icons.Default.Warning,
                        contentDescription = null,
                        tint = Color(0xFFB71C1C)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = if (totalSinDatos > 0) 
                            AppStateBaseDeDatos.t("ALERTA: Hay silobolsas que no están enviando datos.") 
                            else "ALERTA: Cambios bruscos detectados en ${totalCritico} silo(s).",
                        color = Color(0xFFB71C1C),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                }
            }
        }

        // REQUERIMIENTO: Mostrar dashboard siempre (incluso en 0)
        DashboardSection(AppStateBaseDeDatos.t("Estados de Silobolsas")) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier.size(110.dp).background(Color(0xFFD6D6D6), CircleShape),
                    contentAlignment = Alignment.Center
                ) {
                    Text(AppStateBaseDeDatos.t("Gráfico"), fontSize = 12.sp, color = Color.Gray)
                }
                Spacer(modifier = Modifier.width(24.dp))
                Column {
                    StatusRow(AppStateBaseDeDatos.t("Bueno"), Color(0xFF4CAF50), if(total>0) (totalBueno/total)*100 else 0f)
                    StatusRow(AppStateBaseDeDatos.t("Alerta"), Color(0xFFFFC107), if(total>0) (totalAlerta/total)*100 else 0f)
                    StatusRow(AppStateBaseDeDatos.t("Crítico"), Color(0xFFF44336), if(total>0) (totalCritico/total)*100 else 0f)
                    StatusRow(AppStateBaseDeDatos.t("Sin Datos"), Color(0xFF9E9E9E), if(total>0) (totalSinDatos/total)*100 else 0f)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        DashboardSection("${AppStateBaseDeDatos.t("Distribución por Tipo de Grano")} (${if(AppStateBaseDeDatos.unidadPesoSeleccionada.contains("TN")) "TN" else "Kg"})") {
            val granos = listOf("Trigo", "Maíz", "Soja", "Cebada", "Girasol")
            granos.forEach { g ->
                val tn = if (silos.isEmpty()) 0.0 else silos.filter { it.tipoGrano == g }.sumOf { it.toneladas }
                val progress = if (total > 0) (tn / 2000000).toFloat().coerceIn(0f, 1f) else 0f
                GrainRow(AppStateBaseDeDatos.t(g), tn, progress)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        DashboardSection(AppStateBaseDeDatos.t("Ubicación")) {
            Box(
                modifier = Modifier.fillMaxWidth().height(180.dp).background(Color(0xFFF5F5F5), RoundedCornerShape(8.dp)),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color.Gray)
                    Text(AppStateBaseDeDatos.t("Simulación"), color = Color.Gray)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        DashboardSection {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = AppStateBaseDeDatos.t("Cotización de Granos (BCR)"),
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "10/07/2026",
                    style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                    color = Color.Gray
                )
            }
            Spacer(modifier = Modifier.height(12.dp))
            LegacyPricingTable()
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun DashboardSection(title: String? = null, content: @Composable () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFE8E8E8)) 
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            if (title != null) {
                Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.height(16.dp))
            }
            content()
        }
    }
}

@Composable
fun StatusRow(label: String, color: Color, percentage: Float) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(vertical = 4.dp)) {
        Box(modifier = Modifier.size(10.dp).background(color, CircleShape))
        Spacer(modifier = Modifier.width(8.dp))
        Text("$label: ${percentage.toInt()}%", fontSize = 13.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun GrainRow(label: String, toneladas: Double, progress: Float) {
    val valor = AppStateBaseDeDatos.convertirToneladas(toneladas)
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)
            Text(
                text = String.format(Locale.getDefault(), "%,.0f", valor),
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold
            )
        }
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
            color = Color(0xFF4CAF50),
            trackColor = Color(0xFFD6D6D6)
        )
    }
}

@Composable
fun LegacyPricingTable() {
    val items = listOf(
        CotizacionGranoBaseDeDatos("Trigo", 196.9, 292000.0),
        CotizacionGranoBaseDeDatos("Maíz", 182.0, 269900.0),
        CotizacionGranoBaseDeDatos("Soja", 324.01, 480500.0),
        CotizacionGranoBaseDeDatos("Cebada", 215.0, 320000.0),
        CotizacionGranoBaseDeDatos("Girasol", 450.0, 670000.0)
    )

    Column {
        Row(modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp)) {
            Text(AppStateBaseDeDatos.t("Grano"), modifier = Modifier.weight(1.5f), fontWeight = FontWeight.Bold, color = Color.Gray)
            Text("USD", modifier = Modifier.weight(1f), fontWeight = FontWeight.Bold, color = Color.Gray)
            Text(AppStateBaseDeDatos.t("Pesos"), modifier = Modifier.weight(1.5f), fontWeight = FontWeight.Bold, color = Color.Gray)
        }
        HorizontalDivider(color = Color.Gray.copy(alpha = 0.2f))
        items.forEach { item ->
            Row(modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Row(modifier = Modifier.weight(1.5f), verticalAlignment = Alignment.CenterVertically) {
                    Image(
                        painter = painterResource(id = when(item.grano.lowercase()){
                            "trigo" -> R.drawable.logotrigo
                            "maíz","maiz" -> R.drawable.logomaiz
                            "soja" -> R.drawable.logosojanegro
                            "cebada" -> R.drawable.logocebada
                            "girasol" -> R.drawable.logogirasol
                            else -> R.drawable.logotrigo
                        }),
                        contentDescription = null,
                        modifier = Modifier.size(26.dp)
                    )
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(AppStateBaseDeDatos.t(item.grano), fontWeight = FontWeight.Medium)
                }
                Text("${item.precioUSD}", modifier = Modifier.weight(1f), fontSize = 14.sp)
                Text("${item.precioARS}", modifier = Modifier.weight(1.5f), fontSize = 14.sp)
            }
            HorizontalDivider(color = Color.Gray.copy(alpha = 0.1f))
        }
    }
}
