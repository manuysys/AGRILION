package com.example.app1.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Tokens de Diseño Exactos de Agrilion+
 * Inspirados en el sistema de diseño Next.js de paginaweb/
 */
object AgrilionTokens {
    // 1. MARCA / ACENTOS
    val BrandPrimary = Color(0xFF0B4D2C)
    val BrandLight = Color(0xFF0F6B3D)
    val BrandDark = Color(0xFF083D22)
    val BrandAccent = Color(0xFF2563EB)

    // Esmeralda (Acento interactivo en superficies oscuras)
    val Emerald500 = Color(0xFF10B981)
    val Emerald600 = Color(0xFF16A34A)
    val Emerald700 = Color(0xFF047857)

    // 2. ESTADOS SEMÁNTICOS (con variantes light y bg al 8-10% opacidad)
    val Ok = Color(0xFF16A34A)
    val OkLight = Color(0xFFDCFCE7)
    val OkBg = Color(0x1416A34A)

    val Warn = Color(0xFFF59E0B)
    val WarnLight = Color(0xFFFEF3C7)
    val WarnBg = Color(0x14F59E0B)

    val Critical = Color(0xFFDC2626)
    val CriticalLight = Color(0xFFFEE2E2)
    val CriticalBg = Color(0x14DC2626)

    val Offline = Color(0xFF6B7280)
    val OfflineLight = Color(0xFFF3F4F6)
    val OfflineBg = Color(0x146B7280)

    // 3. SUPERFICIES (Oscuro por defecto para estética Dashboard / Agrilion+)
    val SurfaceDarkRoot = Color(0xFF000000)      // bg-black
    val SurfaceDark1 = Color(0xFF0A1A10)         // --surface-dark
    val SurfaceDark2 = Color(0xFF0F2518)         // --surface-dark-2
    val GlassDark = Color(0xEA0A1A10)            // .glass-dark
    val GlassHeader = Color(0xE6000000)          // Header translúcido
    val BorderSubtle = Color(0x1AFFFFFF)         // border-white/10
    val BorderFaint = Color(0x0DFFFFFF)          // border-white/5

    // Superficies claras
    val Surface0 = Color(0xFFFFFFFF)
    val Surface1 = Color(0xFFF5F7F6)
    val Surface2 = Color(0xFFEEF1F0)
    val BorderLight = Color(0xFFE5E7EB)

    // Grises Zinc
    val Zinc400 = Color(0xFFA1A1AA)
    val Zinc500 = Color(0xFF71717A)
    val Zinc800 = Color(0xFF27272A)
    val Zinc800Translucent = Color(0x8027272A)

    // Textos
    val TextOnDark = Color(0xFFF9FAFB)
    val TextSecondaryOnDark = Color(0xFFA1A1AA)
    val TextOnLight = Color(0xFF111827)
    val TextSecondaryOnLight = Color(0xFF4B5563)

    // 4. FORMAS Y RADIOS
    val RadiusCard = RoundedCornerShape(20.dp)   // rounded-2xl
    val RadiusButton = RoundedCornerShape(14.dp) // rounded-xl
    val RadiusPill = RoundedCornerShape(50)      // rounded-full

    // 5. TIPOGRAFÍA / CONFIGURACIÓN DE NÚMEROS TABULARES
    const val TabularNumsFeature = "tnum"

    val TitleBlack = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Black,
        fontSize = 24.sp,
        letterSpacing = (-0.5).sp,
        color = TextOnDark
    )

    val LabelSmallMuted = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 11.sp,
        letterSpacing = 1.2.sp,
        color = Zinc500
    )

    val DataNumberLarge = TextStyle(
        fontFamily = FontFamily.Monospace,
        fontWeight = FontWeight.Black,
        fontSize = 32.sp,
        fontFeatureSettings = TabularNumsFeature,
        color = TextOnDark
    )
}
