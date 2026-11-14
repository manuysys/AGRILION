package com.example.app1

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.Image
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.automirrored.filled.Logout
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.repeatOnLifecycle
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.example.app1.ui.theme.AgrilionTokens
import com.example.app1.ui.screens.*
import com.example.app1.data.ApiConfig
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.AuthManager
import com.example.app1.data.SettingsManager
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.data.EstadoSilo
import com.example.app1.data.UserPreferences
import com.google.firebase.auth.FirebaseUser
import org.osmdroid.config.Configuration
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Configuration.getInstance().userAgentValue = "AgrilionPlus-Android/1.0 (com.example.app1)"
        ApiConfig.init(this)
        SettingsManager.init(this)
        UserPreferences.init(this)
        setContent {
            AgrilionTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = AgrilionTokens.SurfaceDarkRoot,
                ) {
                    val authManager = remember { AuthManager.getInstance() }
                    val user by authManager.authState.collectAsState(initial = authManager.currentUser)
                    when {
                        user != null -> AgrilionApp(user)
                        AppStateBaseDeDatos.isDemoMode -> AgrilionApp(null)
                        else -> LoginScreen(
                            onLoginSuccess = {},
                            onDemoEnter = { AppStateBaseDeDatos.enterDemoMode() }
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AgrilionTheme(content: @Composable () -> Unit) {
    val colorScheme = darkColorScheme(
        primary = AgrilionTokens.Emerald600,
        onPrimary = Color.White,
        background = AgrilionTokens.SurfaceDarkRoot,
        surface = AgrilionTokens.SurfaceDark1,
        onSurface = Color.White,
        surfaceVariant = AgrilionTokens.SurfaceDark2,
        onSurfaceVariant = AgrilionTokens.Zinc400,
        outline = AgrilionTokens.BorderSubtle
    )
    MaterialTheme(colorScheme = colorScheme, content = content)
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgrilionApp(user: FirebaseUser? = null) {
    val navController = rememberNavController()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val lifecycleOwner = LocalLifecycleOwner.current

    LaunchedEffect(user?.uid) {
        // En modo demo (sin usuario logueado) no se tocan los datos demo.
        if (user == null && AppStateBaseDeDatos.isDemoMode) return@LaunchedEffect

        if (user == null) {
            AppStateBaseDeDatos.isUserLoggedIn = false
            SilosDataManagerBaseDeDatos.clear()
            return@LaunchedEffect
        }

        AppStateBaseDeDatos.isUserLoggedIn = true
        AppStateBaseDeDatos.userEmail = user.email ?: ""
        AppStateBaseDeDatos.userName =
            user.displayName ?: user.email?.substringBefore("@") ?: "Usuario"

        try {
            AuthManager.getInstance().ensureUserProfile()
                ?.get("name")
                ?.toString()
                ?.takeIf { it.isNotBlank() }
                ?.let { AppStateBaseDeDatos.userName = it }
        } catch (_: Exception) {
            // Si falla el perfil, seguimos con el nombre de Firebase.
        }

        // Refresco periódico de los silos desde la AI API.
        // Se pausa cuando la app deja de estar visible.
        lifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
            while (true) {
                SilosDataManagerBaseDeDatos.refresh()
                delay(20_000)
            }
        }
    }

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
            "dashboard" to AppStateBaseDeDatos.t("DASHBOARD"),
            "profile" to AppStateBaseDeDatos.t("MI PERFIL"),
            "chatbot" to AppStateBaseDeDatos.t("ASISTENTE"),
            "chat_history" to AppStateBaseDeDatos.t("TUS CONVERSACIONES"),
            "support" to AppStateBaseDeDatos.t("AYUDA & SOPORTE"),
            "notifications" to AppStateBaseDeDatos.t("NOTIFICACIONES"),
            "recommendations" to AppStateBaseDeDatos.t("RECOMENDACIONES"),
            "settings" to AppStateBaseDeDatos.t("CONFIGURACIÓN"),
            "diagnosis" to AppStateBaseDeDatos.t("DIAGNÓSTICO"),
            "my_silos" to AppStateBaseDeDatos.t("MIS SILOS"),
            "silo_detail/{siloId}" to AppStateBaseDeDatos.t("DETALLE")
        )
    }

    val displayUserName = when {
        AppStateBaseDeDatos.isDemoMode -> AppStateBaseDeDatos.t("Invitado (demo)")
        AppStateBaseDeDatos.userName.isNotBlank() -> AppStateBaseDeDatos.userName
        else -> AppStateBaseDeDatos.t("Perfil de Usuario")
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = AgrilionTokens.SurfaceDark1,
                drawerContentColor = Color.White
            ) {
                Spacer(modifier = Modifier.height(50.dp))
                
                NavigationDrawerItem(
                    label = { 
                        Column {
                            Text(
                                AppStateBaseDeDatos.t("MI PERFIL"),
                                style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Black, color = Color.White, letterSpacing = (-0.5).sp)
                            )
                            Text(
                                text = displayUserName,
                                style = TextStyle(fontSize = 14.sp, color = AgrilionTokens.Zinc400)
                            )
                        }
                    },
                    selected = currentRoute == "profile",
                    colors = NavigationDrawerItemDefaults.colors(
                        selectedContainerColor = AgrilionTokens.Emerald600,
                        unselectedContainerColor = Color.Transparent,
                        selectedIconColor = Color.White,
                        unselectedIconColor = AgrilionTokens.Zinc400
                    ),
                    onClick = { 
                        navController.navigate("profile")
                        scope.launch { drawerState.close() }
                    },
                    icon = {
                        Icon(
                            Icons.Default.AccountCircle, 
                            contentDescription = null, 
                            modifier = Modifier.size(32.dp)
                        ) 
                    }
                )
                
                HorizontalDivider(
                    modifier = Modifier.padding(vertical = 16.dp),
                    color = AgrilionTokens.BorderSubtle
                )
                
                val menuItems = listOf(
                    AppStateBaseDeDatos.t("Mis Silos") to "my_silos",
                    AppStateBaseDeDatos.t("Diagnóstico") to "diagnosis",
                    AppStateBaseDeDatos.t("Asistente") to "chat_history",
                    AppStateBaseDeDatos.t("Configuración") to "settings",
                    AppStateBaseDeDatos.t("Ayuda & Soporte") to "support",
                    AppStateBaseDeDatos.t("Recomendaciones") to "recommendations"
                )
                menuItems.forEach { (label, route) ->
                    NavigationDrawerItem(
                        label = { Text(label, style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Medium, color = Color.White)) },
                        selected = currentRoute == route,
                        colors = NavigationDrawerItemDefaults.colors(
                            selectedContainerColor = AgrilionTokens.Emerald600,
                            unselectedContainerColor = Color.Transparent,
                            selectedTextColor = Color.White,
                            unselectedTextColor = AgrilionTokens.Zinc400
                        ),
                        onClick = {
                            navController.navigate(route)
                            scope.launch { drawerState.close() }
                        }
                    )
                }
                
                if (AppStateBaseDeDatos.isDemoMode) {
                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 16.dp),
                        color = AgrilionTokens.BorderSubtle
                    )
                    NavigationDrawerItem(
                        label = { Text(AppStateBaseDeDatos.t("Salir del modo demo"), style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color(0xFFE1AD01))) },
                        selected = false,
                        colors = NavigationDrawerItemDefaults.colors(
                            unselectedContainerColor = Color.Transparent,
                            unselectedTextColor = Color(0xFFE1AD01)
                        ),
                        onClick = {
                            AppStateBaseDeDatos.exitDemoMode()
                            scope.launch { drawerState.close() }
                        },
                        icon = {
                            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Salir demo", tint = Color(0xFFE1AD01))
                        }
                    )
                } else if (AppStateBaseDeDatos.isUserLoggedIn) {
                    HorizontalDivider(
                        modifier = Modifier.padding(vertical = 16.dp),
                        color = AgrilionTokens.BorderSubtle
                    )
                    NavigationDrawerItem(
                        label = { Text(AppStateBaseDeDatos.t("Cerrar sesión"), style = TextStyle(fontSize = 16.sp, fontWeight = FontWeight.Bold, color = AgrilionTokens.Warn)) },
                        selected = false,
                        colors = NavigationDrawerItemDefaults.colors(
                            unselectedContainerColor = Color.Transparent,
                            unselectedTextColor = AgrilionTokens.Warn
                        ),
                        onClick = {
                            AppStateBaseDeDatos.logout()
                            scope.launch { drawerState.close() }
                        },
                        icon = {
                            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = "Cerrar sesión", tint = AgrilionTokens.Warn)
                        }
                    )
                }

                Spacer(modifier = Modifier.weight(1f))
            }
        }
    ) {
        Scaffold(
            containerColor = AgrilionTokens.SurfaceDarkRoot,
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            screenTitles[currentRoute] ?: "AGRILION",
                            style = TextStyle(
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Black,
                                letterSpacing = (-0.5).sp,
                                color = Color.White
                            )
                        )
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = AgrilionTokens.GlassHeader,
                        titleContentColor = Color.White,
                        navigationIconContentColor = Color.White,
                        actionIconContentColor = Color.White
                    ),
                    navigationIcon = {
                        IconButton(
                            onClick = { scope.launch { drawerState.open() } },
                            modifier = Modifier.padding(start = 2.dp)
                        ) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu", modifier = Modifier.size(32.dp))
                        }
                    },
                    actions = {
                        IconButton(
                            onClick = { navController.navigate("notifications") },
                            modifier = Modifier.padding(end = 2.dp)
                        ) {
                            Icon(Icons.Default.Notifications, contentDescription = "Notificaciones", modifier = Modifier.size(32.dp))
                        }
                    }
                )
            },
            bottomBar = {
                NavigationBar(
                    containerColor = AgrilionTokens.GlassHeader,
                    contentColor = Color.White,
                    modifier = Modifier
                        .height(84.dp)
                        .border(width = 1.dp, color = AgrilionTokens.BorderSubtle)
                ) {
                    NavigationBarItem(
                        icon = { Icon(Icons.Default.Home, null, modifier = Modifier.size(28.dp)) },
                        label = { Text(AppStateBaseDeDatos.t("Inicio"), style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold)) },
                        selected = currentRoute == "dashboard",
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AgrilionTokens.Emerald500,
                            selectedTextColor = AgrilionTokens.Emerald500,
                            unselectedIconColor = AgrilionTokens.Zinc500,
                            unselectedTextColor = AgrilionTokens.Zinc500,
                            indicatorColor = Color.Transparent
                        ),
                        onClick = { navController.navigate("dashboard") }
                    )
                    NavigationBarItem(
                        icon = { 
                            Box(
                                modifier = Modifier
                                    .size(40.dp)
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
                        label = { Text(AppStateBaseDeDatos.t("Mis Silos"), style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold)) },
                        selected = currentRoute == "my_silos",
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AgrilionTokens.Emerald500,
                            selectedTextColor = AgrilionTokens.Emerald500,
                            unselectedIconColor = AgrilionTokens.Zinc500,
                            unselectedTextColor = AgrilionTokens.Zinc500,
                            indicatorColor = Color.Transparent
                        ),
                        onClick = { navController.navigate("my_silos") }
                    )
                    NavigationBarItem(
                        icon = { 
                            Icon(Icons.Default.Person, null, modifier = Modifier.size(28.dp))
                        },
                        label = { Text(AppStateBaseDeDatos.t("Mi Perfil"), style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold)) },
                        selected = currentRoute == "profile",
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = AgrilionTokens.Emerald500,
                            selectedTextColor = AgrilionTokens.Emerald500,
                            unselectedIconColor = AgrilionTokens.Zinc500,
                            unselectedTextColor = AgrilionTokens.Zinc500,
                            indicatorColor = Color.Transparent
                        ),
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
                                    containerColor = AgrilionTokens.Emerald600,
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
                composable("dashboard") {
                    DashboardScreen(
                        onSiloClick = { id -> navController.navigate("silo_detail/$id") }
                    )
                }
                composable("profile") { ProfileScreen() }
                composable("chatbot") { ChatbotScreen() }
                composable("chat_history") { ChatHistoryScreen(onChatClick = { _ -> navController.navigate("chatbot") }) }
                composable("support") { SupportScreen() }
                composable("notifications") {
                    NotificationsScreen(
                        onNotificationClick = { siloId ->
                            navController.navigate("silo_detail/$siloId")
                        },
                        onLoginClick = { AppStateBaseDeDatos.logout() }
                    )
                }
                composable("recommendations") {
                    RecommendationsScreen(
                        onNavigateToGrainSilos = { index -> navController.navigate("grain_silos/$index") }
                    )
                }
                composable("settings") { SettingsScreen() }
                composable("diagnosis") { DiagnosisScreen() }
                composable("my_silos") { MySilosScreen(onSiloClick = { id -> navController.navigate("silo_detail/$id") }) }
                composable(
                    "silo_detail/{siloId}",
                    arguments = listOf(navArgument("siloId") { type = NavType.StringType })
                ) { backStackEntry ->
                    SiloDetailScreen(backStackEntry.arguments?.getString("siloId") ?: "")
                }
                composable(
                    "grain_silos/{grainIndex}",
                    arguments = listOf(navArgument("grainIndex") { type = NavType.IntType })
                ) { backStackEntry ->
                    val grainIndex = backStackEntry.arguments?.getInt("grainIndex") ?: 0
                    GrainSilosScreen(
                        grainIndex = grainIndex,
                        onSiloClick = { id -> navController.navigate("silo_detail/$id") },
                        onBackClick = { navController.popBackStack() }
                    )
                }
            }

            // DIÁLOGO AÑADIR SILOBOLSA CENTRALIZADO
            if (showAddSiloDialog) {
                AddSiloDialog(
                    onDismiss = { showAddSiloDialog = false },
                    onConfirm = { nuevoSilo ->
                        if (AppStateBaseDeDatos.isDemoMode) {
                            // Demo: alta directa en memoria.
                            SilosDataManagerBaseDeDatos.silosList.add(nuevoSilo)
                            showAddSiloDialog = false
                        } else {
                            showAddSiloDialog = false
                            scope.launch {
                                try {
                                    AuthManager.getInstance().createSilo(
                                        name = nuevoSilo.nombre,
                                        grainType = nuevoSilo.tipoGrano,
                                        location = nuevoSilo.ubicacion,
                                        tons = nuevoSilo.toneladas
                                    )
                                    SilosDataManagerBaseDeDatos.refresh()
                                } catch (_: Exception) {
                                    // El error se refleja en el estado del repositorio.
                                }
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
fun AddSiloDialog(onDismiss: () -> Unit, onConfirm: (SilobolsaBaseDeDatos) -> Unit) {
    val maxSuffix = SilosDataManagerBaseDeDatos.silosList
        .mapNotNull { it.id.substringAfterLast('-').toIntOrNull() }
        .maxOrNull() ?: 0
    val nextNum = if (maxSuffix > 0) maxSuffix + 1 else SilosDataManagerBaseDeDatos.silosList.size + 1
    val formattedNumStr = String.format(java.util.Locale.US, "%02d", nextNum)

    var nombreSilo by remember { mutableStateOf("") }
    var ubicacionSilo by remember { mutableStateOf("") }
    var granoSeleccionado by remember { mutableStateOf("Trigo") }
    val granos = listOf("Trigo", "Maíz", "Soja", "Cebada", "Girasol")
    var expandedGrano by remember { mutableStateOf(false) }

    var cantidadText by remember { mutableStateOf("") }
    var unidadCantidad by remember { mutableStateOf("TN") }
    var expandedUnidad by remember { mutableStateOf(false) }
    var qtyErrorMsg by remember { mutableStateOf<String?>(null) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = AgrilionTokens.RadiusCard,
            color = AgrilionTokens.SurfaceDark1,
            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        AppStateBaseDeDatos.t("NUEVA SILOBOLSA"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = (-0.5).sp
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = AgrilionTokens.Zinc400)
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))

                if (qtyErrorMsg != null) {
                    Text(
                        text = qtyErrorMsg ?: "",
                        fontSize = 11.sp,
                        color = AgrilionTokens.Critical,
                        modifier = Modifier.padding(bottom = 6.dp)
                    )
                }

                OutlinedTextField(
                    value = nombreSilo,
                    onValueChange = { nombreSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Nombre") + " ($formattedNumStr)", color = AgrilionTokens.Zinc400) },
                    placeholder = { Text("Ej: Lote Norte", color = AgrilionTokens.Zinc500) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AgrilionTokens.Emerald500,
                        unfocusedBorderColor = AgrilionTokens.BorderSubtle
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = ubicacionSilo,
                    onValueChange = { ubicacionSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Ubicación"), color = AgrilionTokens.Zinc400) },
                    placeholder = { Text("Coordenadas o sector", color = AgrilionTokens.Zinc500) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AgrilionTokens.Emerald500,
                        unfocusedBorderColor = AgrilionTokens.BorderSubtle
                    ),
                    trailingIcon = { Icon(Icons.Default.Map, contentDescription = null, tint = AgrilionTokens.Zinc400) }
                )

                Spacer(modifier = Modifier.height(12.dp))

                Box {
                    OutlinedButton(
                        onClick = { expandedGrano = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
                    ) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(granoSeleccionado)}", color = Color.White)
                            Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Color.White)
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

                Spacer(modifier = Modifier.height(12.dp))

                // FILA CANTIDAD + UNIDAD (TN/KG)
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = cantidadText,
                        onValueChange = { cantidadText = it },
                        label = { Text(AppStateBaseDeDatos.t("Cantidad"), color = AgrilionTokens.Zinc400) },
                        placeholder = { Text("Ej: 220", color = AgrilionTokens.Zinc500) },
                        modifier = Modifier.weight(1f),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White,
                            focusedBorderColor = AgrilionTokens.Emerald500,
                            unfocusedBorderColor = AgrilionTokens.BorderSubtle
                        )
                    )

                    Box {
                        OutlinedButton(
                            onClick = { expandedUnidad = true },
                            modifier = Modifier.width(95.dp),
                            shape = RoundedCornerShape(12.dp),
                            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle),
                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 14.dp)
                        ) {
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text(unidadCantidad, color = Color.White, fontWeight = FontWeight.Bold)
                                Icon(Icons.Default.ArrowDropDown, contentDescription = null, tint = Color.White)
                            }
                        }
                        DropdownMenu(expanded = expandedUnidad, onDismissRequest = { expandedUnidad = false }) {
                            listOf("TN", "KG").forEach { u ->
                                DropdownMenuItem(
                                    text = { Text(u) },
                                    onClick = {
                                        unidadCantidad = u
                                        expandedUnidad = false
                                    }
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        val parsedQty = cantidadText.toDoubleOrNull()
                        if (cantidadText.isNotBlank() && (parsedQty == null || parsedQty <= 0)) {
                            qtyErrorMsg = AppStateBaseDeDatos.t("Ingresá una cantidad válida")
                            return@Button
                        }

                        val toneladasFinales = when {
                            parsedQty == null -> 0.0
                            unidadCantidad == "KG" -> parsedQty / 1000.0
                            else -> parsedQty
                        }

                        qtyErrorMsg = null
                        val finalId = if (AppStateBaseDeDatos.isDemoMode) {
                            "DEMO-SB-" + String.format(java.util.Locale.US, "%03d", nextNum)
                        } else {
                            nextNum.toString()
                        }
                        val nombreFinal = if (nombreSilo.isBlank()) "Silobolsa $formattedNumStr" else "$nombreSilo $formattedNumStr"
                        onConfirm(
                            SilobolsaBaseDeDatos(
                                id = finalId,
                                nombre = nombreFinal,
                                estado = EstadoSilo.BUENO,
                                ultimaActualizacion = "Justo ahora",
                                tipoGrano = granoSeleccionado,
                                toneladas = toneladasFinales,
                                ubicacion = ubicacionSilo,
                                diagnosticoSemanal = "Pendiente de primer análisis técnico..."
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600)
                ) {
                    Text(AppStateBaseDeDatos.t("Guardar Silobolsa"), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
