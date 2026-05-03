const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'text', 'quiz', 'live'], default: 'video' },
  content: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  duration: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  passingScore: { type: Number, default: 80 },
  quizQuestions: [{
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctOptionIndex: { type: Number, required: true, min: 0 }
  }],
  resources: [{
    title: { type: String },
    url: { type: String },
    fileType: { type: String, default: 'pdf' }
  }]
});

const SectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
  lessons: [LessonSchema]
});

const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, index: 'text' },
  description: { type: String, required: true },
  thumbnail: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  originalPrice: { type: Number, min: 0 },
  instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { 
    type: String, 
    enum: ['Development', 'Design', 'Data Science', 'Business', 'Marketing'], 
    required: true,
    index: true 
  },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all'], default: 'all' },
  duration: { type: Number, default: 0 },
  lessonsCount: { type: Number, default: 0 },
  studentsCount: { type: Number, default: 0, index: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false, index: true },
  sections: [SectionSchema]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field for instructor to map 'instructorId' to 'instructor'
CourseSchema.virtual('instructor', {
  ref: 'User',
  localField: 'instructorId',
  foreignField: '_id',
  justOne: true
});

CourseSchema.index({ category: 1, isPublished: 1, rating: -1 });

module.exports = mongoose.model('Course', CourseSchema);
