package com.maozi.cloud.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil.compose.AsyncImage
import coil.request.ImageRequest
import com.maozi.cloud.data.model.App
import com.maozi.cloud.util.ApkDownloader
import com.maozi.cloud.util.PackageUtils
import java.io.File

@Composable
fun AppCard(
    app: App,
    serverUrl: String,
    onDownload: (String?) -> Unit,
    onOpenWeb: (String) -> Unit,
    onDownloadComplete: () -> Unit
) {
    val context = LocalContext.current
    var downloading by remember { mutableStateOf(false) }
    var progress by remember { mutableStateOf(0f) }

    val isInstalled = if (app.isApk && app.packageName != null) {
        PackageUtils.isInstalled(context, app.packageName)
    } else false

    val hasUpdate = if (app.isApk && app.packageName != null && app.versionCode != null) {
        val currentCode = PackageUtils.getInstalledVersionCode(context, app.packageName)
        app.versionCode > currentCode
    } else false

    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 图标
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(if (app.iconUrl.startsWith("http")) app.iconUrl else "$serverUrl${app.iconUrl}")
                    .crossfade(true)
                    .build(),
                contentDescription = app.name,
                modifier = Modifier
                    .size(60.dp)
                    .padding(end = 0.dp),
                contentScale = ContentScale.Crop
            )

            Spacer(modifier = Modifier.width(16.dp))

            // 信息
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = app.name,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f, fill = false)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    // 类型标签
                    Surface(
                        shape = RoundedCornerShape(4.dp),
                        color = if (app.isApk) Color(0xFF52C41A) : Color(0xFF1677FF),
                        modifier = Modifier.padding(start = 4.dp)
                    ) {
                        Text(
                            text = app.type,
                            color = Color.White,
                            fontSize = 10.sp,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                }

                if (app.description.isNotEmpty()) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = app.description,
                        fontSize = 13.sp,
                        color = Color.Gray,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    if (app.isApk) {
                        Text(
                            text = if (app.versionName != null) "v${app.versionName}" else "未发布",
                            fontSize = 12.sp,
                            color = Color.Gray
                        )
                        if (app.fileSize > 0) {
                            Text(" · ${formatFileSize(app.fileSize)}", fontSize = 12.sp, color = Color.Gray)
                        }
                    } else {
                        Text(
                            text = app.webUrl ?: "",
                            fontSize = 12.sp,
                            color = Color(0xFF1677FF),
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.width(12.dp))

            // 操作按钮
            when {
                app.isApk && hasUpdate -> {
                    Button(
                        onClick = {
                            if (app.apkUrl != null) {
                                downloading = true
                                onDownload(app.id)
                                val fullUrl = if (app.apkUrl.startsWith("http")) app.apkUrl else "$serverUrl${app.apkUrl}"
                                val fileName = "${app.package_name}_${app.version_name}.apk"
                                ApkDownloader.downloadAndInstall(
                                    context = context,
                                    downloadUrl = fullUrl,
                                    fileName = fileName,
                                    onComplete = { uri ->
                                        downloading = false
                                        onDownloadComplete()
                                        ApkDownloader.installApk(context, uri)
                                    },
                                    onError = { downloading = false; onDownloadComplete() }
                                )
                            }
                        },
                        enabled = !downloading,
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1677FF))
                    ) {
                        if (downloading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = Color.White
                            )
                        } else {
                            Icon(Icons.Default.Update, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("升级", fontSize = 12.sp)
                        }
                    }
                }
                app.isApk && isInstalled -> {
                    OutlinedButton(
                        onClick = {
                            // 已安装且无更新，打开应用
                            app.packageName?.let { pkg ->
                                val intent = context.packageManager.getLaunchIntentForPackage(pkg)
                                intent?.let { context.startActivity(it) }
                            }
                        },
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("打开", fontSize = 12.sp)
                    }
                }
                app.isApk -> {
                    Button(
                        onClick = {
                            if (app.apkUrl != null) {
                                downloading = true
                                onDownload(app.id)
                                val fullUrl = if (app.apkUrl.startsWith("http")) app.apkUrl else "$serverUrl${app.apkUrl}"
                                val fileName = "${app.package_name ?: app.name}_${app.version_name}.apk"
                                ApkDownloader.downloadAndInstall(
                                    context = context,
                                    downloadUrl = fullUrl,
                                    fileName = fileName,
                                    onComplete = { uri ->
                                        downloading = false
                                        onDownloadComplete()
                                        ApkDownloader.installApk(context, uri)
                                    },
                                    onError = { downloading = false; onDownloadComplete() }
                                )
                            }
                        },
                        enabled = !downloading,
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        if (downloading) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(16.dp),
                                strokeWidth = 2.dp,
                                color = MaterialTheme.colorScheme.primary
                            )
                        } else {
                            Icon(Icons.Default.Download, contentDescription = null, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("安装", fontSize = 12.sp)
                        }
                    }
                }
                app.isWeb -> {
                    Button(
                        onClick = {
                            app.webUrl?.let { onOpenWeb(it) }
                        },
                        shape = RoundedCornerShape(8.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF52C41A))
                    ) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("打开", fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

private fun formatFileSize(bytes: Long): String {
    if (bytes == 0L) return "0 B"
    val k = 1024
    val sizes = arrayOf("B", "KB", "MB", "GB")
    val i = (Math.log(bytes.toDouble()) / Math.log(k.toDouble())).toInt()
    return String.format("%.1f %s", bytes / Math.pow(k.toDouble(), i.toDouble()), sizes[i])
}
