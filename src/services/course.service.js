const courseRepository = require('../repositories/course.repository');
const User = require('../models/User'); // Will be replaced by User Repo later
const CourseProgress = require('../models/CourseProgress'); // Will be replaced by CourseProgress Repo later
const Notification = require('../models/Notification'); // Will be replaced by Notification Repo later
const cacheService = require('./cacheService');
const AppError = require('../utils/appError');

const getAllCourses = async ({ q, category, level, page = 1, limit = 20, sort = '-createdAt' }) => {
  const query = { isPublished: true };
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }
  if (category && category !== 'all') {
    const categoryMap = {
      'programming': 'Development',
      'development': 'Development',
      'design': 'Design',
      'data-science': 'Data Science',
      'business': 'Business',
      'marketing': 'Marketing'
    };
    query.category = categoryMap[category.toLowerCase()] || category;
  }
  if (level && level !== 'all') {
    query.level = level.toLowerCase();
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const cacheKey = `courses_${q}_${category}_${level}_p${pageNum}`;
  const cached = await cacheService.get(cacheKey);
  if (cached && !q) {
    return { ...cached, source: 'cache' };
  }

  const [courses, total] = await Promise.all([
    courseRepository.findCourses(query, sort, skip, limitNum),
    courseRepository.countCourses(query)
  ]);

  const payload = {
    count: courses.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: courses
  };

  if (!q) await cacheService.set(cacheKey, payload, 600);

  return { ...payload, source: 'database' };
};

const getCourseById = async (id) => {
  const course = await courseRepository.findCourseById(id);
  if (!course) throw new AppError('Course not found', 404);
  return course;
};

const createCourse = async (data, instructorId) => {
  const payload = { ...data, instructorId };
  const course = await courseRepository.createCourse(payload);
  await cacheService.del('all_courses');
  return course;
};

const enrollFreeCourse = async (courseId, userId) => {
  const course = await courseRepository.findCourseById(courseId);
  if (!course) throw new AppError('Course not found', 404);
  if (course.price > 0) throw new AppError('This course requires payment. Use /checkout.', 400);

  const user = await User.findById(userId);
  const alreadyEnrolled = user.enrolledCourses.some(c => c.toString() === courseId);
  if (alreadyEnrolled) {
    return { message: 'Already enrolled', alreadyEnrolled: true };
  }

  await User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } });

  await CourseProgress.findOneAndUpdate(
    { student: userId, course: courseId },
    { student: userId, course: courseId },
    { upsert: true, new: true }
  );

  await courseRepository.incrementStudentsCount(courseId);

  await Notification.create({
    user: userId,
    title: 'Course Enrolled',
    message: `You've enrolled in "${course.title}". Happy learning!`,
    type: 'enrollment'
  });

  return { message: `Successfully enrolled in "${course.title}"`, courseId };
};

const getEnrolledCourses = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);

  const enrolledIds = user.enrolledCourses;
  const [courses, progressDocs] = await Promise.all([
    courseRepository.findCoursesByIds(enrolledIds),
    CourseProgress.find({ student: userId, course: { $in: enrolledIds } }).lean()
  ]);

  const progressMap = progressDocs.reduce((acc, p) => {
    acc[p.course.toString()] = p;
    return acc;
  }, {});

  return courses.map(course => {
    const prog = progressMap[course._id.toString()] || {};
    return {
      ...course,
      progress: prog.progressPercent || 0,
      completedLessons: prog.completedLessons?.length || 0,
      lastAccessedAt: prog.lastAccessedAt || null
    };
  });
};

const getAnalytics = async () => {
  const [categoryStats, globalStats] = await Promise.all([
    courseRepository.findCoursesForAnalytics([
      { $group: { _id: '$category', totalCourses: { $sum: 1 }, avgRating: { $avg: '$rating' }, totalStudents: { $sum: '$studentsCount' }, avgPrice: { $avg: '$price' } } },
      { $sort: { totalStudents: -1 } }
    ]),
    courseRepository.findCoursesForAnalytics([
      { $group: { _id: null, totalStudents: { $sum: '$studentsCount' }, totalRevenue: { $sum: { $multiply: ['$price', '$studentsCount'] } }, avgCourseRating: { $avg: '$rating' } } }
    ])
  ]);

  return { categoryStats, globalStats: globalStats[0] || {} };
};

const updateCourse = async (courseId, data, user) => {
  const courseBase = await courseRepository.findCourseById(courseId);
  if (!courseBase) throw new AppError('Course not found', 404);

  if (courseBase.instructorId._id.toString() !== user.id && user.role !== 'admin') {
    throw new AppError('Not authorized to update this course', 403);
  }

  const course = await courseRepository.updateCourse(courseId, data);
  await cacheService.del('all_courses');
  return course;
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  enrollFreeCourse,
  getEnrolledCourses,
  getAnalytics,
  updateCourse
};
