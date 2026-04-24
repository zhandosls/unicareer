const express = require('express');
const router = express.Router();
const Employer = require('../models/Employer');

// GET /api/employers
router.get('/', async (req, res) => {
  try {
    const employers = await Employer.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: employers.length,
      data: employers
    });
  } catch (err) {
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

// POST /api/employers
router.post('/', async (req, res) => {
  const { companyName, email, description } = req.body;

  // Manual validation
  const errors = [];
  if (!companyName || companyName.trim().length < 2)
    errors.push('Company name must be at least 2 characters');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push('A valid email is required');
  if (!description || description.trim().length < 10)
    errors.push('Description must be at least 10 characters');

  if (errors.length > 0)
    return res.status(400).json({ success: false, errors });

  try {
    const employer = await Employer.create({ companyName, email, description });
    res.status(201).json({
      success: true,
      message: 'Employer registered successfully',
      data: employer
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, errors: ['This email is already registered'] });
    }
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

module.exports = router;
