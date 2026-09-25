package com.example.app1.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.R
import com.example.app1.data.AuthManager
import kotlinx.coroutines.launch

/**
 * AGRILION — LoginScreen
 *
 * Pantalla de autenticación con Firebase Auth.
 * Permite login y registro con email + password.
 *
 * Diseño: gradiente verde oscuro, logo centrado, formularios limpios.
 */
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    authManager: AuthManager = AuthManager.getInstance(),
) {
    // ─── State ─────────────────────────────────────────────────────────────
    var isLoginMode by remember { mutableStateOf(true) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    var phone by remember { mutableStateOf("") }
    var company by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var successMessage by remember { mutableStateOf<String?>(null) }

    val scope = rememberCoroutineScope()

    // ─── Colores ───────────────────────────────────────────────────────────
    val greenGradient = Brush.verticalGradient(
        colors = listOf(
            Color(0xFF0B3D2E),
            Color(0xFF14532D),
            Color(0xFF0B3D2E),
        )
    )
    val accentGreen = Color(0xFF22C55E)
    val errorRed = Color(0xFFEF4444)
    val inputBg = Color.White.copy(alpha = 0.12f)

    // ─── Helpers ───────────────────────────────────────────────────────────
    fun translateFirebaseError(code: String): String = when (code) {
        "ERROR_INVALID_EMAIL", "FirebaseAuthInvalidCredentialsException" ->
            "El email no tiene un formato válido"
        "ERROR_WRONG_PASSWORD" -> "Contraseña incorrecta"
        "ERROR_USER_NOT_FOUND" -> "No existe una cuenta con este email"
        "ERROR_EMAIL_ALREADY_IN_USE" -> "Este email ya está registrado"
        "ERROR_WEAK_PASSWORD" -> "La contraseña debe tener al menos 6 caracteres"
        "ERROR_NETWORK_REQUEST_FAILED" -> "Sin conexión a internet"
        "ERROR_TOO_MANY_REQUESTS" -> "Demasiados intentos. Esperá unos minutos"
        "ERROR_USER_DISABLED" -> "Esta cuenta fue deshabilitada"
        else -> "Error: $code"
    }

    fun handleAuth() {
        if (email.isBlank() || password.isBlank()) {
            errorMessage = "Completá email y contraseña"
            return
        }
        if (!isLoginMode && name.isBlank()) {
            errorMessage = "Completá tu nombre"
            return
        }
        if (password.length < 6) {
            errorMessage = "La contraseña debe tener al menos 6 caracteres"
            return
        }

        isLoading = true
        errorMessage = null
        successMessage = null

        scope.launch {
            try {
                if (isLoginMode) {
                    authManager.signIn(email.trim(), password)
                    onLoginSuccess()
                } else {
                    authManager.signUp(
                        email = email.trim(),
                        password = password,
                        name = name.trim(),
                        phone = phone.trim(),
                        company = company.trim(),
                    )
                    successMessage = "¡Cuenta creada! Verificá tu email para confirmar."
                    // Después del registro exitoso, logueamos automáticamente
                    authManager.signIn(email.trim(), password)
                    onLoginSuccess()
                }
            } catch (e: Exception) {
                val msg = e.message ?: e.javaClass.simpleName
                errorMessage = translateFirebaseError(msg)
                isLoading = false
            }
        }
    }

    // ─── UI ────────────────────────────────────────────────────────────────
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(greenGradient)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 32.dp, vertical = 48.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center,
        ) {
            // ─── Logo ──────────────────────────────────────────────────────
            Image(
                painter = painterResource(id = R.drawable.logo_app_white),
                contentDescription = "Agrilion Logo",
                modifier = Modifier
                    .size(120.dp)
                    .padding(bottom = 16.dp),
            )

            Text(
                text = "AGRILION",
                color = Color.White,
                fontSize = 36.sp,
                style = MaterialTheme.typography.headlineLarge,
                modifier = Modifier.padding(bottom = 8.dp),
            )

            Text(
                text = if (isLoginMode) "Monitoreo inteligente de silobolsas"
                       else "Creá tu cuenta gratuita",
                color = Color.White.copy(alpha = 0.75f),
                fontSize = 15.sp,
                modifier = Modifier.padding(bottom = 40.dp),
            )

            // ─── Card del formulario ───────────────────────────────────────
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = Color.White.copy(alpha = 0.08f)),
            ) {
                Column(
                    modifier = Modifier.padding(24.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    // ─── Toggle Login / Registro ───────────────────────────
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly,
                    ) {
                        FilterChip(
                            selected = isLoginMode,
                            onClick = {
                                isLoginMode = true
                                errorMessage = null
                                successMessage = null
                            },
                            label = { Text("Iniciar sesión") },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = accentGreen,
                                selectedLabelColor = Color.White,
                            ),
                        )
                        FilterChip(
                            selected = !isLoginMode,
                            onClick = {
                                isLoginMode = false
                                errorMessage = null
                                successMessage = null
                            },
                            label = { Text("Registrarme") },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = accentGreen,
                                selectedLabelColor = Color.White,
                            ),
                        )
                    }

                    // ─── Email ─────────────────────────────────────────────
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it; errorMessage = null },
                        label = { Text("Email", color = Color.White.copy(alpha = 0.7f)) },
                        leadingIcon = {
                            Icon(Icons.Default.Email, null, tint = accentGreen)
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = accentGreen,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            cursorColor = accentGreen,
                            focusedContainerColor = inputBg,
                            unfocusedContainerColor = inputBg,
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    )

                    // ─── Password ──────────────────────────────────────────
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it; errorMessage = null },
                        label = { Text("Contraseña", color = Color.White.copy(alpha = 0.7f)) },
                        leadingIcon = {
                            Icon(Icons.Default.Lock, null, tint = accentGreen)
                        },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    if (passwordVisible) Icons.Default.VisibilityOff
                                    else Icons.Default.Visibility,
                                    null,
                                    tint = Color.White.copy(alpha = 0.7f),
                                )
                            }
                        },
                        singleLine = true,
                        visualTransformation = if (passwordVisible) VisualTransformation.None
                                               else PasswordVisualTransformation(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = accentGreen,
                            unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            cursorColor = accentGreen,
                            focusedContainerColor = inputBg,
                            unfocusedContainerColor = inputBg,
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth(),
                    )

                    // ─── Campos extra para registro ────────────────────────
                    if (!isLoginMode) {
                        OutlinedTextField(
                            value = name,
                            onValueChange = { name = it },
                            label = { Text("Nombre completo", color = Color.White.copy(alpha = 0.7f)) },
                            leadingIcon = {
                                Icon(Icons.Default.Person, null, tint = accentGreen)
                            },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = accentGreen,
                                unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                cursorColor = accentGreen,
                                focusedContainerColor = inputBg,
                                unfocusedContainerColor = inputBg,
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth(),
                        )

                        OutlinedTextField(
                            value = phone,
                            onValueChange = { phone = it },
                            label = { Text("Teléfono (opcional)", color = Color.White.copy(alpha = 0.7f)) },
                            leadingIcon = {
                                Icon(Icons.Default.Phone, null, tint = accentGreen)
                            },
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = accentGreen,
                                unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                cursorColor = accentGreen,
                                focusedContainerColor = inputBg,
                                unfocusedContainerColor = inputBg,
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth(),
                        )

                        OutlinedTextField(
                            value = company,
                            onValueChange = { company = it },
                            label = { Text("Empresa (opcional)", color = Color.White.copy(alpha = 0.7f)) },
                            leadingIcon = {
                                Icon(Icons.Default.Business, null, tint = accentGreen)
                            },
                            singleLine = true,
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = accentGreen,
                                unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                                focusedTextColor = Color.White,
                                unfocusedTextColor = Color.White,
                                cursorColor = accentGreen,
                                focusedContainerColor = inputBg,
                                unfocusedContainerColor = inputBg,
                            ),
                            shape = RoundedCornerShape(12.dp),
                            modifier = Modifier.fillMaxWidth(),
                        )
                    }

                    // ─── Mensajes ──────────────────────────────────────────
                    errorMessage?.let { msg ->
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = errorRed.copy(alpha = 0.15f),
                            ),
                            shape = RoundedCornerShape(10.dp),
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    Icons.Default.Error,
                                    null,
                                    tint = errorRed,
                                    modifier = Modifier.size(20.dp),
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(msg, color = Color.White, fontSize = 13.sp)
                            }
                        }
                    }

                    successMessage?.let { msg ->
                        Card(
                            colors = CardDefaults.cardColors(
                                containerColor = accentGreen.copy(alpha = 0.15f),
                            ),
                            shape = RoundedCornerShape(10.dp),
                        ) {
                            Row(
                                modifier = Modifier.padding(12.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    Icons.Default.CheckCircle,
                                    null,
                                    tint = accentGreen,
                                    modifier = Modifier.size(20.dp),
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(msg, color = Color.White, fontSize = 13.sp)
                            }
                        }
                    }

                    // ─── Botón principal ───────────────────────────────────
                    Button(
                        onClick = { handleAuth() },
                        enabled = !isLoading,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(52.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = accentGreen,
                            contentColor = Color.White,
                        ),
                        shape = RoundedCornerShape(12.dp),
                    ) {
                        if (isLoading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(22.dp),
                                strokeWidth = 2.dp,
                                color = Color.White,
                            )
                        } else {
                            Text(
                                text = if (isLoginMode) "Iniciar sesión" else "Crear cuenta",
                                fontSize = 16.sp,
                            )
                        }
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // ─── Footer ────────────────────────────────────────────────────
            Text(
                text = "Al continuar aceptás nuestros Términos y Política de Privacidad",
                color = Color.White.copy(alpha = 0.5f),
                fontSize = 12.sp,
                modifier = Modifier.padding(top = 16.dp),
            )
        }
    }
}
