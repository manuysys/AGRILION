package com.example.app1.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens

/**
 * Chip indicador "MODO DEMO" para la UI principal (Dashboard).
 * Fondo amarillo mostaza #E1AD01 con texto oscuro #141414.
 */
@Composable
fun DemoModeChip(modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.border(
            width = 1.dp,
            color = Color(0xFFE1AD01).copy(alpha = 0.6f),
            shape = RoundedCornerShape(50)
        ),
        color = Color(0xFFE1AD01),
        shape = RoundedCornerShape(50)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Box(
                modifier = Modifier
                    .size(6.dp)
                    .background(Color(0xFF141414), shape = androidx.compose.foundation.shape.CircleShape)
            )
            Spacer(modifier = Modifier.width(6.dp))
            Text(
                text = "MODO DEMO",
                fontSize = 10.sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
                color = Color(0xFF141414)
            )
        }
    }
}

/**
 * Diálogo de aviso de acción bloqueada durante el Modo Demo.
 */
@Composable
fun DemoAccountRequiredDialog(
    onDismiss: () -> Unit,
    onGoToLogin: () -> Unit = { AppStateBaseDeDatos.exitDemoMode() }
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = AppStateBaseDeDatos.t("Necesitás una cuenta para hacer esto"),
                fontWeight = FontWeight.Bold,
                color = Color.White
            )
        },
        text = {
            Text(
                text = AppStateBaseDeDatos.t("Estás explorando la app en Modo Demo. Para guardar, editar o modificar datos necesitás iniciar sesión con una cuenta real."),
                color = AgrilionTokens.Zinc400,
                fontSize = 14.sp
            )
        },
        confirmButton = {
            Button(
                onClick = onGoToLogin,
                colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600),
                shape = RoundedCornerShape(10.dp)
            ) {
                Text(AppStateBaseDeDatos.t("Ir a Iniciar Sesión"), fontWeight = FontWeight.Bold)
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text(AppStateBaseDeDatos.t("Entendido"), color = AgrilionTokens.Zinc400)
            }
        },
        containerColor = AgrilionTokens.SurfaceDark1,
        shape = AgrilionTokens.RadiusCard
    )
}
