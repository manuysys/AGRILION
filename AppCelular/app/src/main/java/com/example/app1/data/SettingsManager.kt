package com.example.app1.data

import android.content.Context
import android.content.SharedPreferences
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableDoubleStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

/**
 * Gestor centralizado de preferencias de Configuración con persistencia en SharedPreferences.
 *
 * Nota de la portación: el idioma y la unidad de peso los persiste UserPreferences
 * (fuente única en esta app); acá solo se guardan toggles de notificación,
 * umbrales de alerta y la fecha de la última actualización de cotizaciones BCR.
 */
object SettingsManager {
    private const val PREFS_NAME = "agrilion_settings_prefs"

    // OBJETOS REPOSITORIOS REACTIVOS CON ESTADO DE COMPOSE
    var emailCritical by mutableStateOf(true)
    var emailHigh by mutableStateOf(true)
    var emailMedium by mutableStateOf(true)
    var emailLow by mutableStateOf(false)
    var emailRecordatorios by mutableStateOf(true)
    var emailInformativos by mutableStateOf(false)

    var bannerCritical by mutableStateOf(true)
    var bannerHigh by mutableStateOf(true)
    var bannerMedium by mutableStateOf(true)
    var bannerLow by mutableStateOf(false)
    var bannerRecordatorios by mutableStateOf(true)
    var bannerInformativos by mutableStateOf(false)

    // NOTIFICACIONES POR CANAL (EMAIL Y BANNERS)
    var resumenDiarioEmail by mutableStateOf(true)
    var resumenDiarioBanner by mutableStateOf(true)
    var sensorOfflineEmail by mutableStateOf(false)
    var sensorOfflineBanner by mutableStateOf(false)
    var bateriaBajaEmail by mutableStateOf(false)
    var bateriaBajaBanner by mutableStateOf(false)

    // VALORES GLOBALES COMPARTIDOS POR CANAL
    var resumenDiarioEnabled by mutableStateOf(true)
    var sensorOfflineEnabled by mutableStateOf(false)
    var sensorOfflineHours by mutableIntStateOf(4)
    var bateriaBajaEnabled by mutableStateOf(false)
    var bateriaBajaPercent by mutableIntStateOf(35)

    // UMBRALES DE ALERTA
    var tempWarn by mutableDoubleStateOf(28.0)
    var tempCrit by mutableDoubleStateOf(35.0)
    var humWarn by mutableDoubleStateOf(70.0)
    var humCrit by mutableDoubleStateOf(80.0)
    var co2Warn by mutableDoubleStateOf(600.0)
    var co2Crit by mutableDoubleStateOf(1200.0)
    var presWarn by mutableDoubleStateOf(1010.0)
    var presCrit by mutableDoubleStateOf(1030.0)

    // COTIZACIONES BCR: PERSISTENCIA Y REFRESH MENSUAL
    var lastPricingFetchDate by mutableStateOf("02/06/2026")
    var lastPricingFetchMonthYear by mutableStateOf("")

    fun init(context: Context) {
        val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

        // Subcategorías Email
        emailCritical = prefs.getBoolean("email_critical", true)
        emailHigh = prefs.getBoolean("email_high", true)
        emailMedium = prefs.getBoolean("email_medium", true)
        emailLow = prefs.getBoolean("email_low", false)
        emailRecordatorios = prefs.getBoolean("email_recordatorios", true)
        emailInformativos = prefs.getBoolean("email_informativos", false)

        // Subcategorías Banners
        bannerCritical = prefs.getBoolean("banner_critical", true)
        bannerHigh = prefs.getBoolean("banner_high", true)
        bannerMedium = prefs.getBoolean("banner_medium", true)
        bannerLow = prefs.getBoolean("banner_low", false)
        bannerRecordatorios = prefs.getBoolean("banner_recordatorios", true)
        bannerInformativos = prefs.getBoolean("banner_informativos", false)

        // Filas globales (migración previa)
        val defaultResumen = prefs.getBoolean("resumen_diario_enabled", true)
        val defaultOffline = prefs.getBoolean("sensor_offline_enabled", false)
        val defaultBateria = prefs.getBoolean("bateria_baja_enabled", false)

        resumenDiarioEnabled = defaultResumen
        sensorOfflineEnabled = defaultOffline
        bateriaBajaEnabled = defaultBateria
        sensorOfflineHours = prefs.getInt("sensor_offline_hours", 4)
        bateriaBajaPercent = prefs.getInt("bateria_baja_percent", 35)

        // Filas específicas por canal
        resumenDiarioEmail = prefs.getBoolean("resumen_diario_email", defaultResumen)
        resumenDiarioBanner = prefs.getBoolean("resumen_diario_banner", defaultResumen)
        sensorOfflineEmail = prefs.getBoolean("sensor_offline_email", defaultOffline)
        sensorOfflineBanner = prefs.getBoolean("sensor_offline_banner", defaultOffline)
        bateriaBajaEmail = prefs.getBoolean("bateria_baja_email", defaultBateria)
        bateriaBajaBanner = prefs.getBoolean("bateria_baja_banner", defaultBateria)

        // Umbrales
        tempWarn = prefs.getFloat("temp_warn", 28.0f).toDouble()
        tempCrit = prefs.getFloat("temp_crit", 35.0f).toDouble()
        humWarn = prefs.getFloat("hum_warn", 70.0f).toDouble()
        humCrit = prefs.getFloat("hum_crit", 80.0f).toDouble()
        co2Warn = prefs.getFloat("co2_warn", 600.0f).toDouble()
        co2Crit = prefs.getFloat("co2_crit", 1200.0f).toDouble()
        presWarn = prefs.getFloat("pres_warn", 1010.0f).toDouble()
        presCrit = prefs.getFloat("pres_crit", 1030.0f).toDouble()

        // Cotizaciones BCR
        lastPricingFetchDate = prefs.getString("last_pricing_fetch_date", "") ?: ""
        lastPricingFetchMonthYear = prefs.getString("last_pricing_fetch_month_year", "") ?: ""

        checkAndRefreshMonthlyPricing(context)
    }

    fun checkAndRefreshMonthlyPricing(context: Context) {
        val calendar = Calendar.getInstance()
        val currentMonthYear = SimpleDateFormat("yyyy-MM", Locale.getDefault()).format(calendar.time)
        val currentDateStr = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(calendar.time)

        if (lastPricingFetchMonthYear != currentMonthYear || lastPricingFetchDate.isBlank()) {
            lastPricingFetchMonthYear = currentMonthYear
            lastPricingFetchDate = currentDateStr
            save(context)
        }
    }

    fun save(context: Context) {
        val prefs: SharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().apply {
            putBoolean("email_critical", emailCritical)
            putBoolean("email_high", emailHigh)
            putBoolean("email_medium", emailMedium)
            putBoolean("email_low", emailLow)
            putBoolean("email_recordatorios", emailRecordatorios)
            putBoolean("email_informativos", emailInformativos)

            putBoolean("banner_critical", bannerCritical)
            putBoolean("banner_high", bannerHigh)
            putBoolean("banner_medium", bannerMedium)
            putBoolean("banner_low", bannerLow)
            putBoolean("banner_recordatorios", bannerRecordatorios)
            putBoolean("banner_informativos", bannerInformativos)

            putBoolean("resumen_diario_enabled", resumenDiarioEmail || resumenDiarioBanner)
            putBoolean("sensor_offline_enabled", sensorOfflineEmail || sensorOfflineBanner)
            putInt("sensor_offline_hours", sensorOfflineHours)
            putBoolean("bateria_baja_enabled", bateriaBajaEmail || bateriaBajaBanner)
            putInt("bateria_baja_percent", bateriaBajaPercent)

            putBoolean("resumen_diario_email", resumenDiarioEmail)
            putBoolean("resumen_diario_banner", resumenDiarioBanner)
            putBoolean("sensor_offline_email", sensorOfflineEmail)
            putBoolean("sensor_offline_banner", sensorOfflineBanner)
            putBoolean("bateria_baja_email", bateriaBajaEmail)
            putBoolean("bateria_baja_banner", bateriaBajaBanner)

            putFloat("temp_warn", tempWarn.toFloat())
            putFloat("temp_crit", tempCrit.toFloat())
            putFloat("hum_warn", humWarn.toFloat())
            putFloat("hum_crit", humCrit.toFloat())
            putFloat("co2_warn", co2Warn.toFloat())
            putFloat("co2_crit", co2Crit.toFloat())
            putFloat("pres_warn", presWarn.toFloat())
            putFloat("pres_crit", presCrit.toFloat())

            putString("last_pricing_fetch_date", lastPricingFetchDate)
            putString("last_pricing_fetch_month_year", lastPricingFetchMonthYear)
            apply()
        }
    }

    fun resetThresholds(context: Context) {
        tempWarn = 28.0
        tempCrit = 35.0
        humWarn = 70.0
        humCrit = 80.0
        co2Warn = 600.0
        co2Crit = 1200.0
        presWarn = 1010.0
        presCrit = 1030.0
        save(context)
    }
}
