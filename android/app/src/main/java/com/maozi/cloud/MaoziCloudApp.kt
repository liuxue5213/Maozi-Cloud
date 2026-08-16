package com.maozi.cloud

import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.maozi.cloud.data.repository.AppRepository
import com.maozi.cloud.ui.screens.HomeScreen
import com.maozi.cloud.ui.screens.SettingsScreen
import com.maozi.cloud.ui.screens.WebViewScreen

@Composable
fun MaoziCloudApp() {
    val context = LocalContext.current
    val repository = remember { AppRepository(context) }
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "home") {
        composable("home") {
            HomeScreen(
                repository = repository,
                onNavigateToSettings = { navController.navigate("settings") },
                onNavigateToWebView = { url -> navController.navigate("webview/${java.net.URLEncoder.encode(url, "UTF-8")}") }
            )
        }
        composable("settings") {
            SettingsScreen(
                repository = repository,
                onBack = { navController.popBackStack() }
            )
        }
        composable("webview/{url}") { backStackEntry ->
            val url = java.net.URLDecoder.decode(backStackEntry.arguments?.getString("url") ?: "", "UTF-8")
            WebViewScreen(
                url = url,
                onBack = { navController.popBackStack() }
            )
        }
    }
}
