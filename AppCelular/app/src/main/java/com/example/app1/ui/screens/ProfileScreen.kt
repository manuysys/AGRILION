package com.example.app1.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.example.app1.data.AppStateBaseDeDatos

@Composable
fun ProfileScreen() {
    val scrollState = rememberScrollState()
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    var isEditing by remember { mutableStateOf(false) }
    
    var nombre by remember { mutableStateOf(AppStateBaseDeDatos.userName) }
    var gmail by remember { mutableStateOf(AppStateBaseDeDatos.userEmail) }
    var telefono by remember { mutableStateOf("+54 9 11 ...") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        Text(AppStateBaseDeDatos.t("Mi Perfil"), style = MaterialTheme.typography.headlineMedium)
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = nombre, 
            onValueChange = { if (isEditing) nombre = it }, 
            label = { Text(AppStateBaseDeDatos.t("Nombre")) }, 
            modifier = Modifier.fillMaxWidth(),
            readOnly = !isEditing
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = gmail, 
            onValueChange = { if (isEditing) gmail = it }, 
            label = { Text("Email") }, 
            modifier = Modifier.fillMaxWidth(),
            readOnly = !isEditing
        )
        Spacer(modifier = Modifier.height(8.dp))
        OutlinedTextField(
            value = telefono, 
            onValueChange = { if (isEditing) telefono = it }, 
            label = { Text(AppStateBaseDeDatos.t("Teléfono")) }, 
            modifier = Modifier.fillMaxWidth(),
            readOnly = !isEditing
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = { 
                if (isEditing) {
                    AppStateBaseDeDatos.userName = nombre
                    AppStateBaseDeDatos.userEmail = gmail
                }
                isEditing = !isEditing 
            }, 
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(if (isEditing) AppStateBaseDeDatos.t("Guardar datos") else AppStateBaseDeDatos.t("Editar datos"))
        }
        
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = { /* Acción */ }, modifier = Modifier.fillMaxWidth()) {
            Text(AppStateBaseDeDatos.t("Cambiar contraseña"))
        }
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = { showDeleteDialog = true },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Red)
        ) {
            Text(AppStateBaseDeDatos.t("Eliminar mi cuenta"), color = Color.White)
        }

        if (showDeleteDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteDialog = false },
                title = { Text("¿Estás seguro?") },
                text = { Text("Para borrar tu cuenta se enviará una solicitud a tu Gmail. Una vez confirmada allí, se eliminará permanentemente.") },
                confirmButton = {
                    TextButton(onClick = { 
                        showDeleteDialog = false 
                    }) {
                        Text("Confirmar y enviar mail")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = false }) {
                        Text("Cancelar")
                    }
                }
            )
        }
        Spacer(modifier = Modifier.height(32.dp))
    }
}
