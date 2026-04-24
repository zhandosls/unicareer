const express = require('express');
const router = express.Router();
const ScheduleSlot = require('../models/ScheduleSlot');
const { requireAuth, requireRole } = require('../middleware/auth');

// GET /api/schedule — all slots (optionally filter by date or teacherId)
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.teacherId) filter.teacherId = req.query.teacherId;
    if (req.query.date) filter.date = req.query.date;
    const slots = await ScheduleSlot.find(filter).sort({ date: 1, startTime: 1 });
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/schedule/my — current user's slots (teacher = their slots; student = enrolled slots)
router.get('/my', requireAuth, async (req, res) => {
  try {
    let slots;
    if (req.user.role === 'teacher') {
      slots = await ScheduleSlot.find({ teacherId: req.user._id }).sort({ date: 1, startTime: 1 });
    } else {
      slots = await ScheduleSlot.find({ 'enrolledStudents.userId': req.user._id }).sort({ date: 1, startTime: 1 });
    }
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedule — teacher creates a slot
router.post('/', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  const { subject, date, startTime, endTime, maxStudents, room, description } = req.body;
  const errors = [];
  if (!subject || subject.trim().length < 2) errors.push('Предмет обязателен');
  if (!date) errors.push('Дата обязательна');
  if (!startTime || !endTime) errors.push('Время начала и конца обязательны');
  if (errors.length) return res.status(400).json({ success: false, errors });

  try {
    const slot = await ScheduleSlot.create({
      teacherId: req.user._id,
      teacherName: req.user.name,
      subject,
      date,
      startTime,
      endTime,
      maxStudents: maxStudents || 30,
      room,
      description
    });
    res.status(201).json({ success: true, data: slot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/schedule/:id — teacher edits slot
router.put('/:id', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const slot = await ScheduleSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, error: 'Слот не найден' });
    if (slot.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Нет прав' });
    }
    const { subject, date, startTime, endTime, maxStudents, room, description } = req.body;
    if (subject) slot.subject = subject;
    if (date) slot.date = date;
    if (startTime) slot.startTime = startTime;
    if (endTime) slot.endTime = endTime;
    if (maxStudents) slot.maxStudents = maxStudents;
    if (room !== undefined) slot.room = room;
    if (description !== undefined) slot.description = description;
    await slot.save();
    res.json({ success: true, data: slot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/schedule/:id — teacher deletes slot
router.delete('/:id', requireAuth, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const slot = await ScheduleSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, error: 'Слот не найден' });
    if (slot.teacherId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Нет прав' });
    }
    await slot.deleteOne();
    res.json({ success: true, message: 'Слот удалён' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/schedule/:id/enroll — student enrolls in a slot
router.post('/:id/enroll', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const slot = await ScheduleSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, error: 'Слот не найден' });
    if (slot.availableSpots <= 0) return res.status(400).json({ success: false, error: 'Нет свободных мест' });
    const already = slot.enrolledStudents.find(s => s.userId?.toString() === req.user._id.toString());
    if (already) return res.status(409).json({ success: false, error: 'Вы уже записаны на это занятие' });
    slot.enrolledStudents.push({ userId: req.user._id, name: req.user.name, email: req.user.email });
    await slot.save();
    res.json({ success: true, data: slot, message: 'Вы успешно записались на занятие!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/schedule/:id/enroll — student unenrolls
router.delete('/:id/enroll', requireAuth, requireRole('student'), async (req, res) => {
  try {
    const slot = await ScheduleSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ success: false, error: 'Слот не найден' });
    slot.enrolledStudents = slot.enrolledStudents.filter(s => s.userId?.toString() !== req.user._id.toString());
    await slot.save();
    res.json({ success: true, message: 'Запись отменена' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
