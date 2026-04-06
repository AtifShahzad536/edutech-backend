const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  enrollFree,
  getEnrolledCourses,
  getCourseAnalytics
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/analytics', protect, authorize('admin'), getCourseAnalytics);

// Protected student routes (must come BEFORE /:id to avoid conflicts)
router.get('/enrolled', protect, getEnrolledCourses);
router.post('/:id/enroll-free', protect, authorize('student'), enrollFree);

// Public single course
router.get('/:id', getCourse);

// Instructor / Admin create/update
router.post('/', protect, authorize('instructor', 'admin'), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse);

module.exports = router;
