package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens

// Catálogo de granos compartido por RecommendationsScreen y GrainSilosScreen.
// Definido UNA sola vez en este archivo para evitar redeclaración.
val GRANOS_APP = listOf("Trigo", "Maíz", "Soja", "Cebada", "Girasol")

@Composable
fun GrainSilosScreen(
    grainIndex: Int,
    onSiloClick: (String) -> Unit,
    onBackClick: () -> Unit
) {
    val grano = GRANOS_APP.getOrNull(grainIndex) ?: ""
    val silos = SilosDataManagerBaseDeDatos.silosList
    val grainSilos = if (grano.isBlank()) emptyList() else silos.filter { it.tipoGrano.equals(grano, ignoreCase = true) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
    ) {
        // ENCABEZADO CON BOTÓN REGRESAR
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = onBackClick,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                    contentDescription = "Regresar",
                    tint = Color.White
                )
            }
            Spacer(modifier = Modifier.width(8.dp))
            Text(
                text = "${AppStateBaseDeDatos.t("SILOS")}: ${if (grano.isNotBlank()) AppStateBaseDeDatos.t(grano).uppercase() else "—"}",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Black,
                color = Color.White,
                letterSpacing = (-0.5).sp
            )
        }

        if (grano.isBlank() || grainSilos.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(bottom = 100.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = AppStateBaseDeDatos.t("No hay granos registrados para analizar"),
                    style = MaterialTheme.typography.bodyLarge,
                    color = AgrilionTokens.Zinc400
                )
            }
        } else {
            LazyColumn(
                contentPadding = PaddingValues(bottom = 100.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                items(grainSilos) { silo ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp)
                            .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard)
                            .clickable { onSiloClick(silo.id) },
                        shape = AgrilionTokens.RadiusCard,
                        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
                    ) {
                        Row(
                            modifier = Modifier.padding(20.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = silo.nombre,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    text = "${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(silo.tipoGrano)} · ${silo.toneladas} TN",
                                    color = AgrilionTokens.Zinc400,
                                    fontSize = 13.sp
                                )
                                if (silo.ubicacion.isNotBlank()) {
                                    Text(
                                        text = "${AppStateBaseDeDatos.t("Ubicación")}: ${silo.ubicacion}",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = AgrilionTokens.Zinc500
                                    )
                                }
                            }

                            Box(
                                modifier = Modifier
                                    .size(12.dp)
                                    .background(silo.estado.color, CircleShape)
                            )
                        }
                    }
                }
            }
        }
    }
}
