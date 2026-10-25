package com.example.app1.data

import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

// Contratos de datos idénticos al cliente web (ai-api.ts)
data class ChatRequestBaseDeDatos(
    val message: String,
    val silo_id: String? = null,
    val session_id: String? = null
)

data class ChatResponseBaseDeDatos(
    val response: String,
    val session_id: String = "",
    val latency_ms: Long = 0,
    val context_used: Map<String, Any>? = null,
    val from_cache: Boolean = false,
    val error: String? = null
)

data class HealthResponseBaseDeDatos(
    val status: String = "ok",
    val version: String = "1.0",
    val model_loaded: Boolean = true,
    val timestamp: String = ""
)

interface ChatApiServiceBaseDeDatos {
    @GET("api/v1/health")
    suspend fun checkHealth(): HealthResponseBaseDeDatos

    @POST("api/v1/chat")
    suspend fun sendMessage(@Body request: ChatRequestBaseDeDatos): ChatResponseBaseDeDatos

    companion object {
        // Dirección IP local para el emulador Android (puerto 8000 del backend de Python)
        private const val BASE_URL = "http://10.0.2.2:8000/"

        fun create(): ChatApiServiceBaseDeDatos {
            return Retrofit.Builder()
                .baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ChatApiServiceBaseDeDatos::class.java)
        }
    }
}
