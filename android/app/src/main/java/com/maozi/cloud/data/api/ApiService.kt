package com.maozi.cloud.data.api

import com.maozi.cloud.data.model.ApiResponse
import com.maozi.cloud.data.model.App
import com.maozi.cloud.data.model.VersionCheckRequest
import com.maozi.cloud.data.model.VersionCheckResponse
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import java.util.concurrent.TimeUnit

interface ApiService {
    @GET("apps/public/list")
    suspend fun getAppList(): ApiResponse<List<App>>

    @POST("apps/public/check-version")
    suspend fun checkVersion(@Body request: VersionCheckRequest): ApiResponse<VersionCheckResponse>
}

object ApiClient {
    private var retrofit: Retrofit? = null
    private var currentBaseUrl: String = ""

    fun getService(baseUrl: String): ApiService {
        if (retrofit == null || currentBaseUrl != baseUrl) {
            val client = OkHttpClient.Builder()
                .connectTimeout(15, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build()

            retrofit = Retrofit.Builder()
                .baseUrl(baseUrl)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build()

            currentBaseUrl = baseUrl
        }
        return retrofit!!.create(ApiService::class.java)
    }

    fun reset() {
        retrofit = null
        currentBaseUrl = ""
    }
}
