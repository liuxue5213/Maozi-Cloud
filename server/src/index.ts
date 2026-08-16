import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth';
import appRoutes from './routes/apps';
import fileRoutes from './routes/files';
import { initDatabase, initDefaultAdmin } from './db/init';

const app = express();
const PORT = process.env.PORT || 3001;

// 初始化数据库
initDatabase();
initDefaultAdmin();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件（上传的文件）
app.use('/api/files/download', express.static(path.join(__dirname, '../uploads')));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/files', fileRoutes);

// 健康检查
app.get('/api/health', (_req, res) => {
  res.json({ code: 200, message: '毛子云服务运行正常', timestamp: new Date().toISOString() });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║       🐱 毛子云 - Maozi Cloud             ║
  ║       服务已启动，端口: ${PORT}               ║
  ║                                           ║
  ║       API: http://localhost:${PORT}/api      ║
  ║       健康检查: /api/health                ║
  ╚═══════════════════════════════════════════╝
  `);
});

export default app;
