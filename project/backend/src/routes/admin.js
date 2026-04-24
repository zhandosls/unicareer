const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Job = require('../models/Job');
const ScheduleSlot = require('../models/ScheduleSlot');
const { requireAuth, requireRole } = require('../middleware/auth');

const adminOnly = [requireAuth, requireRole('admin')];

// ── USERS ──────────────────────────────────────
router.get('/users', ...adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/users/:id/role', ...adminOnly, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student','teacher','employer','admin'].includes(role))
      return res.status(400).json({ success: false, error: 'Недопустимая роль' });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-passwordHash');
    if (!user) return res.status(404).json({ success: false, error: 'Пользователь не найден' });
    res.json({ success: true, data: user });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/users/:id', ...adminOnly, async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString())
      return res.status(400).json({ success: false, error: 'Нельзя удалить себя' });
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Пользователь удалён' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── JOBS ──────────────────────────────────────
router.get('/jobs', ...adminOnly, async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json({ success: true, data: jobs });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/jobs/:id', ...adminOnly, async (req, res) => {
  try {
    await Job.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Вакансия удалена' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.put('/jobs/:id/toggle', ...adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Не найдено' });
    job.isActive = !job.isActive;
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/jobs/:id/applicant/:userId', ...adminOnly, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ success: false, error: 'Не найдено' });
    job.applicants = job.applicants.filter(a => a.userId?.toString() !== req.params.userId);
    await job.save();
    res.json({ success: true, data: job });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── SCHEDULE ──────────────────────────────────
router.get('/schedule', ...adminOnly, async (req, res) => {
  try {
    const slots = await ScheduleSlot.find().sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: slots });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/schedule/:id', ...adminOnly, async (req, res) => {
  try {
    await ScheduleSlot.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Занятие удалено' });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

router.delete('/schedule/:id/student/:userId', ...adminOnly, async (req, res) => {
  try {
    const slot = await ScheduleSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, error: 'Не найдено' });
    slot.enrolledStudents = slot.enrolledStudents.filter(s => s.userId?.toString() !== req.params.userId);
    await slot.save();
    res.json({ success: true, data: slot });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// ── STATS ─────────────────────────────────────
router.get('/stats', ...adminOnly, async (req, res) => {
  try {
    const [totalUsers, totalJobs, totalSlots, students, employers, teachers] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      ScheduleSlot.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'employer' }),
      User.countDocuments({ role: 'teacher' }),
    ]);
    const jobs = await Job.find();
    const totalApplications = jobs.reduce((sum, j) => sum + j.applicants.length, 0);
    const slots = await ScheduleSlot.find();
    const totalEnrollments = slots.reduce((sum, s) => sum + s.enrolledStudents.length, 0);
    res.json({ success: true, data: { totalUsers, totalJobs, totalSlots, students, employers, teachers, totalApplications, totalEnrollments } });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

module.exports = router;
