const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/jobs — all active jobs
router.get('/', async (req, res) => {
  try {
    const jobs = await Job.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Вакансия не найдена' });
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jobs — employer creates vacancy
router.post('/', requireAuth, requireRole('employer', 'admin'), async (req, res) => {
  const { title, type, salary, location, skills, description, totalSlots } = req.body;
  const errors = [];
  if (!title || title.trim().length < 3) errors.push('Название минимум 3 символа');
  if (!['full', 'intern', 'part'].includes(type)) errors.push('Тип вакансии некорректен');
  if (errors.length) return res.status(400).json({ success: false, errors });

  try {
    const job = await Job.create({
      title,
      company: req.user.companyName || req.user.name,
      employerId: req.user._id,
      type,
      salary,
      location,
      skills: Array.isArray(skills) ? skills : (skills || '').split(',').map(s => s.trim()).filter(Boolean),
      description,
      totalSlots: totalSlots || 10
    });
    res.status(201).json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/jobs/:id — employer updates own vacancy
router.put('/:id', requireAuth, requireRole('employer', 'admin'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Вакансия не найдена' });
    if (job.employerId?.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Нет прав' });
    }
    const { title, type, salary, location, skills, description, totalSlots, isActive } = req.body;
    if (title) job.title = title;
    if (type) job.type = type;
    if (salary !== undefined) job.salary = salary;
    if (location !== undefined) job.location = location;
    if (skills) job.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    if (description !== undefined) job.description = description;
    if (totalSlots) job.totalSlots = totalSlots;
    if (isActive !== undefined) job.isActive = isActive;
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/jobs/:id/apply — student applies for job
router.post('/:id/apply', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Вакансия не найдена' });
    if (job.freeSlots <= 0) return res.status(400).json({ success: false, error: 'Все места заняты' });
    const already = job.applicants.find(a => a.userId?.toString() === req.user._id.toString());
    if (already) return res.status(409).json({ success: false, error: 'Вы уже подали заявку на эту вакансию' });
    job.applicants.push({ userId: req.user._id, name: req.user.name, email: req.user.email });
    await job.save();
    res.json({ success: true, data: job, message: 'Заявка подана успешно!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/jobs/:id/apply — student cancels application
router.delete('/:id/apply', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Вакансия не найдена' });
    const before = job.applicants.length;
    job.applicants = job.applicants.filter(a => a.userId?.toString() !== req.user._id.toString());
    if (job.applicants.length === before) {
      return res.status(404).json({ success: false, error: 'Заявка не найдена' });
    }
    await job.save();
    res.json({ success: true, message: 'Заявка отменена' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/jobs/my/applications — student sees their applications
router.get('/my/applications', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const jobs = await Job.find({ 'applicants.userId': req.user._id });
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/jobs/my/postings — employer sees their vacancies
router.get('/my/postings', requireAuth, requireRole('employer', 'admin'), async (req, res) => {
  try {
    const jobs = await Job.find({ employerId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
