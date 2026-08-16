import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../config/database';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// 登录
router.post('/login', (req: any, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    return;
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
  if (!admin) {
    res.status(401).json({ code: 401, message: '用户名或密码错误' });
    return;
  }

  const isValid = bcrypt.compareSync(password, admin.password);
  if (!isValid) {
    res.status(401).json({ code: 401, message: '用户名或密码错误' });
    return;
  }

  const token = generateToken(username);
  res.json({
    code: 200,
    message: '登录成功',
    data: {
      token,
      username,
    },
  });
});

// 验证 Token
router.get('/verify', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({
    code: 200,
    message: '令牌有效',
    data: { username: req.user?.username },
  });
});

export default router;
