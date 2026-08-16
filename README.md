# Maozi Cloud - 毛子云平台

> 私有软件分发与管理平台 —— 统一管理你的 Web 应用和 Android APK

## 功能特性

- 📱 **Android 客户端** — 浏览所有可用软件，一键安装/升级 APK，直达 Web 应用
- 🖥️ **管理后台** — 上传 APK（自动解析包名/版本）、管理 Web 应用、发布更新
- 🔌 **RESTful API** — 版本检测、文件下载、应用元数据管理
- 🚀 **GitHub Actions** — 自动化构建与 APK 打包

## 项目结构

```
maozi-cloud/
├── server/         # 后端 API (Express + TypeScript + SQLite)
├── admin/          # 管理后台 (React + Vite + Ant Design)
├── android/        # Android 客户端 (Kotlin + Jetpack Compose)
└── .github/        # GitHub Actions 工作流
```

## 快速开始

### 后端服务
```bash
cd server
npm install
npm run dev         # 开发模式，默认端口 3001
```

### 管理后台
```bash
cd admin
npm install
npm run dev         # 开发模式，默认端口 5173
```

### Android
使用 Android Studio 打开 `android/` 目录

## 环境要求

- Node.js >= 18
- Android Studio (Koala 或更高)
- JDK >= 17

## License

MIT
