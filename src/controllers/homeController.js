const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get home page stats (real from DB)
// @route   GET /api/home/stats
// @access  Public
const getHomeStats = async (req, res) => {
  try {
    const [totalCourses, totalStudents, totalInstructors] = await Promise.all([
      Course.countDocuments({ isPublished: true }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'instructor' })
    ]);

    res.json({
      success: true,
      stats: {
        totalCourses,
        totalStudents,
        totalInstructors,
        totalCertificates: totalStudents * 2, // Simulated
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get featured courses for home page
// @route   GET /api/home/featured-courses
// @access  Public
const getFeaturedCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructorId', 'firstName lastName avatar')
      .sort({ rating: -1, studentsCount: -1 })
      .limit(8);

    res.json({
      success: true,
      data: courses.map(course => ({
        id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        price: course.price,
        originalPrice: course.originalPrice,
        category: course.category,
        level: course.level,
        rating: course.rating,
        studentsCount: course.studentsCount,
        reviewsCount: course.reviewsCount,
        lessonsCount: course.lessonsCount,
        duration: course.duration,
        instructor: course.instructorId
          ? `${course.instructorId.firstName} ${course.instructorId.lastName}`
          : 'Expert Instructor',
        instructorAvatar: course.instructorId?.avatar || '',
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get latest courses
// @route   GET /api/home/latest-courses
// @access  Public
const getLatestCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate('instructorId', 'firstName lastName avatar')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: courses.map(course => ({
        id: course._id,
        title: course.title,
        thumbnail: course.thumbnail,
        price: course.price,
        rating: course.rating,
        studentsCount: course.studentsCount,
        category: course.category,
        level: course.level,
        instructor: course.instructorId
          ? `${course.instructorId.firstName} ${course.instructorId.lastName}`
          : 'Expert Instructor',
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getHomeStats, getFeaturedCourses, getLatestCourses };
