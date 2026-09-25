package com.example.app1.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos

@Composable
fun RecommendationsScreen() {
    val scrollState = rememberScrollState()
    val silos = SilosDataManagerBaseDeDatos.silosList

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // REQUERIMIENTO 2: Si no hay granos para analizar, no mostrar nada (o mensaje vacío)
        if (silos.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text(
                    text = "No hay granos registrados para analizar",
                    color = Color.Gray,
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        } else {
            val tiposDeGrano = listOf("Trigo", "Maíz", "Soja", "Cebada", "Girasol")
            
            tiposDeGrano.forEach { grano ->
                // Solo mostrar la tarjeta si existe al menos un silo de ese tipo
                if (silos.any { it.tipoGrano.equals(grano, ignoreCase = true) }) {
                    RecommendationCard(
                        grain = AppStateBaseDeDatos.t(grano),
                        recommendation = SilosDataManagerBaseDeDatos.getAnalisisGralPorGrano(grano)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))
    }
}

@Composable
fun RecommendationCard(grain: String, recommendation: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color(0xFFF9F9F9),
        shape = RoundedCornerShape(12.dp),
        shadowElevation = 2.dp
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "${AppStateBaseDeDatos.t("Grano")}: $grain",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.primary
            )
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.LightGray.copy(alpha = 0.5f))
            
            Text(
                text = "${AppStateBaseDeDatos.t("Recomendaciones")}:",
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = recommendation,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 4.dp)
            )
        }
    }
}
