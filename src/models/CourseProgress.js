const mongoose = require('mongoose');

const CourseProgressSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  completedLessons: [{
    lessonId: { type: mongoose.Schema.Types.ObjectId },
    completedAt: { type: Date, default: Date.now }
  }],
  lastAccessedAt: { type: Date, default: Date.now },
  progressPercent: { type: Number, default: 0, min: 0, max: 100 }
}, {
  timestamps: true
});

CourseProgressSchema.index({ student: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('CourseProgress', CourseProgressSchema);
