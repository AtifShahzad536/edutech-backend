const userRepository = require('../repositories/user.repository');
const courseRepository = require('../repositories/course.repository');

const getPlatformStats = async () => {
  const [totalUsers, students, instructors, courses] = await Promise.all([
    userRepository.countUsers(),
    userRepository.countUsers({ role: 'student' }),
    userRepository.countUsers({ role: 'instructor' }),
    courseRepository.findCourses({}, '-createdAt', 0, 1000) // Optimization: Get courses
  ]);
  
  const totalCourses = courses.length;
  const totalEnrollments = courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
  const totalRevenue = courses.reduce((sum, c) => sum + ((c.price || 0) * (c.studentsCount || 0)), 0);
  
  const recentUsers = await userRepository.findUsers({}, { 
    select: 'firstName lastName email role createdAt avatar', 
    sort: { createdAt: -1 }, 
    limit: 5 
  });

  const revenueHistory = [
    { month: 'Jan', revenue: Math.floor(totalRevenue * 0.6) },
    { month: 'Feb', revenue: Math.floor(totalRevenue * 0.7) },
    { month: 'Mar', revenue: Math.floor(totalRevenue * 0.8) },
    { month: 'Apr', revenue: Math.floor(totalRevenue * 0.85) },
    { month: 'May', revenue: Math.floor(totalRevenue * 0.9) },
    { month: 'Jun', revenue: totalRevenue },
  ];

  return {
    stats: {
      totalUsers,
      students,
      instructors,
      totalCourses,
      totalEnrollments,
      totalRevenue,
      growthRate: '+14%' 
    },
    revenueHistory,
    recentUsers: recentUsers.map(u => ({
      id: u._id,
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      role: u.role,
      joinedAt: new Date(u.createdAt).toLocaleDateString(),
      avatar: u.avatar || '',
      activity: Math.floor(Math.random() * 40) + 60
    }))
  };
};

const getAllUsers = async () => {
  return userRepository.findUsers();
};

module.exports = {
  getPlatformStats,
  getAllUsers,
};
