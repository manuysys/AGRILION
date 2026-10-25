package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens

@Composable
fun SiloDetailScreen(siloId: String) {
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        Text(
            text = AppStateBaseDeDatos.t("DETALLE DE SILOBOLSA"),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
            color = Color.White,
            letterSpacing = (-0.5).sp
        )
        
        Spacer(modifier = Modifier.height(4.dp))
        
        Text(
            text = "${AppStateBaseDeDatos.t("Detalle Técnico")}: Silobolsa N°$siloId",
            style = MaterialTheme.typography.titleMedium,
            color = AgrilionTokens.Zinc400,
            fontSize = 15.sp
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Gráficos simulados con estilo Agrilion+
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            StatCard(AppStateBaseDeDatos.t("Temperatura"), Modifier.weight(1f))
            StatCard("CO2", Modifier.weight(1f))
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            StatCard(AppStateBaseDeDatos.t("Presión"), Modifier.weight(1f))
            StatCard(AppStateBaseDeDatos.t("Humedad"), Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun StatCard(label: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier
            .height(200.dp)
            .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard),
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = label.uppercase(),
                style = AgrilionTokens.LabelSmallMuted
            )
            Spacer(modifier = Modifier.height(16.dp))
            // Simulación de gráfico de barras con estilo esmeralda
            Row(
                modifier = Modifier.fillMaxSize(),
                verticalAlignment = Alignment.Bottom,
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                listOf(0.4f, 0.7f, 0.5f, 0.9f).forEachIndexed { index, h ->
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Box(
                            modifier = Modifier
                                .width(12.dp)
                                .fillMaxHeight(h)
                                .background(AgrilionTokens.Emerald500, RoundedCornerShape(4.dp))
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "L${index+1}",
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            color = AgrilionTokens.Zinc500,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
