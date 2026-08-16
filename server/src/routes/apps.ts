import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// ========== 公开接口（Android 客户端调用）==========

// 获取所有在线应用列表（含最新版本信息）
router.get('/public/list', (_req, res: Response) => {
  const apps = db.prepare(`
    SELECT a.*,
      av.version_code, av.version_name, av.apk_url, av.file_size,
      av.changelog as latest_changelog, av.package_name, av.upload_time,
      wc.web_url, wc.display_mode
    FROM apps a
    LEFT JOIN apk_versions av ON a.id = av.app_id AND av.is_latest = 1
    LEFT JOIN web_configs wc ON a.id = wc.app_id
    WHERE a.status = 'online'
    ORDER BY a.updated_at DESC
  `).all();

  res.json({
    code: 200,
    message: '获取成功',
    data: apps,
  });
});

// 版本检测（客户端传 package_name + 当前 versionCode）
router.post('/public/check-version', (req: any, res: Response) => {
  const { package_name, current_version_code } = req.body;

  if (!package_name) {
    res.status(400).json({ code: 400, message: '请提供包名' });
    return;
  }

  const app = db.prepare(`
    SELECT a.id, a.name, a.description, a.icon_url, a.type,
      av.version_code, av.version_name, av.apk_url, av.file_size,
      av.changelog, av.package_name, av.upload_time
    FROM apps a
    INNER JOIN apk_versions av ON a.id = av.app_id AND av.is_latest = 1
    WHERE a.status = 'online' AND av.package_name = ?
  `).get(package_name) as any;

  if (!app) {
    res.json({ code: 200, message: '未找到该应用', data: { has_update: false } });
    return;
  }

  const currentCode = current_version_code || 0;
  const has_update = app.version_code > currentCode;

  res.json({
    code: 200,
    message: '查询成功',
    data: {
      has_update,
      latest_version: has_update ? app : null,
    },
  });
});

// ========== 管理接口（需认证）==========

// 获取所有应用（含离线的）
router.get('/', authenticateToken, (_req: AuthRequest, res: Response) => {
  const apps = db.prepare(`
    SELECT a.*,
      av.version_code, av.version_name, av.package_name,
      av.is_latest, av.upload_time as latest_upload_time,
      wc.web_url, wc.display_mode
    FROM apps a
    LEFT JOIN apk_versions av ON a.id = av.app_id AND av.is_latest = 1
    LEFT JOIN web_configs wc ON a.id = wc.app_id
    ORDER BY a.updated_at DESC
  `).all();

  res.json({ code: 200, message: '获取成功', data: apps });
});

// 获取单个应用详情
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(req.params.id) as any;
  if (!app) {
    res.status(404).json({ code: 404, message: '应用不存在' });
    return;
  }

  // 获取所有版本
  const versions = db.prepare(
    'SELECT * FROM apk_versions WHERE app_id = ? ORDER BY version_code DESC'
  ).all(req.params.id);

  // 获取 Web 配置
  const webConfig = db.prepare(
    'SELECT * FROM web_configs WHERE app_id = ?'
  ).get(req.params.id);

  res.json({
    code: 200,
    message: '获取成功',
    data: { ...app, versions, web_config: webConfig || null },
  });
});

// 创建应用
router.post('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, description, icon_url, type, category } = req.body;

  if (!name) {
    res.status(400).json({ code: 400, message: '应用名称不能为空' });
    return;
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO apps (id, name, description, icon_url, type, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, name, description || '', icon_url || '', type || 'APK', category || '未排序');

  // 如果是 Web 类型，同时创建 web_configs 记录
  if (type === 'WEB') {
    db.prepare(`
      INSERT INTO web_configs (id, app_id, web_url, display_mode)
      VALUES (?, ?, ?, ?)
    `).run(uuidv4(), id, req.body.web_url || '', req.body.display_mode || 'webview');
  }

  res.json({ code: 200, message: '创建成功', data: { id } });
});

// 更新应用
router.put('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const { name, description, icon_url, type, category, status } = req.body;
  const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(req.params.id);

  if (!app) {
    res.status(404).json({ code: 404, message: '应用不存在' });
    return;
  }

  db.prepare(`
    UPDATE apps SET
      name = ?, description = ?, icon_url = ?, type = ?, category = ?, status = ?,
      updated_at = datetime('now', 'localtime')
    WHERE id = ?
  `).run(
    name || (app as any).name,
    description !== undefined ? description : (app as any).description,
    icon_url !== undefined ? icon_url : (app as any).icon_url,
    type || (app as any).type,
    category || (app as any).category,
    status || (app as any).status,
    req.params.id
  );

  // 更新 Web 配置
  if (type === 'WEB' && (req.body.web_url || req.body.display_mode)) {
    const existing = db.prepare('SELECT id FROM web_configs WHERE app_id = ?').get(req.params.id);
    if (existing) {
      db.prepare(`
        UPDATE web_configs SET web_url = ?, display_mode = ? WHERE app_id = ?
      `).run(
        req.body.web_url || '',
        req.body.display_mode || 'webview',
        req.params.id
      );
    } else {
      db.prepare(`
        INSERT INTO web_configs (id, app_id, web_url, display_mode) VALUES (?, ?, ?, ?)
      `).run(uuidv4(), req.params.id, req.body.web_url || '', req.body.display_mode || 'webview');
    }
  }

  res.json({ code: 200, message: '更新成功' });
});

// 删除应用
router.delete('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(req.params.id);
  if (!app) {
    res.status(404).json({ code: 404, message: '应用不存在' });
    return;
  }

  db.prepare('DELETE FROM apps WHERE id = ?').run(req.params.id);
  res.json({ code: 200, message: '删除成功' });
});

// 上传 APK 版本
router.post('/:id/versions', authenticateToken, (req: AuthRequest, res: Response) => {
  const { version_code, version_name, package_name, apk_url, file_size, min_sdk, changelog } = req.body;
  const app = db.prepare('SELECT * FROM apps WHERE id = ?').get(req.params.id);

  if (!app) {
    res.status(404).json({ code: 404, message: '应用不存在' });
    return;
  }

  if (!version_code || !version_name || !apk_url) {
    res.status(400).json({ code: 400, message: '版本号、版本名和 APK 地址不能为空' });
    return;
  }

  // 检查版本号是否已存在
  const existing = db.prepare(
    'SELECT id FROM apk_versions WHERE app_id = ? AND version_code = ?'
  ).get(req.params.id, version_code);

  if (existing) {
    res.status(400).json({ code: 400, message: '该版本号已存在' });
    return;
  }

  const id = uuidv4();

  // 如果是更高版本，更新 latest 标记
  const latestVersion = db.prepare(
    'SELECT version_code FROM apk_versions WHERE app_id = ? ORDER BY version_code DESC LIMIT 1'
  ).get(req.params.id) as any;

  const isLatest = !latestVersion || version_code > latestVersion.version_code;

  if (isLatest) {
    db.prepare('UPDATE apk_versions SET is_latest = 0 WHERE app_id = ?').run(req.params.id);
  }

  db.prepare(`
    INSERT INTO apk_versions (id, app_id, version_code, version_name, package_name, apk_url, file_size, min_sdk, changelog, is_latest)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, version_code, version_name, package_name || '', apk_url, file_size || 0, min_sdk || 21, changelog || '', isLatest ? 1 : 0);

  // 更新应用的更新时间
  db.prepare("UPDATE apps SET updated_at = datetime('now', 'localtime') WHERE id = ?").run(req.params.id);

  res.json({ code: 200, message: '版本上传成功', data: { id } });
});

// 删除版本
router.delete('/:id/versions/:versionId', authenticateToken, (req: AuthRequest, res: Response) => {
  const version = db.prepare(
    'SELECT * FROM apk_versions WHERE id = ? AND app_id = ?'
  ).get(req.params.versionId, req.params.id) as any;

  if (!version) {
    res.status(404).json({ code: 404, message: '版本不存在' });
    return;
  }

  db.prepare('DELETE FROM apk_versions WHERE id = ?').run(req.params.versionId);

  // 如果删除的是最新版本，重新标记
  if (version.is_latest) {
    const newLatest = db.prepare(
      'SELECT id FROM apk_versions WHERE app_id = ? ORDER BY version_code DESC LIMIT 1'
    ).get(req.params.id) as any;
    if (newLatest) {
      db.prepare('UPDATE apk_versions SET is_latest = 1 WHERE id = ?').run(newLatest.id);
    }
  }

  res.json({ code: 200, message: '删除成功' });
});

// 设置某个版本为最新版本
router.patch('/:id/versions/:versionId/set-latest', authenticateToken, (req: AuthRequest, res: Response) => {
  const version = db.prepare(
    'SELECT * FROM apk_versions WHERE id = ? AND app_id = ?'
  ).get(req.params.versionId, req.params.id);

  if (!version) {
    res.status(404).json({ code: 404, message: '版本不存在' });
    return;
  }

  db.prepare('UPDATE apk_versions SET is_latest = 0 WHERE app_id = ?').run(req.params.id);
  db.prepare('UPDATE apk_versions SET is_latest = 1 WHERE id = ?').run(req.params.versionId);

  res.json({ code: 200, message: '设置成功' });
});

export default router;
