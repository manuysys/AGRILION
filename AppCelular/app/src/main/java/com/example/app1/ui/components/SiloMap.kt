package com.example.app1.ui.components

import android.content.Context
import android.preference.PreferenceManager
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.TilesOverlay

/**
 * Helpers de mapa OpenStreetMap compartidos por el dashboard (SiloMapCard)
 * y el mini-mapa del detalle del silo (SiloMiniMap).
 */

/**
 * Fuente de teselas OpenStreetMap estándar (sin API key).
 */
internal fun osmTileSource(): XYTileSource {
    val urls = arrayOf(
        "https://a.tile.openstreetmap.org/",
        "https://b.tile.openstreetmap.org/",
        "https://c.tile.openstreetmap.org/"
    )
    return XYTileSource(
        "OpenStreetMap",
        0,
        19,
        256,
        ".png",
        urls,
        "© OpenStreetMap contributors"
    )
}

/**
 * Crea un MapView configurado para el tema oscuro de la app:
 * OSM estándar con inversión de color y User-Agent identificado.
 */
internal fun setupOsmMap(context: Context): MapView {
    Configuration.getInstance().load(
        context,
        PreferenceManager.getDefaultSharedPreferences(context)
    )
    // OpenStreetMap exige identificar la aplicación en el User-Agent.
    Configuration.getInstance().userAgentValue =
        "AgrilionAndroid/1.0 (+https://github.com/manuysys/AGRILION)"
    return MapView(context).apply {
        setTileSource(osmTileSource())
        setMultiTouchControls(true)
        setBuiltInZoomControls(false)
        setTilesScaledToDpi(true)
        // Mapa oscuro sin API key: OSM estándar con inversión de color.
        overlayManager.tilesOverlay.setColorFilter(TilesOverlay.INVERT_COLORS)
        controller.setZoom(15.0)
        controller.setCenter(GeoPoint(-34.6037, -58.3816))
    }
}

/**
 * Mini-mapa de un solo silo para la pantalla de detalle:
 * un único marcador en su posición GPS y zoom 16.
 * El marcador y el centrado se refrescan en cada recomposición
 * (por ejemplo, cuando el refresco periódico actualiza la posición).
 */
@Composable
internal fun SiloMiniMap(
    latitude: Double,
    longitude: Double,
    modifier: Modifier = Modifier,
    title: String = ""
) {
    val context = LocalContext.current
    val mapView = remember { setupOsmMap(context) }

    DisposableEffect(Unit) {
        mapView.onResume()
        onDispose {
            mapView.onPause()
            mapView.onDetach()
        }
    }

    AndroidView(
        factory = { mapView },
        update = { map ->
            map.overlays.clear()
            val marker = Marker(map).apply {
                position = GeoPoint(latitude, longitude)
                if (title.isNotBlank()) this.title = title
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
            }
            map.overlays.add(marker)
            map.controller.setZoom(16.0)
            map.controller.setCenter(GeoPoint(latitude, longitude))
            map.invalidate()
        },
        modifier = modifier.fillMaxWidth().height(180.dp)
    )
}
