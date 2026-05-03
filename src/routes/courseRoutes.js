const express = require('express');
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollFree,
  getEnrolledCourses,
  getCourseAnalytics
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate.middleware');
const { createCourseSchema, updateCourseSchema } = require('../validators/course.validator');

const router = express.Router();

// Public routes
router.get('/', getCourses);
router.get('/analytics', protect, authorize('admin'), getCourseAnalytics);

// Protected student routes (must come BEFORE /:id to avoid conflicts)
router.get('/enrolled', protect, getEnrolledCourses);
router.post('/:id/enroll-free', protect, authorize('student'), enrollFree);

// Public single course
router.get('/:id', getCourse);

// Instructor / Admin create/update/delete
router.post('/', protect, authorize('instructor', 'admin'), validate(createCourseSchema), createCourse);
router.put('/:id', protect, authorize('instructor', 'admin'), validate(updateCourseSchema), updateCourse);
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse);

module.exports = router;
