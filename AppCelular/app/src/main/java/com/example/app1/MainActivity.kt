package com.example.app1

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.app1.ui.theme.AgrilionBackground
import com.example.app1.ui.theme.AgrilionPrimary
import com.example.app1.ui.screens.*
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.data.EstadoSilo
import androidx.compose.runtime.collectAsState
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            AgrilionTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    MainScreen()
                }
            }
        }
    }
}

/**
 * MainScreen maneja el routing según el estado de autenticación.
 * Si hay usuario logueado → muestra AgrilionApp (dashboard).
 * Si no → muestra LoginScreen.
 */
@Composable
fun MainScreen() {
    val authManager = remember { com.example.app1.data.AuthManager.getInstance() }
    val user by authManager.authState.collectAsState(initial = authManager.currentUser)

    if (user == null) {
        LoginScreen(
            onLoginSuccess = {
                // El authState flow actualizará automáticamente la UI
                // cuando Firebase Auth confirme el login.
            },
            authManager = authManager,
        )
    } else {
        // Sincronizar nombre/email al AppState global (para mostrar en el drawer)
        LaunchedEffect(user) {
            user?.let { u ->
                AppStateBaseDeDatos.userEmail = u.email ?: ""
                u.displayName?.let { AppStateBaseDeDatos.userName = it }
                    ?: run {
                        // Si Firebase Auth no tiene displayName, lo traemos de Firestore
                        val profile = authManager.getUserProfile()
                        profile?.get("name")?.let { AppStateBaseDeDatos.userName = it.toString() }
                    }
                AppStateBaseDeDatos.isUserLoggedIn = true
            }
        }
        AgrilionApp(authManager = authManager)
    }
}

@Composable
fun AgrilionTheme(content: @Composable () -> Unit) {
    val colorScheme = lightColorScheme(
        primary = AgrilionPrimary,
        background = AgrilionBackground,
        surface = Color.White
    )
    MaterialTheme(colorScheme = colorScheme, content = content)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgrilionApp(authManager: com.example.app1.data.AuthManager = com.example.app1.data.AuthManager.getInstance()) {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    // FABs INDEPENDIENTES
    var chatbotOffsetX by remember { mutableStateOf(0f) }
    var chatbotOffsetY by remember { mutableStateOf(0f) }
    
    var addSiloOffsetX by remember { mutableStateOf(0f) }
    var addSiloOffsetY by remember { mutableStateOf(-180f) }

    // ESTADO DIÁLOGO AÑADIR SILO
    var showAddSiloDialog by remember { mutableStateOf(false) }

    val screenTitles = remember(AppStateBaseDeDatos.currentLanguage) {
        mapOf(
            "dashboard" to AppStateBaseDeDatos.t("Dashboard"),
            "profile" to AppStateBaseDeDatos.t("Mi Perfil"),
            "chatbot" to AppStateBaseDeDatos.t("Asistente"),
            "chat_history" to AppStateBaseDeDatos.t("Tus Conversaciones"),
            "support" to AppStateBaseDeDatos.t("Ayuda & Soporte"),
            "notifications" to AppStateBaseDeDatos.t("Notificaciones"),
            "recommendations" to AppStateBaseDeDatos.t("Recomendaciones"),
            "settings" to AppStateBaseDeDatos.t("Configuración"),
            "diagnosis" to AppStateBaseDeDatos.t("Diagnóstico"),
            "my_silos" to AppStateBaseDeDatos.t("Mis Silos"),
            "silo_detail/{siloId}" to AppStateBaseDeDatos.t("Detalle")
        )
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Spacer(modifier = Modifier.height(50.dp))
                
                NavigationDrawerItem(
                    label = { 
                        Column {
                            Text(
                                AppStateBaseDeDatos.t("Mi Perfil"),
                                style = TextStyle(fontSize = 22.sp, fontWeight = FontWeight.Bold)
                            )
                            Text(
                                text = AppStateBaseDeDatos.userName,
                                style = TextStyle(fontSize = 16.sp, color = Color.Gray)
                            )
                        }
                    },
                    selected = currentRoute == "profile",
                    onClick = { 
                        navController.navigate("profile")
                        scope.launch { drawerState.close() }
                    },
                    icon = {
                        Icon(
                            Icons.Default.AccountCircle, 
                            contentDescription = null, 
                            modifier = Modifier.size(38.dp)
                        ) 
                    }
                )
                
                HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp))
                
                val menuItems = listOf(
                    AppStateBaseDeDatos.t("Mis Silos") to "my_silos",
                    AppStateBaseDeDatos.t("Diagnóstico") to "diagnosis",
                    AppStateBaseDeDatos.t("Asistente") to "chat_history",
                    AppStateBaseDeDatos.t("Configuración") to "settings",
                    AppStateBaseDeDatos.t("Ayuda & Soporte") to "support",
                    AppStateBaseDeDatos.t("Recomendaciones") to "recommendations"
                )
                // Botón de cerrar sesión al final del menú
                menuItems.forEach { (label, route) ->
                    NavigationDrawerItem(
                        label = { Text(label, style = TextStyle(fontSize = 19.sp)) },
                        selected = currentRoute == route,
                        onClick = {
                            navController.navigate(route)
                            scope.launch { drawerState.close() }
                        }
                    )
                }
                
                Spacer(modifier = Modifier.weight(1f))

                // Botón Cerrar Sesión al final del drawer
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                NavigationDrawerItem(
                    label = { Text("Cerrar sesión", color = Color(0xFFEF4444)) },
                    selected = false,
                    onClick = {
                        authManager.signOut()
                        scope.launch { drawerState.close() }
                    },
                    icon = {
                        Icon(
                            Icons.Default.ExitToApp,
                            contentDescription = null,
                            tint = Color(0xFFEF4444),
                        )
                    }
                )
                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text(screenTitles[currentRoute] ?: "AGRILION", style = TextStyle(fontSize = 26.sp)) },
                    navigationIcon = {
                        IconButton(
                            onClick = { scope.launch { drawerState.open() } },
                            modifier = Modifier.padding(start = 2.dp)
                        ) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu", modifier = Modifier.size(40.dp))
                        }
                    },
                    actions = {
                        IconButton(
                            onClick = { navController.navigate("notifications") },
                            modifier = Modifier.padding(end = 2.dp)
                        ) {
                            Icon(Icons.Default.Notifications, contentDescription = "Notificaciones", modifier = Modifier.size(40.dp))
                        }
                    }
                )
            },
            bottomBar = {
                NavigationBar(modifier = Modifier.height(100.dp)) {
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Home, null, modifier = Modifier.size(36.dp)) },
                        label = { Text(AppStateBaseDeDatos.t("Inicio"), style = TextStyle(fontSize = 16.sp)) },
                        selected = currentRoute == "dashboard",
                        onClick = { navController.navigate("dashboard") }
                    )
                    NavigationBarItem(
                        icon = { 
                            Box(
                                modifier = Modifier
                                    .size(48.dp)
                                    .clip(CircleShape)
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.logo_app_white),
                                    contentDescription = "Mis Silos",
                                    modifier = Modifier.fillMaxSize(),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        },
                        label = { Text(AppStateBaseDeDatos.t("Mis Silos"), style = TextStyle(fontSize = 16.sp)) },
                        selected = currentRoute == "my_silos",
                        onClick = { navController.navigate("my_silos") }
                    )
                    NavigationBarItem(
                        icon = { 
                            Icon(Icons.Default.Person, null, modifier = Modifier.size(36.dp))
                        },
                        label = { Text(AppStateBaseDeDatos.t("Mi Perfil"), style = TextStyle(fontSize = 16.sp)) },
                        selected = currentRoute == "profile",
                        onClick = { navController.navigate("profile") }
                    )
                }
            },
            floatingActionButton = {
                if (currentRoute != "chatbot" && currentRoute != "chat_history") {
                    Box(modifier = Modifier.fillMaxSize()) {
                        // FAB AÑADIR SILO
                        if (currentRoute == "my_silos") {
                            Box(
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .offset { IntOffset(addSiloOffsetX.roundToInt(), addSiloOffsetY.roundToInt()) }
                                    .pointerInput(Unit) {
                                        detectDragGestures { change, dragAmount ->
                                            change.consume()
                                            addSiloOffsetX += dragAmount.x
                                            addSiloOffsetY += dragAmount.y
                                        }
                                    }
                                    .padding(bottom = 2.dp, end = 2.dp)
                            ) {
                                FloatingActionButton(
                                    onClick = { showAddSiloDialog = true },
                                    shape = CircleShape,
                                    containerColor = MaterialTheme.colorScheme.primary,
                                    contentColor = Color.White,
                                    modifier = Modifier.size(56.dp)
                                ) {
                                    Icon(Icons.Default.Add, contentDescription = "Añadir")
                                }
                            }
                        }

                        // FAB CHATBOT
                        Box(
                            modifier = Modifier
                                .align(Alignment.BottomEnd)
                                .offset { IntOffset(chatbotOffsetX.roundToInt(), chatbotOffsetY.roundToInt()) }
                                .pointerInput(Unit) {
                                    detectDragGestures { change, dragAmount ->
                                        change.consume()
                                        chatbotOffsetX += dragAmount.x
                                        chatbotOffsetY += dragAmount.y
                                    }
                                }
                                .padding(bottom = 2.dp, end = 2.dp)
                        ) {
                            FloatingActionButton(
                                onClick = { navController.navigate("chatbot") },
                                shape = CircleShape,
                                containerColor = Color.Transparent,
                                elevation = FloatingActionButtonDefaults.elevation(0.dp),
                                modifier = Modifier.size(62.dp).clip(CircleShape)
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.logo_app_verde),
                                    contentDescription = "Asistente",
                                    modifier = Modifier.fillMaxSize().clip(CircleShape),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }
                    }
                }
            }
        ) { padding ->
            NavHost(navController = navController, startDestination = "dashboard", modifier = Modifier.padding(padding)) {
                composable("dashboard") { DashboardScreen() }
                composable("profile") { ProfileScreen() }
                composable("chatbot") { ChatbotScreen() }
                composable("chat_history") { ChatHistoryScreen(onChatClick = { _ -> navController.navigate("chatbot") }) }
                composable("support") { SupportScreen() }
                composable("notifications") { 
                    NotificationsScreen(onNotificationClick = { siloId -> 
                        navController.navigate("silo_detail/$siloId") 
                    }) 
                }
                composable("recommendations") { RecommendationsScreen() }
                composable("settings") { SettingsScreen() }
                composable("diagnosis") { DiagnosisScreen() }
                composable("my_silos") { MySilosScreen(onSiloClick = { id -> navController.navigate("silo_detail/$id") }) }
                composable(
                    "silo_detail/{siloId}",
                    arguments = listOf(navArgument("siloId") { type = NavType.StringType })
                ) { backStackEntry ->
                    SiloDetailScreen(backStackEntry.arguments?.getString("siloId") ?: "")
                }
            }

            // DIÁLOGO AÑADIR SILOBOLSA CENTRALIZADO
            if (showAddSiloDialog) {
                AddSiloDialog(
                    onDismiss = { showAddSiloDialog = false },
                    onConfirm = { nuevoSilo ->
                        SilosDataManagerBaseDeDatos.silosList.add(nuevoSilo)
                        showAddSiloDialog = false
                    }
                )
            }
        }
    }
}

@Composable
fun AddSiloDialog(onDismiss: () -> Unit, onConfirm: (SilobolsaBaseDeDatos) -> Unit) {
    // Cálculo automático del ID (último + 1)
    val nextId = (SilosDataManagerBaseDeDatos.silosList.mapNotNull { it.id.toIntOrNull() }.maxOrNull() ?: 0) + 1
    
    var nombreSilo by remember { mutableStateOf("") }
    var ubicacionSilo by remember { mutableStateOf("") }
    var granoSeleccionado by remember { mutableStateOf("Trigo") }
    val granos = listOf("Trigo", "Maíz", "Soja", "Cebada", "Girasol")
    var expandedGrano by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = RoundedCornerShape(24.dp),
            color = Color.White
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                // Cabecera con X
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(AppStateBaseDeDatos.t("Nueva Silobolsa"), style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar")
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                // Campo Nombre + ID
                OutlinedTextField(
                    value = nombreSilo,
                    onValueChange = { nombreSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Nombre") + " ($nextId)") },
                    placeholder = { Text("Ej: Lote Norte") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Campo Ubicación (REQUERIMIENTO)
                OutlinedTextField(
                    value = ubicacionSilo,
                    onValueChange = { ubicacionSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Ubicación")) },
                    placeholder = { Text("Coordenadas o sector") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    trailingIcon = { Icon(Icons.Default.Map, contentDescription = null, tint = Color.Gray) }
                )

                Spacer(modifier = Modifier.height(12.dp))

                // Selector de Grano
                Box {
                    OutlinedButton(
                        onClick = { expandedGrano = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(granoSeleccionado)}", color = Color.Black)
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null)
                        }
                    }
                    DropdownMenu(expanded = expandedGrano, onDismissRequest = { expandedGrano = false }) {
                        granos.forEach { g ->
                            DropdownMenuItem(
                                text = { Text(AppStateBaseDeDatos.t(g)) },
                                onClick = {
                                    granoSeleccionado = g
                                    expandedGrano = false
                                }
                            )
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                // Botón Guardar
                Button(
                    onClick = {
                        val nombreFinal = if (nombreSilo.isBlank()) "Silobolsa $nextId" else "$nombreSilo $nextId"
                        onConfirm(
                            SilobolsaBaseDeDatos(
                                id = nextId.toString(),
                                nombre = nombreFinal,
                                estado = EstadoSilo.BUENO,
                                ultimaActualizacion = "Justo ahora",
                                tipoGrano = granoSeleccionado,
                                toneladas = 0.0,
                                ubicacion = ubicacionSilo, // Guardando ubicación real
                                diagnosticoSemanal = "Pendiente de primer análisis técnico..."
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text(AppStateBaseDeDatos.t("Guardar Silobolsa"))
                }
            }
        }
    }
}
