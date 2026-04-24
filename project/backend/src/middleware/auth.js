const User = require('../models/User');

// Simple token: base64(userId:role:timestamp)
function createToken(user) {
  const payload = `${user._id}:${user.role}:${Date.now()}`;
  return Buffer.from(payload).toString('base64');
}

function parseToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const [userId, role] = decoded.split(':');
    return { userId, role };
  } catch {
    return null;
  }
}

async function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Требуется авторизация' });
  }
  const token = auth.slice(7);
  const parsed = parseToken(token);
  if (!parsed) {
    return res.status(401).json({ success: false, error: 'Неверный токен' });
  }
  const user = await User.findById(parsed.userId);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Пользователь не найден' });
  }
  req.user = user;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, error: 'Требуется авторизация' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Нет прав доступа' });
    }
    next();
  };
}

module.exports = { createToken, requireAuth, requireRole };
