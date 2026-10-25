package com.example.app1.data

import android.content.Context

/** Preferencias locales simples que sobreviven al reinicio de la app. */
object UserPreferences {
    private const val PREFS = "agrilion_user_prefs"
    private const val KEY_LANGUAGE = "language"
    private const val KEY_WEIGHT_UNIT = "weight_unit"

    private const val DEFAULT_LANGUAGE = "Español"
    private const val DEFAULT_WEIGHT_UNIT = "Toneladas (TN)"

    fun init(context: Context) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        AppStateBaseDeDatos.currentLanguage =
            prefs.getString(KEY_LANGUAGE, null)?.takeIf { it.isNotBlank() } ?: DEFAULT_LANGUAGE
        AppStateBaseDeDatos.unidadPesoSeleccionada =
            prefs.getString(KEY_WEIGHT_UNIT, null)?.takeIf { it.isNotBlank() } ?: DEFAULT_WEIGHT_UNIT
    }

    fun saveLanguage(context: Context, language: String) {
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_LANGUAGE, language)
            .apply()
    }

    fun saveWeightUnit(context: Context, unit: String) {
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_WEIGHT_UNIT, unit)
            .apply()
    }
}
