const Course = require('../models/Course');
const User = require('../models/User');
const CourseProgress = require('../models/CourseProgress');
const Notification = require('../models/Notification');
const cacheService = require('../services/cacheService');

// ─────────────────────────────────────────────
// @desc    Get all published courses (with search, filter, pagination)
// @route   GET /api/courses
// @access  Public
// ─────────────────────────────────────────────
const getCourses = async (req, res, next) => {
  try {
    const {
      q = '',
      category = '',
      level = '',
      page = 1,
      limit = 20,
      sort = '-createdAt'
    } = req.query;

    // Build query
    const query = { isPublished: true };
    if (q) {
      query.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    if (category && category !== 'all') {
      // Map frontend category values to DB enum values
      const categoryMap = {
        'programming': 'Development',
        'development': 'Development',
        'design': 'Design',
        'data-science': 'Data Science',
        'business': 'Business',
        'marketing': 'Marketing'
      };
      const dbCategory = categoryMap[category.toLowerCase()] || category;
      query.category = dbCategory;
    }
    if (level && level !== 'all') {
      query.level = level.toLowerCase();
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Cache key includes filters
    const cacheKey = `courses_${q}_${category}_${level}_p${pageNum}`;
    const cached = await cacheService.get(cacheKey);
    if (cached && !q) {
      return res.json({ success: true, ...cached, source: 'cache' });
    }

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('instructorId', 'firstName lastName avatar')
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Course.countDocuments(query)
    ]);

    const payload = {
      count: courses.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      data: courses
    };

    if (!q) await cacheService.set(cacheKey, payload, 600); // Cache 10 min

    res.json({ success: true, ...payload, source: 'database' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
// ─────────────────────────────────────────────
const getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructorId', 'firstName lastName avatar bio');

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    res.json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Create course
// @route   POST /api/courses
// @access  Private (instructor / admin)
// ─────────────────────────────────────────────
const createCourse = async (req, res, next) => {
  try {
    req.body.instructorId = req.user.id;
    const course = await Course.create(req.body);
    await cacheService.del('all_courses');
    res.status(201).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Enroll in a FREE course (price === 0)
// @route   POST /api/courses/:id/enroll-free
// @access  Private (student)
// ─────────────────────────────────────────────
const enrollFree = async (req, res, next) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    if (course.price > 0) {
      return res.status(400).json({ success: false, message: 'This course requires payment. Use /checkout.' });
    }

    const user = await User.findById(userId);
    const alreadyEnrolled = user.enrolledCourses.some(c => c.toString() === courseId);
    if (alreadyEnrolled) {
      return res.json({ success: true, message: 'Already enrolled', alreadyEnrolled: true });
    }

    // Enroll
    await User.findByIdAndUpdate(userId, {
      $addToSet: { enrolledCourses: courseId }
    });

    // Create progress record
    await CourseProgress.findOneAndUpdate(
      { student: userId, course: courseId },
      { student: userId, course: courseId },
      { upsert: true, new: true }
    );

    // Increment students count
    await Course.findByIdAndUpdate(courseId, { $inc: { studentsCount: 1 } });

    // Notification
    await Notification.create({
      user: userId,
      title: 'Course Enrolled',
      message: `You've enrolled in "${course.title}". Happy learning!`,
      type: 'enrollment'
    });

    res.json({
      success: true,
      message: `Successfully enrolled in "${course.title}"`,
      courseId
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Get enrolled courses for current student
// @route   GET /api/courses/enrolled
// @access  Private (student)
// ─────────────────────────────────────────────
const getEnrolledCourses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const enrolledIds = user.enrolledCourses;

    const [courses, progressDocs] = await Promise.all([
      Course.find({ _id: { $in: enrolledIds } })
        .populate('instructorId', 'firstName lastName avatar')
        .lean(),
      CourseProgress.find({ student: req.user.id, course: { $in: enrolledIds } }).lean()
    ]);

    const progressMap = {};
    progressDocs.forEach(p => {
      progressMap[p.course.toString()] = p;
    });

    const enriched = courses.map(course => {
      const prog = progressMap[course._id.toString()] || {};
      return {
        ...course,
        progress: prog.progressPercent || 0,
        completedLessons: prog.completedLessons?.length || 0,
        lastAccessedAt: prog.lastAccessedAt || null
      };
    });

    res.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// @desc    Course analytics (admin)
// @route   GET /api/courses/analytics
// @access  Private (admin)
// ─────────────────────────────────────────────
const getCourseAnalytics = async (req, res, next) => {
  try {
    const [categoryStats, globalStats] = await Promise.all([
      Course.aggregate([
        { $group: { _id: '$category', totalCourses: { $sum: 1 }, avgRating: { $avg: '$rating' }, totalStudents: { $sum: '$studentsCount' }, avgPrice: { $avg: '$price' } } },
        { $sort: { totalStudents: -1 } }
      ]),
      Course.aggregate([
        { $group: { _id: null, totalStudents: { $sum: '$studentsCount' }, totalRevenue: { $sum: { $multiply: ['$price', '$studentsCount'] } }, avgCourseRating: { $avg: '$rating' } } }
      ])
    ]);

    res.json({ success: true, data: { categoryStats, globalStats: globalStats[0] || {} } });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (instructor/admin)
const updateCourse = async (req, res, next) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check ownership (unless admin)
    if (course.instructorId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this course' });
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    await cacheService.del('all_courses');
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  enrollFree,
  getEnrolledCourses,
  getCourseAnalytics
};
