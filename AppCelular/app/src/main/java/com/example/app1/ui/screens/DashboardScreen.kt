package com.example.app1.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.R
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.CotizacionGranoBaseDeDatos
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens
import java.util.Locale

@Composable
fun DashboardScreen() {
    val scrollState = rememberScrollState()
    
    val silos = SilosDataManagerBaseDeDatos.silosList
    val totalBueno = silos.count { it.estado == EstadoSilo.BUENO }
    val totalAlerta = silos.count { it.estado == EstadoSilo.ALERTA }
    val totalCritico = silos.count { it.estado == EstadoSilo.CRITICO }
    val totalSinDatos = silos.count { it.estado == EstadoSilo.SIN_DATOS }
    val total = silos.size.toFloat()
    val apiError = SilosDataManagerBaseDeDatos.error
    val isLoading = SilosDataManagerBaseDeDatos.isLoading

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        if (apiError != null) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
                    .border(1.dp, AgrilionTokens.Critical, AgrilionTokens.RadiusCard),
                shape = AgrilionTokens.RadiusCard,
                colors = CardDefaults.cardColors(containerColor = AgrilionTokens.CriticalBg)
            ) {
                Text(
                    "Sin conexión con la API: $apiError",
                    color = Color.White,
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(16.dp)
                )
            }
        } else if (isLoading && silos.isEmpty()) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp),
                shape = AgrilionTokens.RadiusCard,
                colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        strokeWidth = 2.dp,
                        color = AgrilionTokens.Emerald500
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text("Actualizando datos de los silos...", color = AgrilionTokens.Zinc400, fontSize = 13.sp)
                }
            }
        }
        // 1. BANNER DE ALERTA (Solo si hay datos críticos)
        if (silos.isNotEmpty() && (totalSinDatos > 0 || totalCritico > 0)) {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 16.dp)
                    .border(width = 1.dp, color = AgrilionTokens.Critical, shape = AgrilionTokens.RadiusCard),
                shape = AgrilionTokens.RadiusCard,
                colors = CardDefaults.cardColors(containerColor = AgrilionTokens.CriticalBg)
            ) {
                Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (totalSinDatos > 0) Icons.Default.WifiOff else Icons.Default.Warning,
                        contentDescription = null,
                        tint = AgrilionTokens.Critical
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = if (totalSinDatos > 0) 
                            AppStateBaseDeDatos.t("ALERTA: Hay silobolsas que no están enviando datos.") 
                            else "ALERTA: Cambios bruscos detectados en ${totalCritico} silo(s).",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp,
                        letterSpacing = (-0.2).sp
                    )
                }
            }
        }

        // ESTADOS DE SILOBOLSAS
        DashboardSection(AppStateBaseDeDatos.t("ESTADOS DE SILOBOLSAS")) {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                StatusDonut(
                    totalBueno = totalBueno,
                    totalAlerta = totalAlerta,
                    totalCritico = totalCritico,
                    totalSinDatos = totalSinDatos,
                    total = silos.size
                )
                Spacer(modifier = Modifier.width(20.dp))
                Column {
                    StatusRow(AppStateBaseDeDatos.t("Bueno"), AgrilionTokens.Ok, if(total>0) (totalBueno/total)*100 else 0f)
                    StatusRow(AppStateBaseDeDatos.t("Alerta"), AgrilionTokens.Warn, if(total>0) (totalAlerta/total)*100 else 0f)
                    StatusRow(AppStateBaseDeDatos.t("Crítico"), AgrilionTokens.Critical, if(total>0) (totalCritico/total)*100 else 0f)
                    StatusRow(AppStateBaseDeDatos.t("Sin Datos"), AgrilionTokens.Offline, if(total>0) (totalSinDatos/total)*100 else 0f)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        DashboardSection("SILOS POR TIPO DE GRANO") {
            val counts = silos.groupingBy { it.tipoGrano.lowercase() }.eachCount()
            if (counts.isEmpty()) {
                Text("Sin silos registrados.", color = AgrilionTokens.Zinc400, fontSize = 13.sp)
            } else {
                counts.entries.sortedByDescending { it.value }.forEach { (grano, cantidad) ->
                    GrainRow(
                        label = grano.replaceFirstChar { it.uppercase() },
                        value = cantidad.toDouble(),
                        progress = if (total > 0) cantidad / total else 0f,
                        unit = "silos"
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // UBICACIÓN
        DashboardSection(AppStateBaseDeDatos.t("UBICACIÓN")) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(160.dp)
                    .background(AgrilionTokens.SurfaceDark2, AgrilionTokens.RadiusCard)
                    .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.Warning, contentDescription = null, modifier = Modifier.size(40.dp), tint = AgrilionTokens.Zinc400)
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(AppStateBaseDeDatos.t("Simulación de Mapa"), color = AgrilionTokens.Zinc400, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // COTIZACIÓN DE GRANOS (BCR)
        DashboardSection {
            Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = AppStateBaseDeDatos.t("COTIZACIÓN DE GRANOS (BCR)"),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    letterSpacing = (-0.5).sp,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "10/07/2026",
                    style = TextStyle(
                        fontSize = 11.sp,
                        fontFamily = FontFamily.Monospace,
                        fontFeatureSettings = AgrilionTokens.TabularNumsFeature,
                        color = AgrilionTokens.Zinc400
                    )
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
        modifier = Modifier
            .fillMaxWidth()
            .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard),
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            if (title != null) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                    letterSpacing = (-0.5).sp
                )
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
        Text(
            text = "$label: ",
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = AgrilionTokens.Zinc400
        )
        Text(
            text = "${percentage.toInt()}%",
            style = TextStyle(
                fontSize = 13.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace,
                fontFeatureSettings = AgrilionTokens.TabularNumsFeature,
                color = Color.White
            )
        )
    }
}

@Composable
fun StatusDonut(
    totalBueno: Int,
    totalAlerta: Int,
    totalCritico: Int,
    totalSinDatos: Int,
    total: Int
) {
    Box(modifier = Modifier.size(100.dp), contentAlignment = Alignment.Center) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val stroke = 14.dp.toPx()
            val inset = stroke / 2f
            val arcSize = Size(size.width - stroke, size.height - stroke)
            val segments = listOf(
                totalBueno to AgrilionTokens.Ok,
                totalAlerta to AgrilionTokens.Warn,
                totalCritico to AgrilionTokens.Critical,
                totalSinDatos to AgrilionTokens.Offline
            )
            drawArc(
                color = AgrilionTokens.SurfaceDark2,
                startAngle = 0f,
                sweepAngle = 360f,
                useCenter = false,
                topLeft = Offset(inset, inset),
                size = arcSize,
                style = Stroke(stroke)
            )
            if (total > 0) {
                var startAngle = -90f
                segments.forEach { (count, color) ->
                    if (count > 0) {
                        val sweep = (count.toFloat() / total) * 360f
                        drawArc(
                            color = color,
                            startAngle = startAngle + 1.5f,
                            sweepAngle = (sweep - 3f).coerceAtLeast(0f),
                            useCenter = false,
                            topLeft = Offset(inset, inset),
                            size = arcSize,
                            style = Stroke(stroke, cap = StrokeCap.Round)
                        )
                        startAngle += sweep
                    }
                }
            }
        }
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text("$total", color = Color.White, fontSize = 24.sp, fontWeight = FontWeight.Black)
            Text("silos", color = AgrilionTokens.Zinc500, fontSize = 10.sp)
        }
    }
}

@Composable
fun GrainRow(label: String, value: Double, progress: Float, unit: String = "silos") {
    Column(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
            Text(
                text = String.format(Locale.getDefault(), "%,.0f %s", value, unit),
                style = TextStyle(
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Black,
                    fontFamily = FontFamily.Monospace,
                    fontFeatureSettings = AgrilionTokens.TabularNumsFeature,
                    color = AgrilionTokens.Emerald500
                )
            )
        }
        Spacer(modifier = Modifier.height(6.dp))
        LinearProgressIndicator(
            progress = { progress },
            modifier = Modifier.fillMaxWidth().height(6.dp).clip(CircleShape),
            color = AgrilionTokens.Emerald600,
            trackColor = AgrilionTokens.SurfaceDark2
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
            Text(
                AppStateBaseDeDatos.t("GRANO"),
                modifier = Modifier.weight(1.5f),
                style = AgrilionTokens.LabelSmallMuted
            )
            Text(
                "USD",
                modifier = Modifier.weight(1f),
                style = AgrilionTokens.LabelSmallMuted
            )
            Text(
                AppStateBaseDeDatos.t("PESOS"),
                modifier = Modifier.weight(1.5f),
                style = AgrilionTokens.LabelSmallMuted
            )
        }
        HorizontalDivider(color = AgrilionTokens.BorderSubtle)
        items.forEach { item ->
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
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
                        modifier = Modifier.size(22.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        AppStateBaseDeDatos.t(item.grano),
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                        fontSize = 14.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
                Text(
                    text = "${item.precioUSD}",
                    modifier = Modifier.weight(1f),
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontFamily = FontFamily.Monospace,
                        fontFeatureSettings = AgrilionTokens.TabularNumsFeature,
                        fontWeight = FontWeight.Bold,
                        color = AgrilionTokens.Zinc400
                    )
                )
                Text(
                    text = String.format(Locale.getDefault(), "$%,.0f", item.precioARS),
                    modifier = Modifier.weight(1.5f),
                    style = TextStyle(
                        fontSize = 14.sp,
                        fontFamily = FontFamily.Monospace,
                        fontFeatureSettings = AgrilionTokens.TabularNumsFeature,
                        fontWeight = FontWeight.Bold,
                        color = AgrilionTokens.Emerald500
                    )
                )
            }
            HorizontalDivider(color = AgrilionTokens.BorderFaint)
        }
    }
}
