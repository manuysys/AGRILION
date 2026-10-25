package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.example.app1.data.AuthManager
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens
import kotlinx.coroutines.launch

@Composable
fun MySilosScreen(onSiloClick: (String) -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

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
            modifier = Modifier.fillMaxWidth(),
            label = { Text(AppStateBaseDeDatos.t("Busca tu silobolsa"), color = AgrilionTokens.Zinc400) },
            trailingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = AgrilionTokens.Zinc400) },
            shape = RoundedCornerShape(24.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = AgrilionTokens.Emerald500,
                unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                focusedContainerColor = AgrilionTokens.SurfaceDark1,
                unfocusedContainerColor = AgrilionTokens.SurfaceDark1
            )
        )
        
        Spacer(modifier = Modifier.height(16.dp))

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
                        text = error ?: "No hay silobolsas registradas",
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (error != null) AgrilionTokens.Critical else AgrilionTokens.Zinc400
                    )
                }
            }
        } else {
            LazyColumn(modifier = Modifier.fillMaxWidth()) {
                items(filteredSilos) { silo ->
                    SiloCardWithMenu(
                        silo = silo,
                        onSiloClick = { onSiloClick(silo.id) },
                        onEdit = { updated ->
                            scope.launch {
                                try {
                                    AuthManager.getInstance().updateSilo(
                                        siloId = updated.id,
                                        name = updated.nombre,
                                        grainType = updated.tipoGrano,
                                        location = updated.ubicacion,
                                        tons = updated.toneladas
                                    )
                                } catch (_: Exception) {
                                    // Silo sin documento en Firestore.
                                }
                                SilosDataManagerBaseDeDatos.refresh()
                            }
                        },
                        onDelete = {
                            scope.launch {
                                try {
                                    AuthManager.getInstance().deleteSilo(silo.id)
                                } catch (_: Exception) {
                                    // Silo sin documento en Firestore (solo sensor).
                                }
                                SilosDataManagerBaseDeDatos.refresh()
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun SiloCardWithMenu(
    silo: SilobolsaBaseDeDatos,
    onSiloClick: () -> Unit,
    onEdit: (SilobolsaBaseDeDatos) -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .border(
                width = 1.dp,
                color = if (silo.estado == EstadoSilo.CRITICO) AgrilionTokens.Critical else AgrilionTokens.BorderSubtle,
                shape = AgrilionTokens.RadiusCard
            )
            .clickable { onSiloClick() },
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(
            containerColor = if (silo.estado == EstadoSilo.CRITICO) AgrilionTokens.CriticalBg else AgrilionTokens.SurfaceDark1
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
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
                    text = "${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(silo.tipoGrano)}",
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
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "T ${"%.1f".format(silo.temperatura)}°C",
                        color = AgrilionTokens.Emerald500,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "H ${"%.1f".format(silo.humedad)}%",
                        color = AgrilionTokens.Emerald500,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "CO₂ ${silo.co2.toInt()} ppm",
                        color = if (silo.co2 > 1200) AgrilionTokens.Critical else AgrilionTokens.Warn,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    "Riesgo ${silo.riskScore}/100 · ${silo.ultimaActualizacion}",
                    color = AgrilionTokens.Zinc500,
                    fontSize = 10.sp
                )
            }

            Box {
                IconButton(onClick = { showMenu = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "Opciones", tint = AgrilionTokens.Zinc400)
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
                        text = { Text(AppStateBaseDeDatos.t("Eliminar"), color = AgrilionTokens.Critical) },
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
                onEdit(updatedSilo)
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
            shape = AgrilionTokens.RadiusCard,
            color = AgrilionTokens.SurfaceDark1,
            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        AppStateBaseDeDatos.t("EDITAR SILOBOLSA"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = (-0.5).sp
                    )
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = null, tint = AgrilionTokens.Zinc400) }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = nombreSilo,
                    onValueChange = { nombreSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Nombre"), color = AgrilionTokens.Zinc400) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AgrilionTokens.Emerald500,
                        unfocusedBorderColor = AgrilionTokens.BorderSubtle
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = ubicacionSilo,
                    onValueChange = { ubicacionSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Ubicación"), color = AgrilionTokens.Zinc400) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    trailingIcon = { Icon(Icons.Default.Map, contentDescription = null, tint = AgrilionTokens.Zinc400) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AgrilionTokens.Emerald500,
                        unfocusedBorderColor = AgrilionTokens.BorderSubtle
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                Box {
                    OutlinedButton(
                        onClick = { expandedGrano = true },
                        modifier = Modifier.fillMaxWidth(),
                        border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
                    ) {
                        Text("${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(granoSeleccionado)}", color = Color.White)
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
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600)
                ) {
                    Text(AppStateBaseDeDatos.t("Guardar"), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
