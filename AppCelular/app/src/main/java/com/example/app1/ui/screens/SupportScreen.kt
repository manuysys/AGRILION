package com.example.app1.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowDropDown
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.app1.R
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens

@Composable
fun SupportScreen() {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    var faqExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .border(width = 1.dp, color = AgrilionTokens.BorderSubtle, shape = AgrilionTokens.RadiusCard)
                .clickable { faqExpanded = !faqExpanded },
            shape = AgrilionTokens.RadiusCard,
            colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        stringResource(R.string.faq_password_question),
                        modifier = Modifier.weight(1f),
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = AgrilionTokens.Zinc400)
                }
                if (faqExpanded) {
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        stringResource(R.string.faq_password_answer),
                        style = MaterialTheme.typography.bodySmall,
                        color = AgrilionTokens.Zinc400
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = AppStateBaseDeDatos.t("CONTACTO DE SOPORTE"),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Black,
            color = Color.White,
            letterSpacing = (-0.5).sp
        )
        Spacer(modifier = Modifier.height(8.dp))
        
        ListItem(
            headlineContent = { Text(AppStateBaseDeDatos.t("Correo Electrónico"), color = Color.White, fontWeight = FontWeight.Bold) },
            supportingContent = { Text(stringResource(R.string.support_email), color = AgrilionTokens.Zinc400) },
            leadingContent = { Icon(Icons.Default.Email, contentDescription = null, tint = AgrilionTokens.Emerald500) },
            colors = ListItemDefaults.colors(containerColor = Color.Transparent),
            modifier = Modifier.clickable {
                val intent = Intent(Intent.ACTION_SENDTO).apply {
                    data = Uri.parse("mailto:${context.getString(R.string.support_email)}")
                }
                context.startActivity(intent)
            }
        )

        HorizontalDivider(color = AgrilionTokens.BorderFaint)

        ListItem(
            headlineContent = { Text(AppStateBaseDeDatos.t("Teléfono"), color = Color.White, fontWeight = FontWeight.Bold) },
            supportingContent = { Text(stringResource(R.string.support_phone), color = AgrilionTokens.Zinc400) },
            leadingContent = { Icon(Icons.Default.Phone, contentDescription = null, tint = AgrilionTokens.Emerald500) },
            colors = ListItemDefaults.colors(containerColor = Color.Transparent),
            modifier = Modifier.clickable {
                val intent = Intent(Intent.ACTION_DIAL).apply {
                    data = Uri.parse("tel:${context.getString(R.string.support_phone)}")
                }
                context.startActivity(intent)
            }
        )
        Spacer(modifier = Modifier.height(32.dp))
    }
}
