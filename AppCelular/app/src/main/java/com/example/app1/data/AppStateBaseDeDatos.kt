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
    var isDemoMode by mutableStateOf(false)

    fun enterDemoMode() {
        exitDemoMode()
        isDemoMode = true
        DemoData.loadDemoData()
    }

    fun exitDemoMode() {
        isDemoMode = false
        DemoData.purgeDemoData()
    }

    fun logout() {
        try {
            AuthManager.getInstance().signOut()
        } catch (_: Exception) {
            // Logged out
        }
        exitDemoMode()
        isUserLoggedIn = false
        userName = ""
        userEmail = ""
        SilosDataManagerBaseDeDatos.silosList.clear()
        AlertsManagerBaseDeDatos.alertsList.clear()
    }

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
        "Recomendaciones" to mapOf("Español" to "Recomendaciones", "English" to "Recommendations", "Português" to "Recomendações"),
        "CONEXIÓN API BACKEND" to mapOf("Español" to "CONEXIÓN API BACKEND", "English" to "BACKEND API CONNECTION", "Português" to "CONEXÃO API BACKEND"),
        "URL Base del Servidor" to mapOf("Español" to "URL Base del Servidor", "English" to "Server Base URL", "Português" to "URL Base do Servidor"),
        "GUARDAR URL" to mapOf("Español" to "GUARDAR URL", "English" to "SAVE URL", "Português" to "SALVAR URL"),
        "RESTABLECER" to mapOf("Español" to "RESTABLECER", "English" to "RESET", "Português" to "REDEFINIR"),
        "UMBRALES DE ALERTA" to mapOf("Español" to "UMBRALES DE ALERTA", "English" to "ALERT THRESHOLDS", "Português" to "LIMITES DE ALERTA"),
        "Alertas críticas" to mapOf("Español" to "Alertas críticas", "English" to "Critical alerts", "Português" to "Alertas críticas"),
        "Alertas altas" to mapOf("Español" to "Alertas altas", "English" to "High alerts", "Português" to "Alertas altas"),
        "Alertas de atención" to mapOf("Español" to "Alertas de atención", "English" to "Warning alerts", "Português" to "Alertas de atenção"),
        "Alertas bajas" to mapOf("Español" to "Alertas bajas", "English" to "Low alerts", "Português" to "Alertas baixas"),
        "Resumen Diario" to mapOf("Español" to "Resumen Diario", "English" to "Daily Summary", "Português" to "Resumo Diário"),
        "Sensor Offline" to mapOf("Español" to "Sensor Offline", "English" to "Offline Sensor", "Português" to "Sensor Offline"),
        "Batería Baja" to mapOf("Español" to "Batería Baja", "English" to "Low Battery", "Português" to "Bateria Fraca"),
        "Perfil de Usuario" to mapOf("Español" to "Perfil de Usuario", "English" to "User Profile", "Português" to "Perfil de Usuário"),
        "MIS DATOS" to mapOf("Español" to "MIS DATOS", "English" to "MY DATA", "Português" to "MEUS DADOS"),
        "CONTACTO DE SOPORTE" to mapOf("Español" to "CONTACTO DE SOPORTE", "English" to "SUPPORT CONTACT", "Português" to "CONTATO DE SUPORTE"),
        "Correo Electrónico" to mapOf("Español" to "Correo Electrónico", "English" to "Email Address", "Português" to "E-mail"),
        "ESTADO GLOBAL DEL SISTEMA" to mapOf("Español" to "ESTADO GLOBAL DEL SISTEMA", "English" to "GLOBAL SYSTEM STATUS", "Português" to "STATUS GLOBAL DO SISTEMA"),
        "ESTADOS DE SILOBOLSAS" to mapOf("Español" to "ESTADOS DE SILOBOLSAS", "English" to "SILO BAG STATES", "Português" to "ESTADOS DOS SILOS"),
        "DISTRIBUCIÓN POR TIPO DE GRANO" to mapOf("Español" to "DISTRIBUCIÓN POR TIPO DE GRANO", "English" to "GRAIN TYPE DISTRIBUTION", "Português" to "DISTRIBUIÇÃO POR TIPO DE GRÃO"),
        "Gráfico" to mapOf("Español" to "Gráfico", "English" to "Chart", "Português" to "Gráfico"),
        "Todas" to mapOf("Español" to "Todas", "English" to "All", "Português" to "Todas"),
        "Críticas" to mapOf("Español" to "Críticas", "English" to "Critical", "Português" to "Críticas"),
        "Atención" to mapOf("Español" to "Atención", "English" to "Warning", "Português" to "Atenção"),
        "Bajas" to mapOf("Español" to "Bajas", "English" to "Low", "Português" to "Baixas"),
        "Vistas" to mapOf("Español" to "Vistas", "English" to "Viewed", "Português" to "Vistas"),
        "VISTAS" to mapOf("Español" to "VISTAS", "English" to "VIEWED", "Português" to "VISTAS"),
        "Resueltas" to mapOf("Español" to "Resueltas", "English" to "Resolved", "Português" to "Resolvidas"),
        "RESUELTAS" to mapOf("Español" to "RESUELTAS", "English" to "RESOLVED", "Português" to "RESOLVIDAS"),
        "MARCAR RESUELTA" to mapOf("Español" to "MARCAR RESUELTA", "English" to "MARK AS RESOLVED", "Português" to "MARCAR COMO RESOLVIDA"),
        "RESUELTA" to mapOf("Español" to "RESUELTA", "English" to "RESOLVED", "Português" to "RESOLVIDA"),
        "Buscar..." to mapOf("Español" to "Buscar...", "English" to "Search...", "Português" to "Buscar..."),
        "No hay notificaciones" to mapOf("Español" to "No hay notificaciones", "English" to "No notifications", "Português" to "Sem notificações"),
        "MARCAR VISTA" to mapOf("Español" to "MARCAR VISTA", "English" to "MARK READ", "Português" to "MARCAR COMO LIDA"),
        "VER DETALLE" to mapOf("Español" to "VER DETALLE", "English" to "VIEW DETAILS", "Português" to "VER DETALHES"),
        "Cerrar sesión" to mapOf("Español" to "Cerrar sesión", "English" to "Log out", "Português" to "Sair"),
        "Salir del modo demo" to mapOf("Español" to "Salir del modo demo", "English" to "Exit demo mode", "Português" to "Sair do modo demo"),
        "Invitado (demo)" to mapOf("Español" to "Invitado (demo)", "English" to "Guest (demo)", "Português" to "Convidado (demo)"),
        "CERRAR SESIÓN" to mapOf("Español" to "CERRAR SESIÓN", "English" to "LOG OUT", "Português" to "SAIR"),
        "SALIR DEL MODO DEMO" to mapOf("Español" to "SALIR DEL MODO DEMO", "English" to "EXIT DEMO MODE", "Português" to "SAIR DO MODO DEMO"),
        "Bienvenida/o" to mapOf("Español" to "Bienvenida/o", "English" to "Welcome", "Português" to "Bem-vindo/a"),
        "Inicia sesión con tus datos" to mapOf("Español" to "Inicia sesión con tus datos", "English" to "Log in with your credentials", "Português" to "Faça login com seus dados"),
        "email@email.com" to mapOf("Español" to "email@email.com", "English" to "email@email.com", "Português" to "email@email.com"),
        "Ingrese su contraseña" to mapOf("Español" to "Ingrese su contraseña", "English" to "Enter your password", "Português" to "Digite sua senha"),
        "¿Olvidaste tu contraseña?" to mapOf("Español" to "¿Olvidaste tu contraseña?", "English" to "Forgot your password?", "Português" to "Esqueceu sua senha?"),
        "INICIAR SESIÓN" to mapOf("Español" to "INICIAR SESIÓN", "English" to "LOG IN", "Português" to "ENTRAR"),
        "Iniciar sesión con Google" to mapOf("Español" to "Iniciar sesión con Google", "English" to "Sign in with Google", "Português" to "Entrar com o Google"),
        "¿No tienes una cuenta? " to mapOf("Español" to "¿No tienes una cuenta? ", "English" to "Don't have an account? ", "Português" to "Não tem uma conta? "),
        "Crear una cuenta" to mapOf("Español" to "Crear una cuenta", "English" to "Create an account", "Português" to "Criar uma conta"),
        "Regresar" to mapOf("Español" to "Regresar", "English" to "Go back", "Português" to "Voltar"),
        "Regístrate" to mapOf("Español" to "Regístrate", "English" to "Sign up", "Português" to "Cadastre-se"),
        "Apellido" to mapOf("Español" to "Apellido", "English" to "Last name", "Português" to "Sobrenome"),
        "Email" to mapOf("Español" to "Email", "English" to "Email", "Português" to "E-mail"),
        "Contraseña" to mapOf("Español" to "Contraseña", "English" to "Password", "Português" to "Senha"),
        "Número de teléfono" to mapOf("Español" to "Número de teléfono", "English" to "Phone number", "Português" to "Número de telefone"),
        "CREAR CUENTA" to mapOf("Español" to "CREAR CUENTA", "English" to "CREATE ACCOUNT", "Português" to "CRIAR CONTA"),
        "Datos en vivo · fuente: Firebase/Firestore" to mapOf("Español" to "Datos en vivo · fuente: Firebase/Firestore", "English" to "Live data · source: Firebase/Firestore", "Português" to "Dados ao vivo · fonte: Firebase/Firestore"),
        "Datos no disponibles — iniciá sesión" to mapOf("Español" to "Datos no disponibles — iniciá sesión", "English" to "Data unavailable — log in", "Português" to "Dados indisponíveis — faça login"),
        "MODO DEMO · Exploración con datos de ejemplo en memoria" to mapOf("Español" to "MODO DEMO · Exploración con datos de ejemplo en memoria", "English" to "DEMO MODE · Exploration with sample data", "Português" to "MODO DEMO · Exploração com dados de exemplo"),
        "SIN DATOS DEL SISTEMA" to mapOf("Español" to "SIN DATOS DEL SISTEMA", "English" to "NO SYSTEM DATA", "Português" to "SEM DADOS DO SISTEMA"),
        "Esperando recepción de telemetría de sensores o inicio de sesión..." to mapOf("Español" to "Esperando recepción de telemetría de sensores o inicio de sesión...", "English" to "Waiting for sensor telemetry or login...", "Português" to "Aguardando recepção de telemetria dos sensores ou login..."),
        "SISTEMA EN CRÍTICO" to mapOf("Español" to "SISTEMA EN CRÍTICO", "English" to "SYSTEM CRITICAL", "Português" to "SISTEMA EM CRÍTICO"),
        "Atención urgente requerida: Se detectaron parámetros fuera de rango." to mapOf("Español" to "Atención urgente requerida: Se detectaron parámetros fuera de rango.", "English" to "Urgent attention required: Parameters out of range.", "Português" to "Atenção urgente necessária: Parâmetros fora de alcance."),
        "ATENCIÓN REQUERIDA" to mapOf("Español" to "ATENCIÓN REQUERIDA", "English" to "ATTENTION REQUIRED", "Português" to "ATENÇÃO NECESSÁRIA"),
        "Desviación moderada detectada en sensores de temperatura o CO₂." to mapOf("Español" to "Desviación moderada detectada en sensores de temperatura o CO₂.", "English" to "Moderate deviation detected in temperature or CO₂ sensors.", "Português" to "Desvio moderado detectado nos sensores de temperatura ou CO₂."),
        "SISTEMA ESTABLE" to mapOf("Español" to "SISTEMA ESTABLE", "English" to "SYSTEM STABLE", "Português" to "SISTEMA ESTÁVEL"),
        "Todas las silobolsas monitoreadas operan dentro de parámetros de seguridad." to mapOf("Español" to "Todas las silobolsas monitoreadas operan dentro de parámetros de seguridad.", "English" to "All monitored silos operate within safety parameters.", "Português" to "Todos os silos monitorados operam dentro dos parâmetros de segurança."),
        "OBJETIVO CRÍTICO DETECTADO" to mapOf("Español" to "OBJETIVO CRÍTICO DETECTADO", "English" to "CRITICAL TARGET DETECTED", "Português" to "ALVO CRÍTICO DETECTADO"),
        "ID SILOBOLSA" to mapOf("Español" to "ID SILOBOLSA", "English" to "SILO ID", "Português" to "ID DO SILO"),
        "TEMP" to mapOf("Español" to "TEMP", "English" to "TEMP", "Português" to "TEMP"),
        "VER DETALLE DEL SILO CRÍTICO" to mapOf("Español" to "VER DETALLE DEL SILO CRÍTICO", "English" to "VIEW CRITICAL SILO DETAILS", "Português" to "VER DETALHES DO SILO CRÍTICO"),
        "Lista" to mapOf("Español" to "Lista", "English" to "List", "Português" to "Lista"),
        "Mapa" to mapOf("Español" to "Mapa", "English" to "Map", "Português" to "Mapa"),
        "No hay silobolsas registradas" to mapOf("Español" to "No hay silobolsas registradas", "English" to "No registered silos", "Português" to "Nenhum silo registrado"),
        "Sin posiciones reportadas todavía" to mapOf("Español" to "Sin posiciones reportadas todavía", "English" to "No positions reported yet", "Português" to "Nenhuma posição reportada ainda"),
        "Los silos con módulo GPS activo aparecerán mapeados acá" to mapOf("Español" to "Los silos con módulo GPS activo aparecerán mapeados acá", "English" to "Silos with active GPS module will appear mapped here", "Português" to "Os silos com módulo GPS ativo aparecerão mapeados aqui"),
        "MARCADORES GPS DE SILOBOLSAS" to mapOf("Español" to "MARCADORES GPS DE SILOBOLSAS", "English" to "SILO GPS MARKERS", "Português" to "MARCADORES GPS DOS SILOS"),
        "EDITAR SILOBOLSA" to mapOf("Español" to "EDITAR SILOBOLSA", "English" to "EDIT SILO", "Português" to "EDITAR SILO"),
        "ESTADO GPS" to mapOf("Español" to "ESTADO GPS", "English" to "GPS STATUS", "Português" to "STATUS GPS"),
        "Sin señal GPS" to mapOf("Español" to "Sin señal GPS", "English" to "No GPS signal", "Português" to "Sem sinal GPS"),
        "Posición vieja" to mapOf("Español" to "Posición vieja", "English" to "Old position", "Português" to "Posição antiga"),
        "DIAGNÓSTICO PREDICTIVO IA" to mapOf("Español" to "DIAGNÓSTICO PREDICTIVO IA", "English" to "AI PREDICTIVE DIAGNOSIS", "Português" to "DIAGNÓSTICO PREDITIVO IA"),
        "HISTÓRICO" to mapOf("Español" to "HISTÓRICO", "English" to "HISTORICAL", "Português" to "HISTÓRICO"),
        "Series temporales del sensor" to mapOf("Español" to "Series temporales del sensor", "English" to "Sensor time series", "Português" to "Séries temporais do sensor"),
        "Sin datos para este período" to mapOf("Español" to "Sin datos para este período", "English" to "No data for this period", "Português" to "Sem dados para este período"),
        "Iniciá sesión para ver tus notificaciones" to mapOf("Español" to "Iniciá sesión para ver tus notificaciones", "English" to "Log in to view your notifications", "Português" to "Faça login para ver suas notificações"),
        "Cuando tu equipo reporte eventos, aparecerán acá" to mapOf("Español" to "Cuando tu equipo reporte eventos, aparecerán acá", "English" to "When your equipment reports events, they will appear here", "Português" to "Quando seu equipamento reportar eventos, eles aparecerão aqui"),
        "ACCIÓN RECOMENDADA:" to mapOf("Español" to "ACCIÓN RECOMENDADA:", "English" to "RECOMMENDED ACTION:", "Português" to "AÇÃO RECOMENDADA:"),
        "Interpretaciones Activas" to mapOf("Español" to "Interpretaciones Activas", "English" to "Active Interpretations", "Português" to "Interpretações Ativas"),
        "Sin interpretaciones registradas" to mapOf("Español" to "Sin interpretaciones registradas", "English" to "No registered interpretations", "Português" to "Sem interpretações registradas"),
        "Todos los silos operan normalmente" to mapOf("Español" to "Todos los silos operan normalmente", "English" to "All silos operating normally", "Português" to "Todos os silos operam normalmente"),
        "No hay granos registrados para analizar" to mapOf("Español" to "No hay granos registrados para analizar", "English" to "No registered grains to analyze", "Português" to "Nenhum grão registrado para analisar"),
        "Banners" to mapOf("Español" to "Banners", "English" to "Banners", "Português" to "Banners"),
        "Horas sin datos (Sensor Offline)" to mapOf("Español" to "Horas sin datos (Sensor Offline)", "English" to "Hours without data (Offline Sensor)", "Português" to "Horas sem dados (Sensor Offline)"),
        "Porcentaje de Batería Baja" to mapOf("Español" to "Porcentaje de Batería Baja", "English" to "Low Battery Percentage", "Português" to "Porcentagem de Bateria Baixa"),
        "Ingresá números válidos" to mapOf("Español" to "Ingresá números válidos", "English" to "Enter valid numbers", "Português" to "Digite números válidos"),
        "Los valores críticos deben ser mayores que los de advertencia" to mapOf("Español" to "Los valores críticos deben ser mayores que los de advertencia", "English" to "Critical values must be greater than warning values", "Português" to "Os valores críticos devem ser maiores que os de advertência"),
        "Presión — advertencia" to mapOf("Español" to "Presión — advertencia", "English" to "Pressure — warning", "Português" to "Pressão — advertência"),
        "Presión — crítica" to mapOf("Español" to "Presión — crítica", "English" to "Pressure — critical", "Português" to "Pressão — crítica"),
        "Temperatura — advertencia" to mapOf("Español" to "Temperatura — advertencia", "English" to "Temperature — warning", "Português" to "Temperatura — advertência"),
        "Temperatura — crítica" to mapOf("Español" to "Temperatura — crítica", "English" to "Temperature — critical", "Português" to "Temperatura — crítica"),
        "Humedad — advertencia" to mapOf("Español" to "Humedad — advertencia", "English" to "Humidity — warning", "Português" to "Umidade — advertência"),
        "Humedad — crítica" to mapOf("Español" to "Humedad — crítica", "English" to "Humidity — critical", "Português" to "Umidade — crítica"),
        "CO2 — advertencia" to mapOf("Español" to "CO2 — advertencia", "English" to "CO2 — warning", "Português" to "CO2 — advertência"),
        "CO2 — crítica" to mapOf("Español" to "CO2 — crítica", "English" to "CO2 — critical", "Português" to "CO2 — crítica"),
        "GUARDAR UMBRALES" to mapOf("Español" to "GUARDAR UMBRALES", "English" to "SAVE THRESHOLDS", "Português" to "SALVAR LIMITES"),
        "Necesitás una cuenta para hacer esto" to mapOf("Español" to "Necesitás una cuenta para hacer esto", "English" to "You need an account to do this", "Português" to "Você precisa de uma conta para fazer isso"),
        "Estás explorando la app en Modo Demo. Para guardar, editar o modificar datos necesitás iniciar sesión con una cuenta real." to mapOf("Español" to "Estás explorando la app en Modo Demo. Para guardar, editar o modificar datos necesitás iniciar sesión con una cuenta real.", "English" to "You are exploring the app in Demo Mode. To save, edit or modify data you need to log in with a real account.", "Português" to "Você está explorando o aplicativo no Modo Demo. Para salvar, editar ou modificar dados você precisa fazer login com uma conta real."),
        "Ir a Iniciar Sesión" to mapOf("Español" to "Ir a Iniciar Sesión", "English" to "Go to Log In", "Português" to "Ir para Login"),
        "Entendido" to mapOf("Español" to "Entendido", "English" to "Understood", "Português" to "Entendido"),
        "CRÍTICA" to mapOf("Español" to "CRÍTICA", "English" to "CRITICAL", "Português" to "CRÍTICA"),
        "MEDIA" to mapOf("Español" to "MEDIA", "English" to "MEDIUM", "Português" to "MÉDIA"),
        "BAJA" to mapOf("Español" to "BAJA", "English" to "LOW", "Português" to "BAIXA"),
        "INFO" to mapOf("Español" to "INFO", "English" to "INFO", "Português" to "INFO"),
        "SILOS" to mapOf("Español" to "SILOS", "English" to "SILOS", "Português" to "SILOS"),
        "¿Cómo restablezco mi contraseña?" to mapOf("Español" to "¿Cómo restablezco mi contraseña?", "English" to "How do I reset my password?", "Português" to "Como redefino minha senha?"),
        "Para restablecer tu contraseña, ve a la pantalla de Perfil, selecciona \"Cambiar contraseña\" y sigue las instrucciones enviadas a tu correo electrónico registrado." to mapOf("Español" to "Para restablecer tu contraseña, ve a la pantalla de Perfil, selecciona \"Cambiar contraseña\" y sigue las instrucciones enviadas a tu correo electrónico registrado.", "English" to "To reset your password, go to Profile screen, select \"Change password\" and follow instructions sent to your registered email.", "Português" to "Para redefinir sua senha, vá para a tela de Perfil, selecione \"Alterar senha\" e siga as instruções enviadas ao seu e-mail registrado."),
    )

    fun t(key: String): String {
        val valForLang = translations[key]?.get(currentLanguage)
        return if (!valForLang.isNullOrBlank()) valForLang else key
    }

    fun tSensorOffline(hours: Int): String {
        return when (currentLanguage) {
            "English" -> "After $hours hours without data"
            "Português" -> "Após $hours horas sem dados"
            else -> "Después de $hours horas sin datos"
        }
    }

    fun tBateriaBaja(percent: Int): String {
        return when (currentLanguage) {
            "English" -> "When it drops below $percent%"
            "Português" -> "Quando cai abaixo de $percent%"
            else -> "Cuando baja del $percent%"
        }
    }

    fun tNumericChooserRange(min: Int, max: Int, unit: String): String {
        val uTranslated = t(unit)
        return when (currentLanguage) {
            "English" -> "Range: $min to $max $uTranslated"
            "Português" -> "Faixa: $min a $max $uTranslated"
            else -> "Rango: $min a $max $uTranslated"
        }
    }

    fun convertirToneladas(toneladas: Double): Double {
        return if (unidadPesoSeleccionada == "Kilogramos (Kg)") toneladas * 1000.0 else toneladas
    }
}
