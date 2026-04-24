const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Имя обязательно'],
      trim: true,
      minlength: [2, 'Имя минимум 2 символа']
    },
    email: {
      type: String,
      required: [true, 'Email обязателен'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Введите корректный email']
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'employer', 'admin'],
      default: 'student'
    },
    // employer-specific
    companyName: { type: String, trim: true },
    companyDescription: { type: String, trim: true },
    // teacher-specific
    department: { type: String, trim: true },
    // student-specific
    specialty: { type: String, trim: true },
    year: { type: Number }
  },
  { timestamps: true }
);

userSchema.methods.setPassword = function(password) {
  this.passwordHash = crypto.createHash('sha256').update(password + 'aitu-secret-2026').digest('hex');
};

userSchema.methods.checkPassword = function(password) {
  const hash = crypto.createHash('sha256').update(password + 'aitu-secret-2026').digest('hex');
  return this.passwordHash === hash;
};

module.exports = mongoose.model('User', userSchema);
