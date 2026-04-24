const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { createToken, requireAuth } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, companyName, companyDescription, department, specialty, year } = req.body;
  const errors = [];
  if (!name || name.trim().length < 2) errors.push('Имя минимум 2 символа');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Введите корректный email');
  if (!password || password.length < 6) errors.push('Пароль минимум 6 символов');
  if (!['student', 'teacher', 'employer'].includes(role)) errors.push('Недопустимая роль');
  if (role === 'employer' && !companyName) errors.push('Название компании обязательно');
  if (errors.length) return res.status(400).json({ success: false, errors });

  try {
    const user = new User({ name, email, role, companyName, companyDescription, department, specialty, year });
    user.setPassword(password);
    await user.save();
    const token = createToken(user);
    res.status(201).json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, companyName: user.companyName }
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, errors: ['Этот email уже зарегистрирован'] });
    }
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, errors: ['Email и пароль обязательны'] });
  }
  try {
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.checkPassword(password)) {
      return res.status(401).json({ success: false, errors: ['Неверный email или пароль'] });
    }
    const token = createToken(user);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, companyName: user.companyName }
    });
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: { id: u._id, name: u.name, email: u.email, role: u.role, companyName: u.companyName, department: u.department }
  });
});

// PUT /api/auth/profile — update own profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const { name, department, specialty, companyDescription } = req.body;
    const user = req.user;
    if (name && name.trim().length >= 2) user.name = name.trim();
    if (department !== undefined) user.department = department;
    if (specialty !== undefined) user.specialty = specialty;
    if (companyDescription !== undefined) user.companyDescription = companyDescription;
    if (req.body.password && req.body.password.length >= 6) user.setPassword(req.body.password);
    await user.save();
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role, companyName: user.companyName, department: user.department, specialty: user.specialty } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
