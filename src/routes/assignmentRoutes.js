const express = require('express');
const { 
  createAssignment, 
  getCourseAssignments, 
  submitAssignment, 
  gradeSubmission,
  getStudentSubmissions,
  getAssignmentById,
  getMyAssignments,
  getInstructorAssignments,
  getAssignmentSubmissions,
  updateAssignment,
  deleteAssignment
} = require('../controllers/assignmentController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect); // All routes require authentication

router.post('/', authorize('instructor', 'admin'), createAssignment);
router.get('/my', getMyAssignments);                    // Student: all my assignments
router.get('/instructor', authorize('instructor', 'admin'), getInstructorAssignments);
router.get('/course/:courseId', getCourseAssignments);
router.get('/student/submissions', getStudentSubmissions);
router.post('/:id/submit', authorize('student', 'admin'), submitAssignment);
router.patch('/submissions/:id/grade', authorize('instructor', 'admin'), gradeSubmission);
router.get('/:id', getAssignmentById);
router.put('/:id', authorize('instructor', 'admin'), updateAssignment);
router.delete('/:id', authorize('instructor', 'admin'), deleteAssignment);
router.get('/:id/submissions', authorize('instructor', 'admin'), getAssignmentSubmissions);

module.exports = router;
