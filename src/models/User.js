const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true,
    index: true 
  },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['student', 'instructor', 'admin'], 
    default: 'student',
    index: true 
  },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  phone: { type: String, default: '' },
  location: { type: String, default: '' },
  website: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  skills: [String],
  experience: [{
    title: String,
    company: String,
    location: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    school: String,
    duration: String,
    fieldOfStudy: String
  }],
  notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
  enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Password Hashing Middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Compare Password Method
UserSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', UserSchema);
