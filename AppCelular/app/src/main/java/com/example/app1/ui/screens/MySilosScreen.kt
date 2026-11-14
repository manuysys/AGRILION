package com.example.app1.ui.screens

import android.Manifest
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import com.example.app1.data.AuthManager
import com.example.app1.data.AppStateBaseDeDatos
import com.example.app1.data.EstadoSilo
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.data.SilosDataManagerBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens
import kotlinx.coroutines.launch
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.BoundingBox
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.mylocation.GpsMyLocationProvider
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay

@Composable
fun MySilosScreen(onSiloClick: (String) -> Unit) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedTab by remember { mutableStateOf("lista") } // "lista" | "mapa"
    var selectedMapSiloId by remember { mutableStateOf<String?>(null) }
    val scope = rememberCoroutineScope()

    val silosList = SilosDataManagerBaseDeDatos.silosList
    val isLoading = SilosDataManagerBaseDeDatos.isLoading
    val error = SilosDataManagerBaseDeDatos.error

    val filteredSilos = if (searchQuery.isBlank()) {
        silosList
    } else {
        silosList.filter { it.nombre.contains(searchQuery, ignoreCase = true) || it.id.contains(searchQuery) }
    }

    // Modelo aplanado: GPS directo en el silo (sin objeto anidado).
    val gpsSilos = filteredSilos.filter { it.gpsHasFix && it.latitude != null && it.longitude != null }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AgrilionTokens.SurfaceDarkRoot)
            .padding(16.dp)
    ) {
        // TABS LISTA / MAPA
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = 12.dp)
                .background(AgrilionTokens.SurfaceDark1, RoundedCornerShape(12.dp))
                .padding(4.dp),
            horizontalArrangement = Arrangement.SpaceEvenly
        ) {
            Surface(
                onClick = { selectedTab = "lista" },
                shape = RoundedCornerShape(8.dp),
                color = if (selectedTab == "lista") AgrilionTokens.Emerald600 else Color.Transparent,
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = AppStateBaseDeDatos.t("Lista"),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (selectedTab == "lista") Color.White else AgrilionTokens.Zinc400,
                    modifier = Modifier.padding(vertical = 8.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }

            Surface(
                onClick = { selectedTab = "mapa" },
                shape = RoundedCornerShape(8.dp),
                color = if (selectedTab == "mapa") AgrilionTokens.Emerald600 else Color.Transparent,
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = AppStateBaseDeDatos.t("Mapa"),
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (selectedTab == "mapa") Color.White else AgrilionTokens.Zinc400,
                    modifier = Modifier.padding(vertical = 8.dp),
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
                )
            }
        }

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text(AppStateBaseDeDatos.t("Busca tu silobolsa"), color = AgrilionTokens.Zinc400) },
            trailingIcon = { Icon(Icons.Default.Search, contentDescription = null, tint = AgrilionTokens.Zinc400) },
            shape = RoundedCornerShape(24.dp),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = AgrilionTokens.Emerald500,
                unfocusedBorderColor = AgrilionTokens.BorderSubtle,
                focusedContainerColor = AgrilionTokens.SurfaceDark1,
                unfocusedContainerColor = AgrilionTokens.SurfaceDark1
            )
        )

        Spacer(modifier = Modifier.height(16.dp))

        if (selectedTab == "lista") {
            if (silosList.isEmpty()) {
                Box(
                    modifier = Modifier.fillMaxSize().padding(bottom = 100.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        if (isLoading) {
                            CircularProgressIndicator(color = AgrilionTokens.Emerald500)
                            Spacer(Modifier.height(12.dp))
                        }
                        Text(
                            text = error ?: AppStateBaseDeDatos.t("No hay silobolsas registradas"),
                            style = MaterialTheme.typography.bodyLarge,
                            color = if (error != null) AgrilionTokens.Critical else AgrilionTokens.Zinc400
                        )
                    }
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(bottom = 100.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    items(filteredSilos) { silo ->
                        SiloCardWithMenu(
                            silo = silo,
                            onSiloClick = { onSiloClick(silo.id) },
                            onEdit = { updated ->
                                if (AppStateBaseDeDatos.isDemoMode) {
                                    // Demo: solo memoria local, sin backend.
                                    val index = SilosDataManagerBaseDeDatos.silosList.indexOf(silo)
                                    if (index != -1) {
                                        SilosDataManagerBaseDeDatos.silosList[index] = updated
                                    }
                                } else {
                                    scope.launch {
                                        try {
                                            AuthManager.getInstance().updateSilo(
                                                siloId = updated.id,
                                                name = updated.nombre,
                                                grainType = updated.tipoGrano,
                                                location = updated.ubicacion,
                                                tons = updated.toneladas
                                            )
                                        } catch (_: Exception) {
                                            // Silo sin documento en Firestore.
                                        }
                                        SilosDataManagerBaseDeDatos.refresh()
                                    }
                                }
                            },
                            onDelete = {
                                if (AppStateBaseDeDatos.isDemoMode) {
                                    // Demo: solo memoria local, sin backend.
                                    SilosDataManagerBaseDeDatos.silosList.remove(silo)
                                } else {
                                    scope.launch {
                                        try {
                                            AuthManager.getInstance().deleteSilo(silo.id)
                                        } catch (_: Exception) {
                                            // Silo sin documento en Firestore (solo sensor).
                                        }
                                        SilosDataManagerBaseDeDatos.refresh()
                                    }
                                }
                            }
                        )
                    }
                }
            }
        } else {
            // VISTA DE MAPA INTERACTIVO ESTILO WEB (CARTO DARK BASEMAP)
            if (gpsSilos.isEmpty()) {
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
                    shape = AgrilionTokens.RadiusCard,
                    colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark1)
                ) {
                    Column(
                        modifier = Modifier.padding(32.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Map, contentDescription = null, tint = AgrilionTokens.Zinc500, modifier = Modifier.size(36.dp))
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                            text = AppStateBaseDeDatos.t("Sin posiciones reportadas todavía"),
                            color = Color.White,
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp
                        )
                        Text(
                            text = AppStateBaseDeDatos.t("Los silos con módulo GPS activo aparecerán mapeados acá"),
                            color = AgrilionTokens.Zinc500,
                            fontSize = 12.sp,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            } else {
                Box(modifier = Modifier.fillMaxSize()) {
                    // MAPA REAL CARTO DARK CON INTERACCIÓN TÁCTIL
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .heightIn(min = 340.dp, max = 560.dp)
                            .border(1.dp, AgrilionTokens.BorderSubtle, AgrilionTokens.RadiusCard),
                        shape = AgrilionTokens.RadiusCard,
                        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark2)
                    ) {
                        Box(modifier = Modifier.fillMaxSize()) {
                            OsmMapView(
                                silos = gpsSilos,
                                selectedSiloId = selectedMapSiloId,
                                onSiloSelected = { selectedMapSiloId = it }
                            )

                            // ATTRIBUTION WEB ABAJO A LA DERECHA
                            Text(
                                text = "© OpenStreetMap contributors © CARTO",
                                fontSize = 9.sp,
                                color = Color.White.copy(alpha = 0.6f),
                                modifier = Modifier
                                    .align(Alignment.BottomEnd)
                                    .padding(8.dp)
                                    .background(Color.Black.copy(alpha = 0.5f), RoundedCornerShape(4.dp))
                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }

                    // POPUP BLANCO SOBRE EL MAPA AL TOCAR EL PUNTO (RÉPLICA DE LA WEB)
                    selectedMapSiloId?.let { selId ->
                        val selSilo = gpsSilos.firstOrNull { it.id == selId }
                        if (selSilo != null) {
                            Card(
                                modifier = Modifier
                                    .align(Alignment.BottomCenter)
                                    .fillMaxWidth()
                                    .padding(horizontal = 12.dp, vertical = 16.dp),
                                shape = RoundedCornerShape(20.dp),
                                colors = CardDefaults.cardColors(containerColor = Color.White),
                                elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
                            ) {
                                Column(modifier = Modifier.padding(16.dp)) {
                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween,
                                        verticalAlignment = Alignment.Top
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            Text(
                                                text = selSilo.nombre,
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 16.sp,
                                                color = Color(0xFF18181B)
                                            )
                                            Text(
                                                text = "SB-${selSilo.id.substringAfterLast('-')} · ${AppStateBaseDeDatos.t(selSilo.tipoGrano)}",
                                                fontSize = 12.sp,
                                                color = Color(0xFF71717A),
                                                modifier = Modifier.padding(top = 2.dp)
                                            )
                                        }

                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                text = selSilo.estado.texto.uppercase(),
                                                fontSize = 11.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = selSilo.estado.color
                                            )
                                            IconButton(
                                                onClick = { selectedMapSiloId = null },
                                                modifier = Modifier.size(28.dp).padding(start = 6.dp)
                                            ) {
                                                Icon(Icons.Default.Close, contentDescription = "Cerrar", tint = Color(0xFF71717A))
                                            }
                                        }
                                    }

                                    Spacer(modifier = Modifier.height(10.dp))

                                    // Modelo aplanado: lecturas directas en el silo.
                                    Text(
                                        text = "T: ${"%.1f".format(selSilo.temperatura)} °C  ·  H: ${"%.1f".format(selSilo.humedad)}%",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Color(0xFF27272A)
                                    )
                                    Text(
                                        text = "CO₂: ${selSilo.co2.toInt()} ppm",
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        color = Color(0xFF27272A),
                                        modifier = Modifier.padding(top = 2.dp)
                                    )
                                    Text(
                                        text = "${selSilo.toneladas} TN  ·  ${selSilo.ubicacion}",
                                        fontSize = 12.sp,
                                        color = Color(0xFF27272A)
                                    )
                                    Text(
                                        text = "Última actualiz: ${selSilo.ultimaActualizacion}",
                                        fontSize = 11.sp,
                                        color = Color(0xFF71717A),
                                        modifier = Modifier.padding(top = 2.dp)
                                    )

                                    Spacer(modifier = Modifier.height(12.dp))

                                    TextButton(
                                        onClick = { onSiloClick(selSilo.id) },
                                        contentPadding = PaddingValues(0.dp)
                                    ) {
                                        Text(
                                            text = "Ver detalle →",
                                            color = AgrilionTokens.Emerald600,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun OsmMapView(
    silos: List<SilobolsaBaseDeDatos>,
    selectedSiloId: String?,
    onSiloSelected: (String) -> Unit
) {
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        Configuration.getInstance().userAgentValue = "AgrilionPlus-Android/1.0 (com.example.app1)"
    }

    var hasLocationPermission by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        hasLocationPermission = permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true ||
                permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true
    }

    LaunchedEffect(Unit) {
        permissionLauncher.launch(
            arrayOf(
                Manifest.permission.ACCESS_FINE_LOCATION,
                Manifest.permission.ACCESS_COARSE_LOCATION
            )
        )
    }

    val cartoDarkTileSource = remember {
        XYTileSource(
            "CARTO_Dark",
            1, 19, 256, ".png",
            arrayOf("https://basemaps.cartocdn.com/dark_all/")
        )
    }

    var mapViewRef by remember { mutableStateOf<MapView?>(null) }
    var locationOverlayRef by remember { mutableStateOf<MyLocationNewOverlay?>(null) }

    DisposableEffect(hasLocationPermission, mapViewRef) {
        val mv = mapViewRef
        if (hasLocationPermission && mv != null) {
            val provider = GpsMyLocationProvider(context)
            val overlay = MyLocationNewOverlay(provider, mv).apply {
                enableMyLocation()
                runOnFirstFix {
                    mv.post {
                        val gpsPoints = silos.mapNotNull { s ->
                            val lat = s.latitude
                            val lng = s.longitude
                            if (lat != null && lng != null) GeoPoint(lat, lng) else null
                        }
                        if (gpsPoints.isEmpty() && myLocation != null) {
                            mv.controller.animateTo(myLocation)
                            mv.controller.setZoom(15.0)
                        }
                    }
                }
            }
            mv.overlays.add(overlay)
            locationOverlayRef = overlay
        }

        onDispose {
            locationOverlayRef?.disableMyLocation()
            if (mv != null && locationOverlayRef != null) {
                mv.overlays.remove(locationOverlayRef)
            }
            locationOverlayRef = null
        }
    }

    LaunchedEffect(selectedSiloId) {
        val selectedSilo = silos.firstOrNull { it.id == selectedSiloId }
        val lat = selectedSilo?.latitude
        val lng = selectedSilo?.longitude
        if (lat != null && lng != null && mapViewRef != null) {
            mapViewRef?.controller?.animateTo(GeoPoint(lat, lng))
        }
    }

    AndroidView(
        factory = { ctx ->
            MapView(ctx).apply {
                setTileSource(cartoDarkTileSource)
                setMultiTouchControls(true)
                isTilesScaledToDpi = true

                val gpsPoints = silos.mapNotNull { s ->
                    val lat = s.latitude
                    val lng = s.longitude
                    if (lat != null && lng != null) GeoPoint(lat, lng) else null
                }
                if (gpsPoints.isNotEmpty()) {
                    val box = BoundingBox.fromGeoPoints(gpsPoints)
                    post {
                        zoomToBoundingBox(box, true, 80)
                        if (zoomLevelDouble > 16.0) controller.setZoom(16.0)
                    }
                } else {
                    controller.setZoom(14.0)
                    controller.setCenter(GeoPoint(-32.89, -63.78))
                }

                silos.forEach { silo ->
                    val lat = silo.latitude ?: return@forEach
                    val lng = silo.longitude ?: return@forEach
                    val marker = Marker(this)
                    marker.position = GeoPoint(lat, lng)
                    marker.title = "${silo.nombre} (${silo.estado.texto})"
                    marker.icon = createCircularMarkerDrawable(context, silo.estado.color)
                    marker.setOnMarkerClickListener { _, _ ->
                        onSiloSelected(silo.id)
                        true
                    }
                    overlays.add(marker)
                }

                mapViewRef = this
            }
        },
        update = { mapView ->
            mapViewRef = mapView
        },
        modifier = Modifier.fillMaxSize()
    )
}

/**
 * Genera un drawable de punto circular con halo tenue equivalente al estilo visual de la web.
 */
fun createCircularMarkerDrawable(context: android.content.Context, color: Color): BitmapDrawable {
    val sizePx = (22 * context.resources.displayMetrics.density).toInt()
    val bitmap = Bitmap.createBitmap(sizePx, sizePx, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    val paintHalo = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color.copy(alpha = 0.35f).toArgb()
        style = Paint.Style.FILL
    }
    val paintCore = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = color.toArgb()
        style = Paint.Style.FILL
    }
    val paintStroke = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        this.color = android.graphics.Color.WHITE
        style = Paint.Style.STROKE
        strokeWidth = 2f * context.resources.displayMetrics.density
    }

    val center = sizePx / 2f
    val outerRadius = sizePx / 2f
    val innerRadius = sizePx / 3.4f

    canvas.drawCircle(center, center, outerRadius, paintHalo)
    canvas.drawCircle(center, center, innerRadius, paintCore)
    canvas.drawCircle(center, center, innerRadius, paintStroke)

    return BitmapDrawable(context.resources, bitmap)
}

@Composable
fun SiloCardWithMenu(
    silo: SilobolsaBaseDeDatos,
    onSiloClick: () -> Unit,
    onEdit: (SilobolsaBaseDeDatos) -> Unit,
    onDelete: () -> Unit
) {
    var showMenu by remember { mutableStateOf(false) }
    var showEditDialog by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .border(
                width = 1.dp,
                color = if (silo.estado == EstadoSilo.CRITICO) AgrilionTokens.Critical else AgrilionTokens.BorderSubtle,
                shape = AgrilionTokens.RadiusCard
            )
            .clickable { onSiloClick() },
        shape = AgrilionTokens.RadiusCard,
        colors = CardDefaults.cardColors(
            containerColor = if (silo.estado == EstadoSilo.CRITICO) AgrilionTokens.CriticalBg else AgrilionTokens.SurfaceDark1
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = silo.nombre,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(silo.tipoGrano)}",
                    color = AgrilionTokens.Zinc400,
                    fontSize = 13.sp
                )
                if (silo.ubicacion.isNotBlank()) {
                    Text(
                        text = "${AppStateBaseDeDatos.t("Ubicación")}: ${silo.ubicacion}",
                        style = MaterialTheme.typography.bodySmall,
                        color = AgrilionTokens.Zinc500
                    )
                }
                Spacer(modifier = Modifier.height(6.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Text(
                        "T ${"%.1f".format(silo.temperatura)}°C",
                        color = AgrilionTokens.Emerald500,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "H ${"%.1f".format(silo.humedad)}%",
                        color = AgrilionTokens.Emerald500,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                    Text(
                        "CO₂ ${silo.co2.toInt()} ppm",
                        color = if (silo.co2 > 1200) AgrilionTokens.Critical else AgrilionTokens.Warn,
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
                Text(
                    "Riesgo ${silo.riskScore}/100 · ${silo.ultimaActualizacion}",
                    color = AgrilionTokens.Zinc500,
                    fontSize = 10.sp
                )
            }

            Box {
                IconButton(onClick = { showMenu = true }) {
                    Icon(Icons.Default.MoreVert, contentDescription = "Opciones", tint = AgrilionTokens.Zinc400)
                }
                DropdownMenu(
                    expanded = showMenu,
                    onDismissRequest = { showMenu = false }
                ) {
                    DropdownMenuItem(
                        text = { Text(AppStateBaseDeDatos.t("Editar datos")) },
                        onClick = {
                            showMenu = false
                            showEditDialog = true
                        }
                    )
                    DropdownMenuItem(
                        text = { Text(AppStateBaseDeDatos.t("Eliminar"), color = AgrilionTokens.Critical) },
                        onClick = {
                            showMenu = false
                            onDelete()
                        }
                    )
                }
            }
        }
    }

    if (showEditDialog) {
        EditSiloDialog(
            silo = silo,
            onDismiss = { showEditDialog = false },
            onConfirm = { updatedSilo ->
                onEdit(updatedSilo)
                showEditDialog = false
            }
        )
    }
}

@Composable
fun EditSiloDialog(silo: SilobolsaBaseDeDatos, onDismiss: () -> Unit, onConfirm: (SilobolsaBaseDeDatos) -> Unit) {
    var nombreSilo by remember { mutableStateOf(silo.nombre) }
    var ubicacionSilo by remember { mutableStateOf(silo.ubicacion) }
    var granoSeleccionado by remember { mutableStateOf(silo.tipoGrano) }
    val granos = listOf("Trigo", "Maíz", "Soja", "Cebada", "Girasol")
    var expandedGrano by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            shape = AgrilionTokens.RadiusCard,
            color = AgrilionTokens.SurfaceDark1,
            border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        AppStateBaseDeDatos.t("EDITAR SILOBOLSA"),
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Black,
                        color = Color.White,
                        letterSpacing = (-0.5).sp
                    )
                    IconButton(onClick = onDismiss) { Icon(Icons.Default.Close, contentDescription = null, tint = AgrilionTokens.Zinc400) }
                }

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = nombreSilo,
                    onValueChange = { nombreSilo = it },
                    label = { Text(AppStateBaseDeDatos.t("Nombre"), color = AgrilionTokens.Zinc400) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
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
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    trailingIcon = { Icon(Icons.Default.Map, contentDescription = null, tint = AgrilionTokens.Zinc400) },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        focusedBorderColor = AgrilionTokens.Emerald500,
                        unfocusedBorderColor = AgrilionTokens.BorderSubtle
                    )
                )

                Spacer(modifier = Modifier.height(12.dp))

                Box {
                    OutlinedButton(
                        onClick = { expandedGrano = true },
                        modifier = Modifier.fillMaxWidth(),
                        border = androidx.compose.foundation.BorderStroke(1.dp, AgrilionTokens.BorderSubtle)
                    ) {
                        Text("${AppStateBaseDeDatos.t("Grano")}: ${AppStateBaseDeDatos.t(granoSeleccionado)}", color = Color.White)
                    }
                    DropdownMenu(expanded = expandedGrano, onDismissRequest = { expandedGrano = false }) {
                        granos.forEach { g ->
                            DropdownMenuItem(text = { Text(AppStateBaseDeDatos.t(g)) }, onClick = {
                                granoSeleccionado = g
                                expandedGrano = false
                            })
                        }
                    }
                }

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        onConfirm(silo.copy(
                            nombre = nombreSilo,
                            tipoGrano = granoSeleccionado,
                            ubicacion = ubicacionSilo
                        ))
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(containerColor = AgrilionTokens.Emerald600)
                ) {
                    Text(AppStateBaseDeDatos.t("Guardar"), fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}
