package com.example.app1.data

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue

/**
 * Singleton para manejar el estado global de la aplicación.
 * Optimizado para evitar fallos de inicialización.
 */
object AppStateBaseDeDatos {
    var currentLanguage by mutableStateOf("Español")
    var unidadPesoSeleccionada by mutableStateOf("Toneladas (TN)")
    var userName by mutableStateOf("Nombre Apellido")
    var userEmail by mutableStateOf("gmail@gmail.com")
    var isUserLoggedIn by mutableStateOf(true)

    private val translations = mapOf(
        "Inicio" to mapOf("Español" to "Inicio", "English" to "Home", "Português" to "Início"),
        "Mis Silos" to mapOf("Español" to "Mis Silos", "English" to "My Silos", "Português" to "Meus Silos"),
        "Diagnóstico" to mapOf("Español" to "Diagnóstico", "English" to "Diagnosis", "Português" to "Diagnóstico"),
        "Asistente" to mapOf("Español" to "Asistente", "English" to "Assistant", "Português" to "Assistente"),
        "Configuración" to mapOf("Español" to "Configuración", "English" to "Settings", "Português" to "Configurações"),
        "Ayuda & Soporte" to mapOf("Español" to "Ayuda & Soporte", "English" to "Help & Support", "Português" to "Ajuda & Suporte"),
        "Recomendaciones" to mapOf("Español" to "Recomendaciones", "English" to "Recommendations", "Português" to "Recomendações"),
        "Mi Perfil" to mapOf("Español" to "Mi Perfil", "English" to "My Profile", "Português" to "Meu Perfil"),
        "Dashboard" to mapOf("Español" to "Dashboard", "English" to "Dashboard", "Português" to "Painel"),
        "Notificaciones" to mapOf("Español" to "Notificaciones", "English" to "Notifications", "Português" to "Notificações"),
        "Idioma" to mapOf("Español" to "Idioma", "English" to "Language", "Português" to "Idioma"),
        "Unidades de Medida" to mapOf("Español" to "Unidades de Medida", "English" to "Units of Measure", "Português" to "Unidades de Medida"),
        "Peso" to mapOf("Español" to "Peso", "English" to "Weight", "Português" to "Peso"),
        "Presión" to mapOf("Español" to "Presión", "English" to "Pressure", "Português" to "Pressão"),
        "Temperatura" to mapOf("Español" to "Temperatura", "English" to "Temperature", "Português" to "Temperatura"),
        "Humedad" to mapOf("Español" to "Humedad", "English" to "Humidity", "Português" to "Umidade"),
        "Alertas" to mapOf("Español" to "Alertas", "English" to "Alerts", "Português" to "Alertas"),
        "Recordatorios" to mapOf("Español" to "Recordatorios", "English" to "Reminders", "Português" to "Lembretes"),
        "Informativos" to mapOf("Español" to "Informativos", "English" to "Information", "Português" to "Informativos"),
        "Preguntame" to mapOf("Español" to "Preguntame", "English" to "Ask me", "Português" to "Pergunte-me"),
        "Tus Conversaciones" to mapOf("Español" to "Tus Conversaciones", "English" to "Your Conversations", "Português" to "Suas Conversas"),
        "Empezar una conversación" to mapOf("Español" to "Empezar una conversación", "English" to "Start a conversation", "Português" to "Iniciar uma conversa"),
        "Bueno" to mapOf("Español" to "Bueno", "English" to "Good", "Português" to "Bom"),
        "Crítico" to mapOf("Español" to "Crítico", "English" to "Critical", "Português" to "Crítico"),
        "Alerta" to mapOf("Español" to "Alerta", "English" to "Alert", "Português" to "Alerta"),
        "Sin Datos" to mapOf("Español" to "Sin Datos", "English" to "No Data", "Português" to "Sem Dados"),
        "Trigo" to mapOf("Español" to "Trigo", "English" to "Wheat", "Português" to "Trigo"),
        "Maíz" to mapOf("Español" to "Maíz", "English" to "Corn", "Português" to "Milho"),
        "Soja" to mapOf("Español" to "Soja", "English" to "Soybean", "Português" to "Soja"),
        "Girasol" to mapOf("Español" to "Girasol", "English" to "Sunflower", "Português" to "Girassol"),
        "Cebada" to mapOf("Español" to "Cebada", "English" to "Barley", "Português" to "Cevada"),
        "Ubicación" to mapOf("Español" to "Ubicación", "English" to "Location", "Português" to "Localização"),
        "Cotización de Granos (BCR)" to mapOf("Español" to "Cotización de Granos (BCR)", "English" to "Grain Pricing (BCR)", "Português" to "Cotação de Grãos (BCR)"),
        "Grano" to mapOf("Español" to "Grano", "English" to "Grain", "Português" to "Grão"),
        "Pesos" to mapOf("Español" to "Pesos", "English" to "Pesos", "Português" to "Pesos"),
        "Nombre" to mapOf("Español" to "Nombre", "English" to "Name", "Português" to "Nome"),
        "Teléfono" to mapOf("Español" to "Teléfono", "English" to "Phone", "Português" to "Telefone"),
        "Guardar datos" to mapOf("Español" to "Guardar datos", "English" to "Save data", "Português" to "Salvar dados"),
        "Editar datos" to mapOf("Español" to "Editar datos", "English" to "Edit data", "Português" to "Editar dados"),
        "Cambiar contraseña" to mapOf("Español" to "Cambiar contraseña", "English" to "Change password", "Português" to "Alterar senha"),
        "Eliminar mi cuenta" to mapOf("Español" to "Eliminar mi cuenta", "English" to "Delete my account", "Português" to "Excluir minha cuenta"),
        "Busca tu silobolsa" to mapOf("Español" to "Busca tu silobolsa", "English" to "Search your silo", "Português" to "Procure seu silo"),
        "Nueva Silobolsa" to mapOf("Español" to "Nueva Silobolsa", "English" to "New Silo", "Português" to "Novo Silo"),
        "Guardar Silobolsa" to mapOf("Español" to "Guardar Silobolsa", "English" to "Save Silo", "Português" to "Salvar Silo"),
        "Toneladas (TN)" to mapOf("Español" to "Toneladas (TN)", "English" to "Tons (TN)", "Português" to "Toneladas (TN)"),
        "Kilogramos (Kg)" to mapOf("Español" to "Kilogramos (Kg)", "English" to "Kilograms (Kg)", "Português" to "Quilogramas (Kg)"),
        "Buenas Noches" to mapOf("Español" to "Buenas Noches", "English" to "Good Night", "Português" to "Boa Noite"),
        "Buenos Días" to mapOf("Español" to "Buenos Días", "English" to "Good Morning", "Português" to "Bom Dia"),
        "Buenas Tardes" to mapOf("Español" to "Buenas Tardes", "English" to "Good Afternoon", "Português" to "Boa Tarde"),
        "Mi nombre es Lion. Aquí puedes consultarme tus dudas" to mapOf("Español" to "Mi nombre es Lion. Aquí puedes consultarme tus dudas", "English" to "My name is Lion. Here you can ask me your questions", "Português" to "Meu nome é Lion. Aqui você pode tirar suas dúvidas"),
        "Editar nombre" to mapOf("Español" to "Editar nombre", "English" to "Edit name", "Português" to "Editar nome"),
        "Eliminar" to mapOf("Español" to "Eliminar", "English" to "Delete", "Português" to "Excluir"),
        "Guardar" to mapOf("Español" to "Guardar", "English" to "Save", "Português" to "Salvar"),
        "Cancelar" to mapOf("Español" to "Cancelar", "English" to "Cancel", "Português" to "Cancelar"),
        "Detalle de Silobolsa" to mapOf("Español" to "Detalle de Silobolsa", "English" to "Silo Details", "Português" to "Detalhes do Silo"),
        "Detalle Técnico" to mapOf("Español" to "Detalle Técnico", "English" to "Technical Details", "Português" to "Detalhes Técnicos"),
        "ALERTA: Hay silobolsas que no están enviando datos." to mapOf("Español" to "ALERTA: Hay silobolsas que no están enviando datos.", "English" to "ALERT: Some silos are not sending data.", "Português" to "ALERTA: Existem silos que não están enviando dados."),
        "Detalle" to mapOf("Español" to "Detalle", "English" to "Detail", "Português" to "Detalhe"),
        "Recomendaciones" to mapOf("Español" to "Recomendaciones", "English" to "Recommendations", "Português" to "Recomendações")
    )

    fun t(key: String): String {
        return translations[key]?.get(currentLanguage) ?: key
    }

    fun convertirToneladas(toneladas: Double): Double {
        return if (unidadPesoSeleccionada == "Kilogramos (Kg)") toneladas * 1000.0 else toneladas
    }
}
