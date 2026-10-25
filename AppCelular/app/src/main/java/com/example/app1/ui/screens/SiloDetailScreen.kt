package com.example.app1.ui.screens

import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.SensorReadingBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens
import kotlin.math.roundToInt

@Composable
fun SiloDetailScreen(siloId: String) {
    val scrollState = rememberScrollState()
    val current = SilosDataManagerBaseDeDatos.silosList.find { it.id == siloId }
    var silo by remember(siloId) { mutableStateOf(current) }

    LaunchedEffect(siloId) {
        silo = SilosDataManagerBaseDeDatos.loadDetail(siloId) ?: current
    }

    val data = silo
    if (data == null) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .background(AgrilionTokens.SurfaceDarkRoot)
                .padding(24.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Silo no encontrado", color = Color.White, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(8.dp))
            Text("Actualizá los datos desde el inicio.", color = AgrilionTokens.Zinc400)
        }
        return
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        Text(
            text = data.nombre,
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
            color = Color.White,
            letterSpacing = (-0.5).sp
        )
        Spacer(Modifier.height(4.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = "${data.tipoGrano} · ${data.ultimaActualizacion}",
                color = AgrilionTokens.Zinc400,
                fontSize = 13.sp
            )
            Spacer(Modifier.weight(1f))
            Surface(
                color = data.estado.color.copy(alpha = 0.15f),
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, data.estado.color.copy(alpha = 0.5f))
            ) {
                Text(
                    text = data.estado.texto,
                    color = data.estado.color,
                    fontWeight = FontWeight.Bold,
                    fontSize = 12.sp,
                    modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                )
            }
        }

        Spacer(Modifier.height(16.dp))

        // Riesgo
        Card(
            modifier = Modifier.fillMaxWidth(),
            shape = AgrilionTokens.RadiusCard,
            colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
        ) {
            Column(Modifier.padding(16.dp)) {
                Text("Riesgo actual", color = AgrilionTokens.Zinc400, fontSize = 12.sp)
                Row(verticalAlignment = Alignment.Bottom) {
                    Text(
                        text = "${data.riskScore}",
                        color = data.estado.color,
                        fontSize = 42.sp,
                        fontWeight = FontWeight.Black
                    )
                    Text(
                        text = " / 100 · ${data.riskLevel}",
                        color = AgrilionTokens.Zinc400,
                        fontSize = 14.sp,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }
                Text(
                    text = data.diagnosticoSemanal,
                    color = Color.White.copy(alpha = 0.85f),
                    fontSize = 13.sp
                )
            }
        }

        Spacer(Modifier.height(12.dp))

        // Métricas actuales
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                "Temperatura",
                format(data.temperatura),
                "°C",
                data.estado.color,
                Modifier.weight(1f)
            )
            MetricCard(
                "Humedad",
                format(data.humedad),
                "%",
                AgrilionTokens.Emerald500,
                Modifier.weight(1f)
            )
        }
        Spacer(Modifier.height(12.dp))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
            MetricCard(
                "CO₂",
                if (data.co2 > 0) data.co2.roundToInt().toString() else "—",
                "ppm",
                co2Color(data.co2),
                Modifier.weight(1f)
            )
            MetricCard(
                "Presión",
                data.presion?.roundToInt()?.toString() ?: "—",
                "hPa",
                AgrilionTokens.Zinc400,
                Modifier.weight(1f)
            )
        }

        Spacer(Modifier.height(20.dp))

        // Histórico 24 h
        Text("Histórico 24 h", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 17.sp)
        Spacer(Modifier.height(8.dp))

        if (data.history.size < 2) {
            EmptyCard("Sin lecturas históricas todavía.")
        } else {
            val metrics = listOf("Temperatura", "Humedad", "CO₂")
            var selected by remember { mutableStateOf("Temperatura") }
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                metrics.forEach { m ->
                    val active = selected == m
                    Surface(
                        color = if (active) AgrilionTokens.Emerald600 else AgrilionTokens.SurfaceDark2,
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier
                            .weight(1f)
                            .border(
                                if (active) 0.dp else 1.dp,
                                AgrilionTokens.BorderSubtle,
                                RoundedCornerShape(10.dp)
                            )
                            .let { it }
                            .then(
                                Modifier
                            )
                    ) {
                        TextButton(onClick = { selected = m }) {
                            Text(
                                m,
                                color = if (active) Color.White else AgrilionTokens.Zinc400,
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            val values = when (selected) {
                "Temperatura" -> data.history.map { it.temperature.toFloat() }
                "Humedad" -> data.history.map { it.humidity.toFloat() }
                else -> data.history.map { it.co2.toFloat() }
            }
            val chartColor = when (selected) {
                "Temperatura" -> AgrilionTokens.Emerald500
                "Humedad" -> AgrilionTokens.Emerald500
                else -> Color(0xFFB388FF)
            }
            SensorLineChart(
                values = values,
                color = chartColor,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp)
                    .background(AgrilionTokens.SurfaceDark1, RoundedCornerShape(12.dp))
                    .padding(12.dp)
            )
        }

        Spacer(Modifier.height(20.dp))

        // Predicción LSTM
        if (data.prediction.isNotEmpty()) {
            Text("Predicción LSTM", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 17.sp)
            Spacer(Modifier.height(8.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = AgrilionTokens.RadiusCard,
                colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
            ) {
                Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    data.prediction.take(3).forEach { step ->
                        Text(
                            text = "+${data.prediction.indexOf(step) + 1} h · " +
                                "${format(step.temperature)} °C · " +
                                "${format(step.humidity)} % · " +
                                "${step.co2.roundToInt()} ppm",
                            color = Color.White.copy(alpha = 0.85f),
                            fontSize = 13.sp
                        )
                    }
                }
            }
        }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun MetricCard(
    label: String,
    value: String,
    unit: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
    ) {
        Column(Modifier.padding(14.dp)) {
            Text(label.uppercase(), color = AgrilionTokens.Zinc500, fontSize = 10.sp, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(6.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(value, color = color, fontSize = 26.sp, fontWeight = FontWeight.Black)
                Text(unit, color = AgrilionTokens.Zinc400, fontSize = 11.sp, modifier = Modifier.padding(start = 4.dp, bottom = 4.dp))
            }
        }
    }
}

@Composable
private fun EmptyCard(message: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
    ) {
        Text(
            message,
            color = AgrilionTokens.Zinc400,
            fontSize = 13.sp,
            modifier = Modifier.padding(16.dp)
        )
    }
}

@Composable
private fun SensorLineChart(values: List<Float>, color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier) {
        if (values.size < 2) return@Canvas
        val min = values.minOrNull() ?: 0f
        val max = values.maxOrNull() ?: 1f
        val range = (max - min).takeIf { it > 0.0001f } ?: 1f

        drawLine(
            color = Color.White.copy(alpha = 0.08f),
            start = Offset(0f, size.height),
            end = Offset(size.width, size.height),
            strokeWidth = 1.dp.toPx()
        )

        val path = Path()
        values.forEachIndexed { index, value ->
            val x = size.width * index / (values.size - 1).toFloat()
            val y = size.height - ((value - min) / range) * size.height
            if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
        }
        drawPath(path, color = color, style = Stroke(width = 3.dp.toPx()))
    }
}

private fun format(value: Double): String =
    String.format(java.util.Locale.US, "%.1f", value)

private fun co2Color(co2: Double): Color = when {
    co2 <= 0 -> AgrilionTokens.Zinc400
    co2 > 1200 -> AgrilionTokens.Critical
    co2 > 600 -> AgrilionTokens.Warn
    else -> AgrilionTokens.Ok
}
