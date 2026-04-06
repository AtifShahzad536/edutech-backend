const User = require('../models/User');
const Course = require('../models/Course');
const Submission = require('../models/Submission');

// @desc    Get platform-wide statistics for admin
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const students = await User.countDocuments({ role: 'student' });
    const instructors = await User.countDocuments({ role: 'instructor' });
    
    const courses = await Course.find();
    const totalCourses = courses.length;
    const totalEnrollments = courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
    const totalRevenue = courses.reduce((sum, c) => sum + ((c.price || 0) * (c.studentsCount || 0)), 0);
    
    // Recent registrations
    const recentUsers = await User.find()
      .select('firstName lastName email role createdAt avatar')
      .sort({ createdAt: -1 })
      .limit(5);

    // Mock revenue history for the chart (would require a Transaction model for reality)
    const revenueHistory = [
      { month: 'Jan', revenue: Math.floor(totalRevenue * 0.6) },
      { month: 'Feb', revenue: Math.floor(totalRevenue * 0.7) },
      { month: 'Mar', revenue: Math.floor(totalRevenue * 0.8) },
      { month: 'Apr', revenue: Math.floor(totalRevenue * 0.85) },
      { month: 'May', revenue: Math.floor(totalRevenue * 0.9) },
      { month: 'Jun', revenue: totalRevenue },
    ];

    res.json({
      success: true,
      stats: {
        totalUsers,
        students,
        instructors,
        totalCourses,
        totalEnrollments,
        totalRevenue,
        growthRate: '+14%' // Simulated growth
      },
      revenueHistory,
      recentUsers: recentUsers.map(u => ({
        id: u._id,
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        role: u.role,
        joinedAt: new Date(u.createdAt).toLocaleDateString(),
        avatar: u.avatar || '',
        activity: Math.floor(Math.random() * 40) + 60 // Simulated activity metric
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getPlatformStats,
  getAllUsers
};
