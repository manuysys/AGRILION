package com.example.app1.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GpsFixed
import androidx.compose.material.icons.filled.GpsOff
import androidx.compose.material.icons.filled.LocationOn
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
import com.example.app1.ui.components.SiloMiniMap
import com.example.app1.ui.theme.AgrilionTokens
import kotlin.math.roundToInt

/**
 * Antigüedad máxima (min) a partir de la cual un fix GPS deja de considerarse
 * "actual" y se muestra como "última posición conocida".
 */
private const val GPS_FIX_FRESH_MAX_MIN = 30

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

        // ESTADO GPS DEL NODO (Air530Z): fix actual vs última posición conocida
        val hasPosition = data.gpsHasFix && data.latitude != null && data.longitude != null
        val gpsAgeMin = data.gpsAgeMin
        val gpsFresh = hasPosition && (
            (gpsAgeMin != null && gpsAgeMin <= GPS_FIX_FRESH_MAX_MIN) ||
                (gpsAgeMin == null && data.gpsFix)
            )
        val gpsStatusColor: Color
        val gpsStatusLabel: String
        when {
            !hasPosition -> {
                gpsStatusColor = AgrilionTokens.Zinc500
                gpsStatusLabel = "Sin posición GPS (el Air530Z necesita vista al cielo)"
            }
            gpsAgeMin != null && gpsAgeMin <= GPS_FIX_FRESH_MAX_MIN -> {
                gpsStatusColor = AgrilionTokens.Emerald500
                gpsStatusLabel = "Fix actual"
            }
            gpsAgeMin != null -> {
                gpsStatusColor = AgrilionTokens.Warn
                gpsStatusLabel = "Última posición conocida (hace $gpsAgeMin min)"
            }
            data.gpsFix -> {
                gpsStatusColor = AgrilionTokens.Emerald500
                gpsStatusLabel = "Fix actual"
            }
            else -> {
                gpsStatusColor = AgrilionTokens.Warn
                gpsStatusLabel = "Última posición conocida"
            }
        }
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
            shape = AgrilionTokens.RadiusCard,
            colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
        ) {
            Column(Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = gpsStatusColor,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        "ESTADO GPS",
                        color = AgrilionTokens.Zinc400,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.sp
                    )
                }
                Spacer(Modifier.height(10.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (gpsFresh) Icons.Default.GpsFixed else Icons.Default.GpsOff,
                        contentDescription = null,
                        tint = gpsStatusColor,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(8.dp))
                    Text(
                        gpsStatusLabel,
                        color = gpsStatusColor,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
                if (data.latitude != null && data.longitude != null) {
                    Text(
                        "${data.latitude}, ${data.longitude}",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 11.sp,
                        color = AgrilionTokens.Zinc400,
                        modifier = Modifier.padding(top = 4.dp)
                    )
                }
                Spacer(Modifier.height(12.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    GpsStat("Satélites", data.gpsSatellites?.toString() ?: "Sin dato", Modifier.weight(1f))
                    GpsStat("HDOP", data.gpsHdop?.let { format(it) } ?: "Sin dato", Modifier.weight(1f))
                    GpsStat("Edad del fix", gpsAgeMin?.let { "$it min" } ?: "Sin dato", Modifier.weight(1f))
                }
            }
        }

        // MINI-MAPA DEL SILO: un marcador en su posición GPS, zoom 16
        if (data.latitude != null && data.longitude != null) {
            Spacer(Modifier.height(12.dp))
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = AgrilionTokens.RadiusCard,
                colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark2)
            ) {
                Column {
                    SiloMiniMap(
                        latitude = data.latitude!!,
                        longitude = data.longitude!!,
                        title = data.nombre,
                        modifier = Modifier.fillMaxWidth()
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.End
                    ) {
                        Text(
                            "© OpenStreetMap",
                            color = AgrilionTokens.Zinc500,
                            fontSize = 10.sp
                        )
                    }
                }
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

        // ANÁLISIS IA: predicción LSTM + anomalías + motor compuesto de riesgo
        Text("Análisis IA", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 17.sp)
        Spacer(Modifier.height(8.dp))

        // Metadatos del endpoint /prediction correspondientes a ESTE silo.
        val predictionMeta = SilosDataManagerBaseDeDatos.lastPredictionMeta
            ?.takeIf { it.siloId == siloId }

        AiSectionCard("PREDICCIÓN LSTM") {
            if (predictionMeta != null) {
                Text(
                    "Modelo ${predictionMeta.model} · ${predictionMeta.readings}/${predictionMeta.required} lecturas",
                    color = AgrilionTokens.Zinc500,
                    fontSize = 11.sp
                )
            }
            if (data.prediction.isEmpty()) {
                Text("Sin dato", color = AgrilionTokens.Zinc500, fontSize = 13.sp)
            } else {
                data.prediction.forEachIndexed { index, step ->
                    val co2Txt = if (step.co2 > 0) "${step.co2.roundToInt()} ppm" else "—"
                    Text(
                        text = "+${index + 1} h · " +
                            "${format(step.temperature)} °C · " +
                            "${format(step.humidity)} % · " +
                            co2Txt,
                        color = Color.White.copy(alpha = 0.85f),
                        fontSize = 13.sp
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        AiSectionCard("ANOMALÍAS (Z-SCORE + MEDIA MÓVIL + ISOLATIONFOREST)") {
            val anomalies = predictionMeta?.anomalies
            if (anomalies == null) {
                Text("Sin dato", color = AgrilionTokens.Zinc500, fontSize = 13.sp)
            } else {
                val isAnomaly = (anomalies["is_anomaly"] as? Boolean) == true
                val affected = (anomalies["affected_sensors"] as? List<*>)
                    ?.filterIsInstance<String>()
                    .orEmpty()
                if (isAnomaly) {
                    StatusPill("ANOMALÍA DETECTADA", AgrilionTokens.Critical)
                    Text(
                        text = if (affected.isEmpty()) {
                            "Los detectores marcaron desvíos en la última lectura."
                        } else {
                            "Sensores afectados: " + affected.joinToString(", ") { sensorLabel(it) }
                        },
                        color = AgrilionTokens.Zinc400,
                        fontSize = 13.sp
                    )
                } else {
                    StatusPill("SIN ANOMALÍAS", AgrilionTokens.Ok)
                    Text(
                        "Las lecturas actuales están dentro del rango esperado por los detectores.",
                        color = AgrilionTokens.Zinc400,
                        fontSize = 13.sp
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        AiSectionCard("RIESGO (MOTOR COMPUESTO)") {
            Row(verticalAlignment = Alignment.Bottom) {
                Text(
                    text = "${data.riskScore}",
                    color = data.estado.color,
                    fontSize = 34.sp,
                    fontWeight = FontWeight.Black
                )
                Text(
                    text = " / 100 · ${data.riskLevel}",
                    color = AgrilionTokens.Zinc400,
                    fontSize = 14.sp,
                    modifier = Modifier.padding(bottom = 4.dp)
                )
            }
            // Desglose real del motor compuesto (endpoint /prediction), si está disponible.
            val factors = predictionMeta?.risk?.get("factors") as? Map<*, *>
            if (factors != null && factors.isNotEmpty()) {
                HorizontalDivider(
                    color = AgrilionTokens.BorderFaint,
                    modifier = Modifier.padding(vertical = 6.dp)
                )
                factors.forEach { (_, value) ->
                    val factor = value as? Map<*, *> ?: return@forEach
                    val detail = factor["detail"]?.toString() ?: return@forEach
                    val weighted = (factor["weighted_score"] as? Number)?.toDouble()
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = detail,
                            color = AgrilionTokens.Zinc400,
                            fontSize = 12.sp,
                            modifier = Modifier.weight(1f)
                        )
                        if (weighted != null) {
                            Text(
                                text = "${format(weighted)}/100",
                                color = Color.White.copy(alpha = 0.85f),
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace
                            )
                        }
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

/**
 * Card genérica para las secciones de análisis IA del detalle del silo.
 */
@Composable
private fun AiSectionCard(title: String, content: @Composable ColumnScope.() -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                title,
                color = AgrilionTokens.Emerald500,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 1.sp
            )
            content()
        }
    }
}

/**
 * Mini bloque etiqueta/valor de los stats GPS (satélites, HDOP, edad del fix).
 */
@Composable
private fun GpsStat(label: String, value: String, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier
            .background(AgrilionTokens.SurfaceDark2, RoundedCornerShape(10.dp))
            .padding(horizontal = 10.dp, vertical = 8.dp)
    ) {
        Text(
            label.uppercase(),
            color = AgrilionTokens.Zinc500,
            fontSize = 9.sp,
            fontWeight = FontWeight.Bold
        )
        Spacer(Modifier.height(2.dp))
        Text(
            value,
            color = Color.White,
            fontSize = 13.sp,
            fontWeight = FontWeight.Bold,
            fontFamily = FontFamily.Monospace
        )
    }
}

/**
 * Chip de estado (anomalía detectada / sin anomalías) con el color de severidad.
 */
@Composable
private fun StatusPill(text: String, color: Color) {
    Surface(
        color = color.copy(alpha = 0.15f),
        shape = RoundedCornerShape(20.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.5f))
    ) {
        Text(
            text = text,
            color = color,
            fontWeight = FontWeight.Bold,
            fontSize = 11.sp,
            letterSpacing = 0.5.sp,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
        )
    }
}

/**
 * Nombre visible de un sensor reportado por la IA API.
 */
private fun sensorLabel(sensor: String): String = when (sensor.lowercase()) {
    "temperature" -> "Temperatura"
    "humidity" -> "Humedad"
    "co2" -> "CO₂"
    "pressure" -> "Presión"
    else -> sensor
}
