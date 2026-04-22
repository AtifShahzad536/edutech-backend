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
const validate = require('../middleware/validate.middleware');
const { 
  createAssignmentSchema, 
  submitAssignmentSchema, 
  gradeSubmissionSchema 
} = require('../validators/assignment.validator');

const router = express.Router();

router.use(protect);

router.post('/', authorize('instructor', 'admin'), validate(createAssignmentSchema), createAssignment);
router.get('/my', getMyAssignments);
router.get('/instructor', authorize('instructor', 'admin'), getInstructorAssignments);
router.get('/course/:courseId', getCourseAssignments);
router.get('/student/submissions', getStudentSubmissions);
router.post('/:id/submit', authorize('student', 'admin'), validate(submitAssignmentSchema), submitAssignment);
router.patch('/submissions/:id/grade', authorize('instructor', 'admin'), validate(gradeSubmissionSchema), gradeSubmission);
router.get('/:id', getAssignmentById);
router.put('/:id', authorize('instructor', 'admin'), validate(createAssignmentSchema), updateAssignment); // Share create schema roughly
router.delete('/:id', authorize('instructor', 'admin'), deleteAssignment);
router.get('/:id/submissions', authorize('instructor', 'admin'), getAssignmentSubmissions);

module.exports = router;
