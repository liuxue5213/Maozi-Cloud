import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '../uploads');

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 存储配置
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB 上限
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.apk' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.webp' || ext === '.svg') {
      cb(null, true);
    } else {
      cb(new Error('仅支持 APK 和图片文件'));
    }
  },
});

// 上传 APK 文件
router.post('/upload/apk', authenticateToken, (req: AuthRequest, res: Response) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ code: 400, message: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ code: 400, message: '请选择要上传的文件' });
      return;
    }

    const fileUrl = `/api/files/download/${req.file.filename}`;

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        file_url: fileUrl,
        file_name: req.file.filename,
        original_name: req.file.originalname,
        file_size: req.file.size,
      },
    });
  });
});

// 上传图片（应用图标等）
router.post('/upload/image', authenticateToken, (req: AuthRequest, res: Response) => {
  const uploadSingle = upload.single('file');

  uploadSingle(req, res, (err: any) => {
    if (err) {
      res.status(400).json({ code: 400, message: err.message });
      return;
    }

    if (!req.file) {
      res.status(400).json({ code: 400, message: '请选择要上传的图片' });
      return;
    }

    const fileUrl = `/api/files/download/${req.file.filename}`;

    res.json({
      code: 200,
      message: '上传成功',
      data: {
        file_url: fileUrl,
        file_name: req.file.filename,
        original_name: req.file.originalname,
      },
    });
  });
});

// 文件下载/访问
router.get('/download/:filename', (req: Request, res: Response) => {
  const filename = req.params.filename;
  const filePath = path.join(uploadDir, filename);

  // 安全检查：防止路径遍历
  if (!filePath.startsWith(uploadDir)) {
    res.status(403).json({ code: 403, message: '非法访问' });
    return;
  }

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ code: 404, message: '文件不存在' });
    return;
  }

  res.download(filePath);
});

export default router;
