package com.maozi.cloud.data.model

import com.google.gson.annotations.SerializedName

data class App(
    val id: String,
    val name: String,
    val description: String = "",
    @SerializedName("icon_url") val iconUrl: String = "",
    val type: String, // "APK" or "WEB"
    val category: String = "",
    val status: String = "online",
    @SerializedName("created_at") val createdAt: String = "",
    @SerializedName("updated_at") val updatedAt: String = "",
    @SerializedName("version_code") val versionCode: Int? = null,
    @SerializedName("version_name") val versionName: String? = null,
    @SerializedName("package_name") val packageName: String? = null,
    @SerializedName("apk_url") val apkUrl: String? = null,
    @SerializedName("file_size") val fileSize: Long = 0,
    @SerializedName("latest_changelog") val changelog: String? = null,
    @SerializedName("web_url") val webUrl: String? = null,
    @SerializedName("display_mode") val displayMode: String? = null
) {
    val isApk: Boolean get() = type == "APK"
    val isWeb: Boolean get() = type == "WEB"
}

data class ApiResponse<T>(
    val code: Int,
    val message: String,
    val data: T
)

data class VersionCheckRequest(
    @SerializedName("package_name") val packageName: String,
    @SerializedName("current_version_code") val currentVersionCode: Int
)

data class VersionCheckResponse(
    @SerializedName("has_update") val hasUpdate: Boolean,
    @SerializedName("latest_version") val latestVersion: App?
)
