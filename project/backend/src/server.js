require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const jobRoutes = require('./routes/jobs');
const scheduleRoutes = require('./routes/schedule');
const adminRoutes = require('./routes/admin');
const employerRoutes = require('./routes/employers');
const studentRoutes = require('./routes/students');
const seedDatabase = require('./models/seed');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://jandos:jandos05@careerfair.ktfvcal.mongodb.net/?retryWrites=true&w=majority&appName=CareerFair';

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/students', studentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Career Fair API is running',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    time: new Date().toISOString()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect to MongoDB then start server
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log(`✅ MongoDB connected: ${MONGODB_URI}`);
    await seedDatabase();
    app.listen(PORT, () => {
      console.log(`\n🚀 Career Fair API running on http://localhost:${PORT}`);
      console.log(`📋 Endpoints:`);
      console.log(`   GET  /api/employers`);
      console.log(`   POST /api/employers`);
      console.log(`   GET  /api/students`);
      console.log(`   POST /api/students\n`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Make sure MongoDB is running: mongod --dbpath /data/db');
    process.exit(1);
  });
