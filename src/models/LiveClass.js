const mongoose = require('mongoose');

const LiveChatMessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: String,
  senderRole: String,
  text: String,
  timestamp: { type: Date, default: Date.now }
});

const liveClassSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  module: { type: String, default: 'General' },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'ended', 'online'],
    default: 'upcoming'
  },
  scheduledFor: { type: Date, default: Date.now },
  startedAt: Date,
  endedAt: Date,
  duration: String,
  roomId: { type: String, unique: true },
  peers: { type: Number, default: 0 },
  recordingUrl: { type: String, default: '' },
  chatMessages: [LiveChatMessageSchema],
  addedToCurriculum: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('LiveClass', liveClassSchema);
