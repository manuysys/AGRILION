package com.example.app1.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val DarkColorScheme = darkColorScheme(
    primary = AgrilionTokens.Emerald600,
    onPrimary = Color.White,
    secondary = AgrilionTokens.BrandLight,
    onSecondary = Color.White,
    tertiary = AgrilionTokens.Emerald500,
    background = AgrilionTokens.SurfaceDarkRoot,
    onBackground = AgrilionTokens.TextOnDark,
    surface = AgrilionTokens.SurfaceDark1,
    onSurface = AgrilionTokens.TextOnDark,
    surfaceVariant = AgrilionTokens.SurfaceDark2,
    onSurfaceVariant = AgrilionTokens.Zinc400,
    outline = AgrilionTokens.BorderSubtle
)

private val LightColorScheme = lightColorScheme(
    primary = AgrilionTokens.BrandPrimary,
    onPrimary = Color.White,
    secondary = AgrilionTokens.Emerald600,
    onSecondary = Color.White,
    tertiary = AgrilionTokens.Emerald500,
    background = AgrilionTokens.SurfaceDarkRoot,
    onBackground = AgrilionTokens.TextOnDark,
    surface = AgrilionTokens.SurfaceDark1,
    onSurface = AgrilionTokens.TextOnDark,
    outline = AgrilionTokens.BorderSubtle
)

@Composable
fun App1Theme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
