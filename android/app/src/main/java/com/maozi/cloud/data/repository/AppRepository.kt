package com.maozi.cloud.data.repository

import android.content.Context
import android.content.SharedPreferences
import com.maozi.cloud.data.api.ApiClient
import com.maozi.cloud.data.model.App
import com.maozi.cloud.data.model.VersionCheckRequest
import com.maozi.cloud.data.model.VersionCheckResponse

class AppRepository(context: Context) {
    private val prefs: SharedPreferences =
        context.getSharedPreferences("maozi_cloud", Context.MODE_PRIVATE)

    var serverUrl: String
        get() = prefs.getString("server_url", "http://10.0.2.2:3001/api") ?: "http://10.0.2.2:3001/api"
        set(value) = prefs.edit().putString("server_url", value).apply()

    fun getApiService() = ApiClient.getService(serverUrl)

    suspend fun getAppList(): Result<List<App>> {
        return try {
            val response = getApiService().getAppList()
            if (response.code == 200) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun checkVersion(packageName: String, currentVersionCode: Int): Result<VersionCheckResponse> {
        return try {
            val response = getApiService().checkVersion(
                VersionCheckRequest(packageName, currentVersionCode)
            )
            if (response.code == 200) {
                Result.success(response.data)
            } else {
                Result.failure(Exception(response.message))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
