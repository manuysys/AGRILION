package com.example.app1.data

import com.google.gson.annotations.SerializedName
import java.util.concurrent.TimeUnit
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

// ─── DTOs alineados con la AI API (FastAPI) ──────────────────────────────────

data class SilosOverviewResponse(
    val silos: List<SiloOverviewDto> = emptyList(),
    val total: Int = 0,
    val timestamp: String = ""
)

data class SiloOverviewDto(
    @SerializedName("silo_id") val siloId: String,
    val temperature: Double = 0.0,
    val humidity: Double = 0.0,
    val co2: Double = 0.0,
    val pressure: Double? = null,
    @SerializedName("risk_score") val riskScore: Int = 0,
    @SerializedName("risk_level") val riskLevel: String = "NORMAL",
    @SerializedName("last_update") val lastUpdate: String = "",
    @SerializedName("grain_type") val grainType: String? = null,
    @SerializedName("device_id") val deviceId: String? = null
)

data class SiloHistoryResponse(
    @SerializedName("silo_id") val siloId: String = "",
    val history: List<SiloHistoryDto> = emptyList(),
    val hours: Int = 24,
    @SerializedName("total_points") val totalPoints: Int = 0
)

data class SiloHistoryDto(
    val timestamp: String = "",
    val temperature: Double = 0.0,
    val humidity: Double = 0.0,
    val co2: Double = 0.0,
    val pressure: Double? = null
)

data class SiloPredictionResponse(
    @SerializedName("silo_id") val siloId: String = "",
    val status: String = "",
    val readings: Int = 0,
    val required: Int = 24,
    val predictions: List<PredictionStepDto> = emptyList(),
    val anomalies: Map<String, Any>? = null,
    val risk: Map<String, Any>? = null,
    val model: String = "LSTM"
)

data class PredictionStepDto(
    val step: Int = 0,
    val timestamp: String = "",
    val temperature: Double = 0.0,
    val humidity: Double? = null,
    val co2: Double? = null
)

interface SilosApiService {
    @GET("api/v1/silos/overview")
    suspend fun getOverview(): SilosOverviewResponse

    @GET("api/v1/silos/{id}/history")
    suspend fun getHistory(
        @Path("id") siloId: String,
        @Query("hours") hours: Int = 24
    ): SiloHistoryResponse

    @GET("api/v1/silos/{id}/prediction")
    suspend fun getPrediction(@Path("id") siloId: String): SiloPredictionResponse

    companion object {
        fun create(): SilosApiService {
            val client = OkHttpClient.Builder()
                .addInterceptor(ApiConfig.dynamicBaseUrlInterceptor())
                .connectTimeout(20, TimeUnit.SECONDS)
                .readTimeout(90, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .build()

            return Retrofit.Builder()
                .baseUrl(ApiConfig.DEFAULT_BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()
                .create(SilosApiService::class.java)
        }
    }
}
