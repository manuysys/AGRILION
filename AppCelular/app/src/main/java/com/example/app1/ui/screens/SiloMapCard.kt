package com.example.app1.ui.screens

import android.content.Context
import android.preference.PreferenceManager
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.app1.data.SilobolsaBaseDeDatos
import com.example.app1.ui.theme.AgrilionTokens
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.XYTileSource
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.TilesOverlay

private fun osmSource(): XYTileSource {
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

private fun setupMap(context: Context): MapView {
    Configuration.getInstance().load(
        context,
        PreferenceManager.getDefaultSharedPreferences(context)
    )
    // OpenStreetMap exige identificar la aplicación en el User-Agent.
    Configuration.getInstance().userAgentValue =
        "AgrilionAndroid/1.0 (+https://github.com/manuysys/AGRILION)"
    return MapView(context).apply {
        setTileSource(osmSource())
        setMultiTouchControls(true)
        setBuiltInZoomControls(false)
        setTilesScaledToDpi(true)
        // Mapa oscuro sin API key: OSM estándar con inversión de color.
        overlayManager.tilesOverlay.setColorFilter(TilesOverlay.INVERT_COLORS)
        controller.setZoom(15.0)
        controller.setCenter(GeoPoint(-34.6037, -58.3816))
    }
}

@Composable
fun SiloMapCard(
    silos: List<SilobolsaBaseDeDatos>,
    onSiloClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val mapView = remember { setupMap(context) }
    val withGps = silos.filter {
        it.gpsHasFix && it.latitude != null && it.longitude != null
    }

    DisposableEffect(Unit) {
        mapView.onResume()
        onDispose {
            mapView.onPause()
            mapView.onDetach()
        }
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AgrilionTokens.SurfaceDark2)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(240.dp)
            ) {
                AndroidView(
                    factory = { mapView },
                    update = { map ->
                        map.overlays.clear()
                        if (withGps.isEmpty()) {
                            map.controller.setCenter(GeoPoint(-34.6037, -58.3816))
                            map.controller.setZoom(5.0)
                        } else {
                            withGps.forEach { silo ->
                                val marker = Marker(map).apply {
                                    position = GeoPoint(silo.latitude!!, silo.longitude!!)
                                    title = silo.nombre
                                    snippet = "Riesgo ${silo.riskScore}/100 - ${silo.estado.texto}"
                                    setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                                    setOnMarkerClickListener { _, _ ->
                                        onSiloClick(silo.id)
                                        true
                                    }
                                }
                                map.overlays.add(marker)
                            }
                            val avgLat = withGps.mapNotNull { it.latitude }.average()
                            val avgLon = withGps.mapNotNull { it.longitude }.average()
                            map.controller.setCenter(GeoPoint(avgLat, avgLon))
                            map.controller.setZoom(15.0)
                        }
                        map.invalidate()
                    },
                    modifier = Modifier.fillMaxWidth().height(240.dp)
                )
            }
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 14.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        Icons.Default.Map,
                        contentDescription = null,
                        tint = AgrilionTokens.Emerald500,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(
                        if (withGps.isEmpty()) "Mapa de referencia - sin GPS" else "${withGps.size} silo(s) con GPS",
                        color = AgrilionTokens.Zinc400,
                        fontSize = 11.sp
                    )
                }
                Text(
                    "© OpenStreetMap",
                    color = AgrilionTokens.Zinc500,
                    fontSize = 10.sp
                )
            }
        }
    }
}
