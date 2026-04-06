const express = require('express');
const {
  getDashboardStats,
  markLessonComplete,
  getCourseProgress
} = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/stats', getDashboardStats);
router.post('/progress/lesson', markLessonComplete);
router.get('/progress/:courseId', getCourseProgress);

module.exports = router;
