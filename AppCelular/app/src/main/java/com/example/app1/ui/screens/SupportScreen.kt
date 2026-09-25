package com.example.app1.ui.screens

import android.content.Intent
import android.net.Uri
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import com.example.app1.R
import com.example.app1.data.AppStateBaseDeDatos

@Composable
fun SupportScreen() {
    val context = LocalContext.current
    val scrollState = rememberScrollState()
    var faqExpanded by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(scrollState)
    ) {
        // REQUERIMIENTO 5: Eliminado el segundo título redundante de "Ayuda & Soporte"

        Card(modifier = Modifier.fillMaxWidth().clickable { faqExpanded = !faqExpanded }) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(stringResource(R.string.faq_password_question), modifier = Modifier.weight(1f))
                    Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                }
                if (faqExpanded) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(stringResource(R.string.faq_password_answer), style = MaterialTheme.typography.bodySmall)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text(AppStateBaseDeDatos.t("Contacto de Soporte"), style = MaterialTheme.typography.titleLarge)
        
        ListItem(
            headlineContent = { Text(AppStateBaseDeDatos.t("Correo Electrónico")) },
            supportingContent = { Text(stringResource(R.string.support_email)) },
            leadingContent = { Icon(Icons.Default.Email, contentDescription = null) },
            modifier = Modifier.clickable {
                val intent = Intent(Intent.ACTION_SENDTO).apply {
                    data = Uri.parse("mailto:${context.getString(R.string.support_email)}")
                }
                context.startActivity(intent)
            }
        )

        ListItem(
            headlineContent = { Text(AppStateBaseDeDatos.t("Teléfono")) },
            supportingContent = { Text(stringResource(R.string.support_phone)) },
            leadingContent = { Icon(Icons.Default.Phone, contentDescription = null) },
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
