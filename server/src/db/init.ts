import { db } from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export function initDatabase() {
  // 应用表
  db.exec(`
    CREATE TABLE IF NOT EXISTS apps (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon_url TEXT DEFAULT '',
      type TEXT NOT NULL CHECK(type IN ('APK', 'WEB')) DEFAULT 'APK',
      category TEXT DEFAULT '未排序',
      status TEXT NOT NULL CHECK(status IN ('online', 'offline')) DEFAULT 'online',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // APK 版本表
  db.exec(`
    CREATE TABLE IF NOT EXISTS apk_versions (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL,
      version_code INTEGER NOT NULL,
      version_name TEXT NOT NULL,
      package_name TEXT DEFAULT '',
      apk_url TEXT NOT NULL,
      file_size INTEGER DEFAULT 0,
      min_sdk INTEGER DEFAULT 21,
      changelog TEXT DEFAULT '',
      is_latest INTEGER DEFAULT 0,
      upload_time TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE,
      UNIQUE(app_id, version_code)
    );
  `);

  // Web 应用配置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS web_configs (
      id TEXT PRIMARY KEY,
      app_id TEXT NOT NULL UNIQUE,
      web_url TEXT NOT NULL,
      display_mode TEXT CHECK(display_mode IN ('webview', 'browser')) DEFAULT 'webview',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (app_id) REFERENCES apps(id) ON DELETE CASCADE
    );
  `);

  // 管理员表
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );
  `);

  // 创建索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_apk_versions_app_id ON apk_versions(app_id);
    CREATE INDEX IF NOT EXISTS idx_apk_versions_latest ON apk_versions(app_id, is_latest);
    CREATE INDEX IF NOT EXISTS idx_apps_status ON apps(status);
  `);

  console.log('✅ 数据库表初始化完成');
}

// 初始化默认管理员
export function initDefaultAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  const existing = db.prepare('SELECT id FROM admins WHERE username = ?').get(username);
  if (!existing) {
    const hashedPassword = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO admins (username, password) VALUES (?, ?)').run(username, hashedPassword);
    console.log(`✅ 默认管理员已创建: ${username} / ${password}`);
  } else {
    console.log('ℹ️ 管理员已存在，跳过创建');
  }
}

// 如果直接运行此文件
if (require.main === module) {
  initDatabase();
  initDefaultAdmin();
  console.log('🎉 数据库初始化全部完成');
}
