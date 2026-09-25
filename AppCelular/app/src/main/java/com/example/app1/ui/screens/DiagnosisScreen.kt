package com.example.app1.ui.screens

import androidx.compose.foundation.background
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
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SilosDataManagerBaseDeDatos

@Composable
fun DiagnosisScreen() {
    var searchQuery by remember { mutableStateOf("") }
    
    // Lista vinculada al Backend/IA
    val silosList = SilosDataManagerBaseDeDatos.silosList
    val filteredSilos = if (searchQuery.isBlank()) {
        silosList
    } else {
        silosList.filter { it.nombre.contains(searchQuery, ignoreCase = true) || it.id.contains(searchQuery) }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        
        // REQUERIMIENTO 4: Barra de búsqueda centrada arriba (sin segundo título)
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            placeholder = { Text(AppStateBaseDeDatos.t("Busca tu silobolsa")) },
            trailingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            shape = RoundedCornerShape(24.dp),
            singleLine = true
        )

        LazyColumn(modifier = Modifier.fillMaxWidth()) {
            items(filteredSilos) { silo ->
                DiagnosisItem(silo)
            }
        }
    }
}

@Composable
fun DiagnosisItem(silo: com.example.app1.data.SilobolsaBaseDeDatos) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF9F9F9))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = silo.nombre,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                // Indicador visual de estado
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .background(silo.estado.color, CircleShape)
                )
            }
            
            Text(
                text = "${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(silo.tipoGrano)}",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray
            )
            
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp), color = Color.LightGray.copy(alpha = 0.5f))
            
            Text(
                text = AppStateBaseDeDatos.t("Diagnóstico"),
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.Bold,
                color = if (silo.tendenciaCritica) Color.Red else MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // REQUERIMIENTO 4: Diagnóstico generado por la IA
            Text(
                text = silo.diagnosticoSemanal,
                style = MaterialTheme.typography.bodyMedium,
                lineHeight = 20.sp
            )
        }
    }
}
