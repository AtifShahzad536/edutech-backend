const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'payment', 'email', 'security'],
    default: 'general'
  }
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema);
