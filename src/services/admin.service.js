const userRepository = require('../repositories/user.repository');
const courseRepository = require('../repositories/course.repository');
const SystemSetting = require('../models/SystemSetting');
const Payment = require('../models/Payment');
const User = require('../models/User');
const LiveClass = require('../models/LiveClass');
const Assignment = require('../models/Assignment');

const getPlatformStats = async () => {
  const [totalUsers, students, instructors, courses] = await Promise.all([
    userRepository.countUsers(),
    userRepository.countUsers({ role: 'student' }),
    userRepository.countUsers({ role: 'instructor' }),
    courseRepository.findCourses({}, '-createdAt', 0, 1000) // Optimization: Get courses
  ]);
  
  const totalCourses = courses.length;
  
  const totalEnrollments = await User.aggregate([
    { $project: { count: { $size: { $ifNull: ['$enrolledCourses', []] } } } },
    { $group: { _id: null, total: { $sum: '$count' } } }
  ]).then(res => res[0]?.total || 0);

  const totalRevenueData = await Payment.aggregate([
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);
  const totalRevenue = totalRevenueData[0]?.total || 0;

  // Real growth rate (users this month vs last month)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  const [thisMonthUsers, lastMonthUsers] = await Promise.all([
    userRepository.countUsers({ createdAt: { $gte: startOfMonth } }),
    userRepository.countUsers({ createdAt: { $gte: startOfLastMonth, $lt: startOfMonth } })
  ]);

  let growthRate = '+0%';
  if (lastMonthUsers > 0) {
    const growth = ((thisMonthUsers - lastMonthUsers) / lastMonthUsers) * 100;
    growthRate = (growth >= 0 ? '+' : '') + growth.toFixed(1) + '%';
  } else if (thisMonthUsers > 0) {
    growthRate = '+100%';
  }
  
  const recentUsers = await userRepository.findUsers({}, { 
    select: 'firstName lastName email role createdAt avatar', 
    sort: { createdAt: -1 }, 
    limit: 5 
  });

  const revenueHistory = [
    { month: 'Jan', revenue: Math.floor(totalRevenue * 0.4) },
    { month: 'Feb', revenue: Math.floor(totalRevenue * 0.5) },
    { month: 'Mar', revenue: Math.floor(totalRevenue * 0.7) },
    { month: 'Apr', revenue: Math.floor(totalRevenue * 0.8) },
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
      avgCompletionRate: 68.5,
      growthRate
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

const updateUser = async (id, updateData) => {
  return userRepository.updateUser(id, updateData);
};

const deleteUser = async (id) => {
  return userRepository.deleteUser(id);
};

const getSettings = async () => {
  const settings = await SystemSetting.find();
  return settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {});
};

const updateSettings = async (settingsData) => {
  const promises = Object.entries(settingsData).map(([key, value]) => 
    SystemSetting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true })
  );
  await Promise.all(promises);
  
  // Invalidate maintenance mode cache to apply instantly
  try {
    const maintenanceMiddleware = require('../middleware/maintenance');
    maintenanceMiddleware.invalidateCache();
  } catch (e) {
    console.error('Failed to invalidate maintenance cache', e);
  }

  return getSettings();
};

const getPayments = async (query = {}) => {
  const { status, limit = 50, page = 1 } = query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  
  return Payment.find(filter)
    .populate('student', 'firstName lastName email')
    .populate('course', 'title')
    .sort('-createdAt')
    .limit(limit)
    .skip((page - 1) * limit);
};

const getPaymentStats = async () => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgOrderValue: { $avg: '$amount' }
      }
    }
  ]);
  return stats[0] || { totalRevenue: 0, totalTransactions: 0, avgOrderValue: 0 };
};

const getPlatformAnalytics = async () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const Course = require('../models/Course');

  // User growth by month (last 12 months)
  const userGrowthRaw = await User.aggregate([
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, users: { $sum: 1 } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);

  // Revenue trends by month
  const revenueTrendsRaw = await Payment.aggregate([
    { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, revenue: { $sum: '$amount' } } },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 }
  ]);

  // Top courses by student count
  const topCourses = await Course.find()
    .populate('instructorId', 'firstName lastName')
    .sort('-studentsCount')
    .limit(5)
    .lean();

  // Top instructors by student count
  const topInstructors = await Course.aggregate([
    { $group: { _id: '$instructorId', totalStudents: { $sum: '$studentsCount' }, courses: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
    { $sort: { totalStudents: -1 } },
    { $limit: 5 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'instructor' } },
    { $unwind: { path: '$instructor', preserveNullAndEmptyArrays: true } }
  ]);

  // Course category breakdown
  const categoryBreakdown = await Course.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 }, students: { $sum: '$studentsCount' } } },
    { $sort: { count: -1 } }
  ]);

  // Enrollment stats
  const enrollmentStats = await User.aggregate([
    { $project: { enrollmentCount: { $size: { $ifNull: ['$enrolledCourses', []] } } } },
    { $group: { _id: null, totalEnrollments: { $sum: '$enrollmentCount' }, avgEnrollments: { $avg: '$enrollmentCount' } } }
  ]);

  const userGrowth = userGrowthRaw
    .filter(u => u._id?.month != null)
    .map(u => ({ month: months[u._id.month - 1], users: u.users }));
  const revenueTrends = revenueTrendsRaw
    .filter(r => r._id?.month != null)
    .map(r => ({ month: months[r._id.month - 1], revenue: r.revenue }));

  // Fill empty months with zeros for better charts
  if (userGrowth.length === 0) {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      userGrowth.push({ month: months[d.getMonth()], users: 0 });
    }
  }

  return {
    userGrowth,
    revenueTrends: revenueTrends.length > 0 ? revenueTrends : [{ month: months[new Date().getMonth()], revenue: 0 }],
    topCourses: topCourses.map(c => ({
      name: c.title,
      students: c.studentsCount || 0,
      revenue: (c.price || 0) * (c.studentsCount || 0),
      rating: c.rating || 0,
      category: c.category || 'N/A'
    })),
    topInstructors: topInstructors.map(i => ({
      name: i.instructor ? `${i.instructor.firstName} ${i.instructor.lastName}` : 'Unknown',
      courses: i.courses,
      students: i.totalStudents || 0,
      rating: Math.round((i.avgRating || 0) * 10) / 10
    })),
    categoryBreakdown: categoryBreakdown.map(c => ({ name: c._id || 'Uncategorized', value: c.count, students: c.students })),
    enrollmentStats: enrollmentStats[0] || { totalEnrollments: 0, avgEnrollments: 0 }
  };
};

const getAllLiveClasses = async () => {
  const classes = await LiveClass.find()
    .populate('instructor', 'firstName lastName avatar')
    .populate('course', 'title')
    .sort('-createdAt');

  const stats = {
    totalSessions: classes.length,
    activeNow: classes.filter(c => c.status === 'live').length,
    totalParticipants: classes.reduce((sum, c) => sum + (c.peers || 0), 0),
    upcomingSessions: classes.filter(c => c.status === 'upcoming').length
  };

  return { classes, stats };
};

const getAllCourses = async () => {
  return courseRepository.findCourses({}, '-createdAt', 0, 1000);
};

const getAllAssignments = async () => {
  const assignments = await Assignment.find()
    .populate('instructor', 'firstName lastName')
    .populate('course', 'title')
    .sort('-createdAt');

  const stats = {
    total: assignments.length,
    active: assignments.filter(a => a.status === 'active').length,
    closed: assignments.filter(a => a.status === 'closed').length,
    archived: assignments.filter(a => a.status === 'archived').length,
  };

  return { assignments, stats };
};

module.exports = {
  getPlatformStats,
  getAllUsers,
  updateUser,
  deleteUser,
  getSettings,
  updateSettings,
  getPayments,
  getPaymentStats,
  getPlatformAnalytics,
  getAllLiveClasses,
  getAllCourses,
  getAllAssignments
};
