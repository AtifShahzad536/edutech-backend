const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @desc    Get all assignments for student's enrolled courses (with submission status)
// @route   GET /api/assignments/my
// @access  Private (Student)
const getMyAssignments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('enrolledCourses');
    const enrolledCourseIds = user.enrolledCourses || [];

    // Get all assignments for enrolled courses
    const assignments = await Assignment.find({
      course: { $in: enrolledCourseIds },
      status: 'active'
    })
      .populate('course', 'title thumbnail category')
      .populate('instructor', 'firstName lastName avatar')
      .sort({ dueDate: 1 });

    // Get student's submissions for these assignments
    const assignmentIds = assignments.map(a => a._id);
    const submissions = await Submission.find({
      assignment: { $in: assignmentIds },
      student: req.user.id
    });

    // Merge assignment + submission status
    const merged = assignments.map(a => {
      const submission = submissions.find(s => s.assignment.toString() === a._id.toString());
      return {
        id: a._id,
        title: a.title,
        description: a.description,
        course: a.course?.title || 'General',
        courseId: a.course?._id,
        instructor: a.instructor ? `${a.instructor.firstName} ${a.instructor.lastName}` : 'Course Instructor',
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
        status: submission
          ? (submission.status === 'graded' ? 'graded' : 'submitted')
          : 'pending',
        score: submission?.grade || null,
        feedback: submission?.feedback || null,
        submittedAt: submission?.submittedAt || null,
        submissionId: submission?._id || null,
        attachments: a.attachments || []
      };
    });

    const stats = {
      pending: merged.filter(a => a.status === 'pending').length,
      submitted: merged.filter(a => a.status === 'submitted').length,
      graded: merged.filter(a => a.status === 'graded').length,
      avgGrade: (() => {
        const graded = merged.filter(a => a.status === 'graded' && a.score !== null);
        if (!graded.length) return null;
        const avg = graded.reduce((sum, a) => sum + (a.score / a.totalPoints) * 100, 0) / graded.length;
        return Math.round(avg);
      })()
    };

    res.json({ success: true, count: merged.length, stats, data: merged });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// @desc    Create a new assignment
// @route   POST /api/assignments
// @access  Private (Instructor)
const createAssignment = async (req, res) => {
  try {
    const { title, description, course, dueDate, totalPoints, attachments } = req.body;
    const assignment = await Assignment.create({
      title,
      description,
      course,
      instructor: req.user.id,
      dueDate,
      totalPoints,
      attachments: attachments || []
    });
    res.status(201).json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get course assignments
// @route   GET /api/assignments/course/:courseId
// @access  Private
const getCourseAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('instructor', 'firstName lastName avatar')
      .sort({ dueDate: 1 });
    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit an assignment
// @route   POST /api/assignments/:id/submit
// @access  Private (Student)
const submitAssignment = async (req, res) => {
  try {
    const { content, attachments } = req.body;
    
    // Check if user is enrolled in the course of this assignment
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    const user = await User.findById(req.user.id);
    if (!user.enrolledCourses.includes(assignment.course.toString()) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not enrolled in this course' });
    }

    // Check if already submitted
    const existingSubmission = await Submission.findOne({ 
      assignment: req.params.id, 
      student: req.user.id 
    });

    if (existingSubmission) {
      existingSubmission.content = content;
      existingSubmission.attachments = attachments;
      existingSubmission.status = 'submitted';
      existingSubmission.submittedAt = Date.now();
      await existingSubmission.save();
      return res.json({ success: true, data: existingSubmission });
    }

    const submission = await Submission.create({
      assignment: req.params.id,
      student: req.user.id,
      content,
      attachments
    });
    
    res.status(201).json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Grade a submission
// @route   PATCH /api/assignments/submissions/:id/grade
// @access  Private (Instructor)
const gradeSubmission = async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.id,
      { 
        grade, 
        feedback, 
        status: 'graded',
        gradedAt: Date.now()
      },
      { new: true }
    );
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get student submissions
// @route   GET /api/assignments/student/submissions
// @access  Private
const getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate('assignment', 'title course dueDate')
      .sort({ submittedAt: -1 });
    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get assignment by ID
// @route   GET /api/assignments/:id
// @access  Private
const getAssignmentById = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'title')
      .populate('instructor', 'firstName lastName avatar');
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }
    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all assignments for courses taught by the instructor
// @route   GET /api/assignments/instructor
// @access  Private (Instructor)
const getInstructorAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ instructor: req.user.id })
      .populate('course', 'title studentsCount')
      .sort({ createdAt: -1 });

    // Get submission counts for these assignments
    const assignmentIds = assignments.map(a => a._id);
    const submissionCounts = await Submission.aggregate([
      { $match: { assignment: { $in: assignmentIds } } },
      { $group: { _id: "$assignment", count: { $sum: 1 } } }
    ]);

    const data = assignments.map(a => {
      const subCount = submissionCounts.find(s => s._id.toString() === a._id.toString());
      return {
        id: a._id,
        title: a.title,
        description: a.description,
        course: a.course?.title || 'Unknown',
        courseId: a.course?._id,
        dueDate: a.dueDate,
        submissions: subCount ? subCount.count : 0,
        totalStudents: a.course?.studentsCount || 0,
        status: 'Active', // Could be dynamic based on date
        difficulty: a.difficulty || 'Intermediate',
        maxScore: a.totalPoints,
        attachments: a.attachments || []
      };
    });

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all submissions for a specific assignment
// @route   GET /api/assignments/:id/submissions
// @access  Private (Instructor)
const getAssignmentSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Ensure instructor owns the course
    const submissions = await Submission.find({ assignment: req.params.id })
      .populate('student', 'firstName lastName email avatar')
      .sort({ submittedAt: -1 });

    res.json({ success: true, count: submissions.length, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an assignment
// @route   PUT /api/assignments/:id
// @access  Private (Instructor)
const updateAssignment = async (req, res) => {
  try {
    const { title, description, course, dueDate, difficulty, totalPoints, attachments } = req.body;
    
    let assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Ensure instructor owns the assignment or is an admin
    if (assignment.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this assignment' });
    }

    assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { title, description, course, dueDate, difficulty, totalPoints, attachments },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: assignment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an assignment
// @route   DELETE /api/assignments/:id
// @access  Private (Instructor)
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return res.status(404).json({ success: false, message: 'Assignment not found' });
    }

    // Ensure instructor owns the assignment or is an admin
    if (assignment.instructor.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this assignment' });
    }

    await assignment.deleteOne();

    // Also remove all related submissions
    await Submission.deleteMany({ assignment: req.params.id });

    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyAssignments,
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  gradeSubmission,
  getStudentSubmissions,
  getAssignmentById,
  getInstructorAssignments,
  getAssignmentSubmissions,
  updateAssignment,
  deleteAssignment
};
