const mongoose = require('mongoose');

const scheduleSlotSchema = new mongoose.Schema(
  {
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teacherName: { type: String, required: true },
    subject: { type: String, required: true, trim: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    startTime: { type: String, required: true }, // HH:MM
    endTime: { type: String, required: true },   // HH:MM
    maxStudents: { type: Number, default: 30 },
    enrolledStudents: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        email: String,
        enrolledAt: { type: Date, default: Date.now }
      }
    ],
    room: { type: String, trim: true },
    description: { type: String, trim: true }
  },
  { timestamps: true }
);

scheduleSlotSchema.virtual('availableSpots').get(function() {
  return Math.max(0, this.maxStudents - this.enrolledStudents.length);
});

scheduleSlotSchema.set('toJSON', { virtuals: true });
scheduleSlotSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ScheduleSlot', scheduleSlotSchema);
