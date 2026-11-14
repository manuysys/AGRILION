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

    var isEditing by remember { mutableStateOf(false) }

    var nombre by remember { mutableStateOf(AppStateBaseDeDatos.userName) }
    var gmail by remember { mutableStateOf(AppStateBaseDeDatos.userEmail) }
    var telefono by remember { mutableStateOf("") }
    var resetMessage by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        try {
            val profile = AuthManager.getInstance().getUserProfile()
            profile?.get("phone")?.toString()?.takeIf { it.isNotBlank() }?.let { telefono = it }
            profile?.get("name")?.toString()?.takeIf { it.isNotBlank() }?.let { nombre = it }
        } catch (_: Exception) {
            // El perfil local sigue siendo válido.
        }
    }

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
            onValueChange = { },
            label = { Text("Email", color = AgrilionTokens.Zinc400) },
            modifier = Modifier.fillMaxWidth(),
            readOnly = true,
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
                            AuthManager.getInstance().updateUserProfile(nombre, telefono)
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
            onClick = {
                val email = AuthManager.getInstance().currentUser?.email
                    ?: AppStateBaseDeDatos.userEmail
                if (email.isBlank()) {
                    resetMessage = "No hay un email asociado a la cuenta."
                } else {
                    scope.launch {
                        try {
                            AuthManager.getInstance().sendPasswordReset(email)
                            resetMessage = "Te enviamos un email para restablecer la contraseña."
                        } catch (e: Exception) {
                            resetMessage = "No se pudo enviar el email: ${e.message ?: "error desconocido"}"
                        }
                    }
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
        ) {
            Text(AppStateBaseDeDatos.t("Cambiar contraseña"), color = Color.White)
        }
        if (resetMessage != null) {
            Text(
                text = resetMessage!!,
                color = if (resetMessage!!.startsWith("Te enviamos")) AgrilionTokens.Emerald500 else AgrilionTokens.Critical,
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 6.dp)
            )
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

        Spacer(modifier = Modifier.height(32.dp))
    }
}
