const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Название вакансии обязательно'],
      trim: true
    },
    company: {
      type: String,
      required: [true, 'Компания обязательна'],
      trim: true
    },
    employerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    type: {
      type: String,
      enum: ['full', 'intern', 'part'],
      default: 'full'
    },
    salary: { type: String, trim: true },
    location: { type: String, trim: true },
    skills: [{ type: String, trim: true }],
    description: { type: String, trim: true },
    totalSlots: {
      type: Number,
      default: 10,
      min: 1
    },
    applicants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name: String,
        email: String,
        appliedAt: { type: Date, default: Date.now }
      }
    ],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

jobSchema.virtual('takenSlots').get(function() {
  return this.applicants.length;
});

jobSchema.virtual('freeSlots').get(function() {
  return Math.max(0, this.totalSlots - this.applicants.length);
});

jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Job', jobSchema);
