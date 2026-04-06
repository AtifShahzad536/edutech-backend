const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [String],
  grade: {
    type: Number,
    default: null
  },
  feedback: String,
  status: {
    type: String,
    enum: ['submitted', 'graded', 'overdue'],
    default: 'submitted'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  gradedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Submission', submissionSchema);
