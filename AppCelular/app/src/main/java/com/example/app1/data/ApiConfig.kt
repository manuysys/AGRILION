package com.example.app1.data

import android.content.Context
import okhttp3.HttpUrl
import okhttp3.Interceptor

/**
 * Configuración central y persistente de la API.
 *
 * Emulador Android: 10.0.2.2 es el host de la PC.
 * Dispositivo físico: usar la IP local de la PC, por ejemplo
 * http://192.168.1.100:8000/, o la URL HTTPS de producción.
 *
 * La URL se puede cambiar desde Configuración dentro de la app.
 */
object ApiConfig {
    const val DEFAULT_BASE_URL = "http://10.0.2.2:8000/"

    private const val PREFS = "agrilion_api_config"
    private const val KEY_BASE_URL = "base_url"

    @Volatile
    var baseUrl: String = DEFAULT_BASE_URL
        private set

    fun init(context: Context) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        baseUrl = prefs.getString(KEY_BASE_URL, null)
            ?.takeIf { it.isNotBlank() }
            ?: DEFAULT_BASE_URL
    }

    /** Guarda una URL nueva. Devuelve null si fue válida o un mensaje de error. */
    fun save(context: Context, raw: String): String? {
        val normalized = normalize(raw)
            ?: return "URL inválida. Ejemplo: http://192.168.1.100:8000/"
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(KEY_BASE_URL, normalized)
            .apply()
        baseUrl = normalized
        return null
    }

    fun reset(context: Context) {
        context.applicationContext
            .getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .remove(KEY_BASE_URL)
            .apply()
        baseUrl = DEFAULT_BASE_URL
    }

    private fun normalize(raw: String): String? {
        var value = raw.trim()
        if (value.isBlank()) return null
        if (!value.startsWith("http://") && !value.startsWith("https://")) {
            value = "http://$value"
        }
        if (!value.endsWith("/")) value = "$value/"
        val url = HttpUrl.parse(value) ?: return null
        if (url.scheme() != "http" && url.scheme() != "https") return null
        return url.toString()
    }

    /**
     * Retrofit fija el host al construir el servicio. Este interceptor
     * reescribe cada request con la URL vigente para que el cambio desde
     * Configuración tenga efecto sin reiniciar la app.
     */
    fun dynamicBaseUrlInterceptor(): Interceptor = Interceptor { chain ->
        val request = chain.request()
        val base = HttpUrl.parse(baseUrl)
            ?: return@Interceptor chain.proceed(request)

        val basePath = base.encodedPath().trimEnd('/')
        val newPath = if (basePath.isEmpty()) {
            request.url().encodedPath()
        } else {
            basePath + request.url().encodedPath()
        }

        val newUrl = request.url().newBuilder()
            .scheme(base.scheme())
            .host(base.host())
            .port(base.port())
            .encodedPath(newPath)
            .build()

        chain.proceed(request.newBuilder().url(newUrl).build())
    }
}
