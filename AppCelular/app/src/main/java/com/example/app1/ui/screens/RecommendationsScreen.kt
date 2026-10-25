package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens

@Composable
fun RecommendationsScreen() {
    val scrollState = rememberScrollState()
    val silos = SilosDataManagerBaseDeDatos.silosList

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        if (silos.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(top = 100.dp), contentAlignment = Alignment.Center) {
                Text(
                    text = "No hay granos registrados para analizar",
                    color = AgrilionTokens.Zinc400,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        } else {
            val tiposDeGrano = silos
                .map { it.tipoGrano }
                .filter { it.isNotBlank() && !it.equals("Sin dato", ignoreCase = true) }
                .distinct()

            tiposDeGrano.forEach { grano ->
                RecommendationCard(
                    grain = AppStateBaseDeDatos.t(grano),
                    recommendation = SilosDataManagerBaseDeDatos.getAnalisisGralPorGrano(grano)
                )
                Spacer(modifier = Modifier.height(16.dp))
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun RecommendationCard(grain: String, recommendation: String) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard),
        color = AgrilionTokens.SurfaceDark1,
        shape = AgrilionTokens.RadiusCard
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "${AppStateBaseDeDatos.t("GRANO")}: ${grain.uppercase()}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Black,
                color = AgrilionTokens.Emerald500,
                letterSpacing = (-0.5).sp
            )
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = AgrilionTokens.BorderSubtle)
            
            Text(
                text = "${AppStateBaseDeDatos.t("RECOMENDACIONES")}:",
                style = AgrilionTokens.LabelSmallMuted
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = recommendation,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White
            )
        }
    }
}
