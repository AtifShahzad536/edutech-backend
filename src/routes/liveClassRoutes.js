const express = require('express');
const {
  startLiveClass,
  endLiveClass,
  getLiveClassesByCourse,
  getLiveClasses,
  getLiveClassById,
  updateStatus,
  scheduleLiveClass,
  pusherTrigger
} = require('../controllers/liveClassController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

// Student/Instructor: Get all live classes (role-aware)
router.get('/', getLiveClasses);

// Get by ID (enrolled/instructor check inside controller)  
router.get('/:id', getLiveClassById);

// Get live classes for a specific course
router.get('/course/:courseId', getLiveClassesByCourse);

// Instructor only routes
router.post('/start', authorize('instructor', 'admin'), startLiveClass);
router.post('/schedule', authorize('instructor', 'admin'), scheduleLiveClass);
router.post('/:id/end', authorize('instructor', 'admin'), endLiveClass);
router.patch('/:id/status', authorize('instructor', 'admin'), updateStatus);

// Real-time Trigger (Serverless-friendly)
router.post('/pusher/trigger', pusherTrigger);

module.exports = router;
