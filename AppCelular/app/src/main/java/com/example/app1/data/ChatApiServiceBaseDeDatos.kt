package com.example.app1.data

import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.Header
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

// Modelos de datos sincronizados con routes.py y schemas.py
data class ChatRequestBaseDeDatos(
    val message: String,
    val silo_id: String = "SILO_01",
    val session_id: String = "android_client"
)

data class ChatResponseBaseDeDatos(
    val response: String,
    val session_id: String,
    val status: String = "success"
)

// Interfaz de Retrofit para conectar con el Backend de Python
interface ChatApiServiceBaseDeDatos {
    @POST("/api/chat")
    suspend fun sendMessage(
        @Body request: ChatRequestBaseDeDatos,
        @Header("Authorization") authToken: String? = null,
    ): ChatResponseBaseDeDatos

    companion object {
        // IP del localhost del PC vista desde el emulador Android
        // Para dispositivo físico, cambiar por la IP local del PC (ej: "http://192.168.1.100:8000/")
        private const val BASE_URL = "http://10.0.2.2:8000/"

        fun create(authManager: AuthManager = AuthManager.getInstance()): ChatApiServiceBaseDeDatos {
            // Interceptor que agrega el Firebase ID Token como Authorization header
            // en cada request al backend (si hay usuario logueado).
            val authInterceptor = Interceptor { chain ->
                val original = chain.request()

                val token: String? = try {
                    // Nota: runBlocking es seguro acá porque OkHttp corre en background thread
                    runBlocking { authManager.getIdToken() }
                } catch (e: Exception) {
                    null
                }

                val request = if (token != null) {
                    original.newBuilder()
                        .header("Authorization", "Bearer $token")
                        .build()
                } else {
                    original
                }

                chain.proceed(request)
            }

            // Logging interceptor (debug)
            val loggingInterceptor = HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            }

            val client = OkHttpClient.Builder()
                .addInterceptor(authInterceptor)
                .addInterceptor(loggingInterceptor)
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build()

            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ChatApiServiceBaseDeDatos::class.java)
        }
    }
}
