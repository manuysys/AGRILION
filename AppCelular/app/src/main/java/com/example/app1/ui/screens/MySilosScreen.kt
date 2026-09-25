package com.example.app1.ui.screens

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.SilobolsaBaseDeDatos

@Composable
fun MySilosScreen(onSiloClick: (String) -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    
    val silosList = SilosDataManagerBaseDeDatos.silosList
    
    val filteredSilos = if (searchQuery.isBlank()) {
        silosList
    } else {
        silosList.filter { it.nombre.contains(searchQuery, ignoreCase = true) || it.id.contains(searchQuery) }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text(AppStateBaseDeDatos.t("Busca tu silobolsa")) },
            trailingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            shape = RoundedCornerShape(24.dp)
        )
        
        Spacer(modifier = Modifier.height(16.dp))

        if (silosList.isEmpty()) {
            Box(
                modifier = Modifier.fillMaxSize().padding(bottom = 100.dp),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    text = "No hay silobolsas registradas",
                    style = MaterialTheme.typography.bodyLarge,
                    color = Color.Gray
                )
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxWidth()) {
                items(filteredSilos) { silo ->
                    SiloCardWithMenu(
                        silo = silo,
                        onSiloClick = { onSiloClick(silo.id) },
                        onDelete = { SilosDataManagerBaseDeDatos.silosList.remove(silo) }
                    )
                }
            }
        }
    }
}

@Composable
fun SiloCardWithMenu(silo: SilobolsaBaseDeDatos, onSiloClick: () -> Unit, onDelete: () -> Unit) {
    var showMenu by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .clickable { onSiloClick() },
        colors = CardDefaults.cardColors(
            containerColor = if (silo.estado == EstadoSilo.CRITICO) Color(0xFFFFEBEE) else Color.White
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = silo.nombre,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold,
                    color = if (silo.estado == EstadoSilo.CRITICO) Color.Red else Color.Unspecified
                )
                Text("${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(silo.tipoGrano)}")
                if (silo.ubicacion.isNotBlank()) {
                    Text("${AppStateBaseDeDatos.t("Ubicación")}: ${silo.ubicacion}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                }
            }

            Box {
                IconButton(onClick = { showMenu = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "Opciones")
                }
                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(AppStateBaseDeDatos.t("Editar datos")) },
                        onClick = { 
                            showMenu = false
                            showEditDialog = true 
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(AppStateBaseDeDatos.t("Eliminar"), color = Color.Red) },
                        onClick = { 
                            showMenu = false
                            onDelete() 
                        }
                    )
                }
            }
        }
    }

    if (showEditDialog) {
        EditSiloDialog(
            silo = silo,
            onDismiss = { showEditDialog = false },
            onConfirm = { updatedSilo ->
                val index = SilosDataManagerBaseDeDatos.silosList.indexOf(silo)
                if (index != -1) {
                    SilosDataManagerBaseDeDatos.silosList[index] = updatedSilo
                }
                showEditDialog = false
            }
        )
    }
}

@Composable
fun EditSiloDialog(silo: SilobolsaBaseDeDatos, onDismiss: () -> Unit, onConfirm: (SilobolsaBaseDeDatos) -> Unit) {
    var nombreSilo by remember { mutableStateOf(silo.nombre) }
    var ubicacionSilo by remember { mutableStateOf(silo.ubicacion) }
    var granoSeleccionado by remember { mutableStateOf(silo.tipoGrano) }
    val granos = listOf("Trigo", "Maíz", "Soja", "Cebada", "Girasol")
    var expandedGrano by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(24.dp),
            color = Color.White
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text(AppStateBaseDeDatos.t("Editar Silobolsa"), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = null) }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = nombreSilo,
                    onValueChange = { nombreSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Nombre")) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(12.dp))

                // REQUERIMIENTO 1: AÑADIDO EDITAR UBICACIÓN
                OutlinedTextField(
                    value = ubicacionSilo,
                    onValueChange = { ubicacionSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Ubicación")) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    trailingIcon = { Icon(Icons.Default.Map, contentDescription = null, tint = Color.Gray) }
                )

                Spacer(modifier = Modifier.height(12.dp))

                Box {
                    OutlinedButton(onClick = { expandedGrano = true }, modifier = Modifier.fillMaxWidth()) {
                        Text("${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(granoSeleccionado)}")
                    }
                    DropdownMenu(expanded = expandedGrano, onDismissRequest = { expandedGrano = false }) {
                        granos.forEach { g ->
                            DropdownMenuItem(text = { Text(AppStateBaseDeDatos.t(g)) }, onClick = {
                                granoSeleccionado = g
                                expandedGrano = false
                            })
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = { 
                        onConfirm(silo.copy(
                            nombre = nombreSilo, 
                            tipoGrano = granoSeleccionado,
                            ubicacion = ubicacionSilo
                        )) 
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(AppStateBaseDeDatos.t("Guardar"))
                }
            }
        }
    }
}
