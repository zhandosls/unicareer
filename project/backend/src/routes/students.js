const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// GET /api/students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

// POST /api/students
router.post('/', async (req, res) => {
  const { name, email } = req.body;

  const errors = [];
  if (!name || name.trim().length < 2)
    errors.push('Name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('A valid email is required');

  if (errors.length > 0)
    return res.status(400).json({ success: false, errors });

  try {
    const student = await Student.create({ name, email });
    res.status(201).json({
      success: true,
      message: 'RSVP confirmed successfully',
      data: student
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, errors: ["You've already RSVP'd with this email"] });
    }
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

module.exports = router;
