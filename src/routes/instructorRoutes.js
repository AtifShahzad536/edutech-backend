const express = require('express');
const { 
  getInstructorStats, 
  getInstructorCourses,
  getInstructorStudents 
} = require('../controllers/instructorController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('instructor', 'admin'));

router.get('/stats', getInstructorStats);
router.get('/courses', getInstructorCourses);
router.get('/students', getInstructorStudents);

module.exports = router;
