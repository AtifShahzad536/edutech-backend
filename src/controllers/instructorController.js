const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const User = require('../models/User');

// @desc    Get instructor dashboard stats
// @route   GET /api/instructor/stats
// @access  Private (Instructor)
const getInstructorStats = async (req, res) => {
  try {
    const courses = await Course.find({ instructorId: req.user.id });
    const courseIds = courses.map(c => c._id);

    // Total students (unique enrollment counts across all instructor's courses)
    const totalStudents = courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);

    // Total Revenue aggregation (Rough estimate: price * studentsCount)
    // In a production app, this would sum up successful Payment records
    const totalRevenue = courses.reduce((sum, c) => sum + ((c.price || 0) * (c.studentsCount || 0)), 0);

    // Average rating (mean of rating field across all instructor's courses)
    const avgRating = courses.length > 0 
      ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1)
      : 0;

    const activeAssignments = await Assignment.countDocuments({
      instructor: req.user.id,
      status: 'active'
    });

    // Recent submissions to review
    const recentSubmissions = await Submission.find({
      assignment: { $in: await Assignment.find({ instructor: req.user.id }).select('_id') },
      status: 'submitted'
    })
    .populate('student', 'firstName lastName avatar')
    .populate('assignment', 'title')
    .sort({ submittedAt: -1 })
    .limit(5);

    res.json({
      success: true,
      stats: {
        totalCourses: courses.length,
        totalStudents,
        activeAssignments,
        totalRevenue,
        rating: avgRating
      },
      recentSubmissions: recentSubmissions.map(s => ({
        id: s._id,
        studentName: `${s.student?.firstName} ${s.student?.lastName}`,
        assignmentTitle: s.assignment?.title,
        submittedAt: new Date(s.submittedAt).toLocaleDateString(),
        status: 'To Review'
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get instructor courses
// @route   GET /api/instructor/courses
// @access  Private (Instructor)
const getInstructorCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructorId: req.user.id });
    res.json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get real students enrolled in instructor's courses
// @route   GET /api/instructor/students
// @access  Private (Instructor)
const getInstructorStudents = async (req, res) => {
  try {
    const instructorCourses = await Course.find({ instructorId: req.user.id }).select('_id title');
    const courseIds = instructorCourses.map(c => c._id);

    // Find all users who are students and enrolled in at least one of these courses
    const students = await User.find({
      role: 'student',
      enrolledCourses: { $in: courseIds }
    }).select('firstName lastName email avatar enrolledCourses createdAt');

    // Mapped response with course titles specifically for this instructor
    const mappedStudents = students.map(student => {
      // Find which of the student's courses belong to THIS instructor
      const matchingCourseIds = student.enrolledCourses.filter(cid => 
        courseIds.some(icid => icid.toString() === cid.toString())
      );
      
      const matchingCourses = matchingCourseIds.map(cid => {
        const c = instructorCourses.find(ic => ic._id.toString() === cid.toString());
        return c ? c.title : 'Unknown Course';
      });

      return {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        avatar: student.avatar,
        course: matchingCourses[0] || 'N/A', // Primary course for this instructor
        allCourses: matchingCourses,
        joinedAt: student.createdAt,
        status: 'active' // Placeholder status
      };
    });

    res.json({ success: true, count: mappedStudents.length, data: mappedStudents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getInstructorStats,
  getInstructorCourses,
  getInstructorStudents
};
