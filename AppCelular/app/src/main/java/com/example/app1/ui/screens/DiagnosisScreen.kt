package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
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
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens

@Composable
fun DiagnosisScreen() {
    var searchQuery by remember { mutableStateOf("") }
    
    val silosList = SilosDataManagerBaseDeDatos.silosList
    val isLoading = SilosDataManagerBaseDeDatos.isLoading
    val error = SilosDataManagerBaseDeDatos.error
    val filteredSilos = if (searchQuery.isBlank()) {
        silosList
    } else {
        silosList.filter { it.nombre.contains(searchQuery, ignoreCase = true) || it.id.contains(searchQuery) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
    ) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            placeholder = { Text(AppStateBaseDeDatos.t("Busca tu silobolsa"), color = AgrilionTokens.Zinc400) },
            trailingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = AgrilionTokens.Zinc400) },
            shape = RoundedCornerShape(24.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = AgrilionTokens.Emerald500,
                unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                focusedContainerColor = AgrilionTokens.SurfaceDark1,
                unfocusedContainerColor = AgrilionTokens.SurfaceDark1
            )
        )

        if (silosList.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(bottom = 100.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    if (isLoading) {
                        CircularProgressIndicator(color = AgrilionTokens.Emerald500)
                        Spacer(Modifier.height(12.dp))
                    }
                    Text(
                        text = error ?: "No hay silos registrados para diagnosticar",
                        color = if (error != null) AgrilionTokens.Critical else AgrilionTokens.Zinc400
                    )
                }
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxWidth()) {
                items(filteredSilos) { silo ->
                    DiagnosisItem(silo)
                }
            }
        }
    }
}

@Composable
fun DiagnosisItem(silo: SilobolsaBaseDeDatos) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard),
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = silo.nombre,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(silo.estado.color, CircleShape)
                )
            }
            
            Text(
                text = "${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(silo.tipoGrano)}",
                style = MaterialTheme.typography.bodySmall,
                color = AgrilionTokens.Zinc400
            )
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = AgrilionTokens.BorderSubtle)
            
            Text(
                text = AppStateBaseDeDatos.t("DIAGNÓSTICO PREDICTIVO IA"),
                style = AgrilionTokens.LabelSmallMuted,
                color = if (silo.tendenciaCritica) AgrilionTokens.Critical else AgrilionTokens.Emerald500
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = silo.diagnosticoSemanal,
                style = MaterialTheme.typography.bodyMedium,
                color = Color.White,
                lineHeight = 20.sp
            )
        }
    }
}
