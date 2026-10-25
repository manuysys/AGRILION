package com.example.app1.data

import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
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
    val latency_ms: Double = 0.0,
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
        fun create(): ChatApiServiceBaseDeDatos {
            // El LLM local puede tardar bastante en el primer token; el timeout
            // por defecto de OkHttp (10 s) corta la respuesta.
            val client = OkHttpClient.Builder()
                .addInterceptor(ApiConfig.dynamicBaseUrlInterceptor())
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(120, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()

            return Retrofit.Builder()
                .baseUrl(ApiConfig.DEFAULT_BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(ChatApiServiceBaseDeDatos::class.java)
        }
    }
}
