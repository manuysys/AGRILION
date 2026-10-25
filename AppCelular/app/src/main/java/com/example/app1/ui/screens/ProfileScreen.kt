package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.AuthManager
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens
import kotlinx.coroutines.launch

@Composable
fun ProfileScreen() {
    val scrollState = rememberScrollState()
    val scope = rememberCoroutineScope()
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    var isEditing by remember { mutableStateOf(false) }
    
    var nombre by remember { mutableStateOf(AppStateBaseDeDatos.userName) }
    var gmail by remember { mutableStateOf(AppStateBaseDeDatos.userEmail) }
    var telefono by remember { mutableStateOf("+54 9 11 ...") }

    LaunchedEffect(AppStateBaseDeDatos.userName, isEditing) {
        if (!isEditing && AppStateBaseDeDatos.userName.isNotBlank()) {
            nombre = AppStateBaseDeDatos.userName
        }
    }
    LaunchedEffect(AppStateBaseDeDatos.userEmail, isEditing) {
        if (!isEditing && AppStateBaseDeDatos.userEmail.isNotBlank()) {
            gmail = AppStateBaseDeDatos.userEmail
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        Text(
            text = AppStateBaseDeDatos.t("MIS DATOS"),
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Black,
            color = Color.White,
            letterSpacing = (-0.5).sp
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = nombre, 
            onValueChange = { if (isEditing) nombre = it }, 
            label = { Text(AppStateBaseDeDatos.t("Nombre"), color = AgrilionTokens.Zinc400) }, 
            modifier = Modifier.fillMaxWidth(),
            readOnly = !isEditing,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = AgrilionTokens.Emerald500,
                unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                focusedContainerColor = AgrilionTokens.SurfaceDark1,
                unfocusedContainerColor = AgrilionTokens.SurfaceDark1
            )
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = gmail, 
            onValueChange = { if (isEditing) gmail = it }, 
            label = { Text("Email", color = AgrilionTokens.Zinc400) }, 
            modifier = Modifier.fillMaxWidth(),
            readOnly = !isEditing,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = AgrilionTokens.Emerald500,
                unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                focusedContainerColor = AgrilionTokens.SurfaceDark1,
                unfocusedContainerColor = AgrilionTokens.SurfaceDark1
            )
        )
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = telefono, 
            onValueChange = { if (isEditing) telefono = it }, 
            label = { Text(AppStateBaseDeDatos.t("Teléfono"), color = AgrilionTokens.Zinc400) }, 
            modifier = Modifier.fillMaxWidth(),
            readOnly = !isEditing,
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = AgrilionTokens.Emerald500,
                unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                focusedContainerColor = AgrilionTokens.SurfaceDark1,
                unfocusedContainerColor = AgrilionTokens.SurfaceDark1
            )
        )

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = { 
                if (isEditing) {
                    AppStateBaseDeDatos.userName = nombre
                    AppStateBaseDeDatos.userEmail = gmail
                    scope.launch {
                        try {
                            AuthManager.getInstance().updateUserProfile(nombre)
                        } catch (_: Exception) {
                            // El dato local se conserva aunque falle Firestore.
                        }
                    }
                }
                isEditing = !isEditing 
            }, 
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600)
        ) {
            Text(if (isEditing) AppStateBaseDeDatos.t("Guardar datos") else AppStateBaseDeDatos.t("Editar datos"), fontWeight = FontWeight.Bold)
        }
        
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedButton(
            onClick = { /* Acción */ }, 
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
        ) {
            Text(AppStateBaseDeDatos.t("Cambiar contraseña"), color = Color.White)
        }
        Spacer(modifier = Modifier.height(10.dp))
        OutlinedButton(
            onClick = {
                SilosDataManagerBaseDeDatos.clear()
                AuthManager.getInstance().signOut()
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
        ) {
            Text("Cerrar sesión", color = Color.White)
        }
        Spacer(modifier = Modifier.height(16.dp))
        
        Button(
            onClick = { showDeleteDialog = true },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Critical)
        ) {
            Text(AppStateBaseDeDatos.t("Eliminar mi cuenta"), color = Color.White, fontWeight = FontWeight.Bold)
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
