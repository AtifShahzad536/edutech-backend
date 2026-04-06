const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const CourseProgress = require('../models/CourseProgress');

// ─────────────────────────────────────────────
// @desc    Get full student dashboard data
// @route   GET /api/dashboard/stats
// @access  Private (student)
// ─────────────────────────────────────────────
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const enrolledCourseIds = user.enrolledCourses || [];

    // ── 1. Submissions & Assignments ─────────────────
    const [studentSubmissions, allAssignments] = await Promise.all([
      Submission.find({ student: userId }),
      Assignment.find({
        course: { $in: enrolledCourseIds },
        status: 'active'
      }).populate('course', 'title thumbnail category level')
    ]);

    const submittedIds = new Set(studentSubmissions.map(s => s.assignment.toString()));

    // ── 2. Active (pending) assignments ──────────────
    const pendingAssignments = allAssignments
      .filter(a => !submittedIds.has(a._id.toString()) && new Date(a.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 6);

    const activeAssignmentsMapped = pendingAssignments.map(a => ({
      id: a._id,
      title: a.title,
      course: a.course?.title || 'General',
      deadline: new Date(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      difficulty: a.totalPoints >= 80 ? 'Hard' : a.totalPoints >= 50 ? 'Medium' : 'Easy',
      totalPoints: a.totalPoints
    }));

    // ── 3. Points & Progress ──────────────────────────
    const totalPoints = studentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
    const courseProgress = allAssignments.length > 0
      ? Math.round((submittedIds.size / allAssignments.length) * 100)
      : 0;

    // ── 4. Enrolled Courses with real progress ────────
    const courseProgressDocs = await CourseProgress.find({ student: userId })
      .populate('course', 'title thumbnail category level rating duration lessonsCount');

    const enrolledCoursesData = courseProgressDocs.map(p => ({
      id: p.course?._id,
      title: p.course?.title,
      thumbnail: p.course?.thumbnail,
      category: p.course?.category,
      level: p.course?.level,
      rating: p.course?.rating,
      duration: p.course?.duration,
      lessonsCount: p.course?.lessonsCount,
      progress: p.progressPercent,
      lastAccessed: p.lastAccessedAt,
      completedLessons: p.completedLessons.length
    }));

    // ── 5. Activity Chart (last 7 days) ───────────────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSubs = await Submission.find({
      student: userId,
      submittedAt: { $gte: sevenDaysAgo }
    });

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activityMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      activityMap[dayNames[d.getDay()]] = 0;
    }
    recentSubs.forEach(sub => {
      const day = dayNames[new Date(sub.submittedAt).getDay()];
      if (activityMap[day] !== undefined) activityMap[day] += 1;
    });
    const activityStats = Object.entries(activityMap).map(([name, count]) => ({
      name,
      hours: count * 1.5 // weight: 1 submission ≈ 1.5 hours of study
    }));

    // ── 6. Learning Streak ────────────────────────────
    // Count consecutive days with at least 1 submission
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const hadActivity = studentSubmissions.some(s => {
        const d = new Date(s.submittedAt);
        return d >= dayStart && d <= dayEnd;
      });

      if (hadActivity) streak++;
      else if (i > 0) break; // Break streak on gap (but not if today is empty yet)
    }

    // ── 7. Recent Notifications / Activity ────────────
    const recentActivity = await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(8);

    // ── 8. Quiz performance data (based on graded submissions) ───
    const gradedSubs = studentSubmissions
      .filter(s => s.grade !== null && s.grade !== undefined)
      .slice(-8)
      .map((s, i) => ({
        name: `W${i + 1}`,
        score: s.grade,
        average: 75 // TODO: replace with real class average when available
      }));

    // ── 9. Skill distribution from categories ─────────
    const categoryMap = {};
    const populatedCourses = await Course.find({ _id: { $in: enrolledCourseIds } });
    
    populatedCourses.forEach(course => {
      const cat = course.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      // Weight skills by progress in that category
      const prog = enrolledCoursesData.find(p => p.id?.toString() === course._id.toString());
      categoryMap[cat] += prog ? prog.progress : 0;
    });

    const skillData = Object.entries(categoryMap).map(([subject, value]) => ({
      subject,
      A: Math.min(Math.round(value / Math.max(1, populatedCourses.filter(c => c.category === subject).length)), 100),
      fullMark: 100
    }));

    // ── 10. Notification count ────────────────────────
    const notificationCount = await Notification.countDocuments({ user: userId, isRead: false });

    res.json({
      success: true,
      stats: {
        learningStreak: streak > 0 ? `${streak} Day${streak !== 1 ? 's' : ''}` : '0 Days',
        courseProgress: `${courseProgress}%`,
        activeCourses: enrolledCourseIds.length,
        totalPoints,
        notificationCount,
        recentActivity
      },
      activeAssignments: activeAssignmentsMapped,
      enrolledCourses: enrolledCoursesData,
      activityStats,
      quizData: gradedSubs.length > 0 ? gradedSubs : [
        { name: 'W1', score: 0, average: 75 },
        { name: 'W2', score: 0, average: 75 },
        { name: 'W3', score: 0, average: 75 },
        { name: 'W4', score: 0, average: 75 }
      ],
      skillData: skillData.length > 0 ? skillData : [
        { subject: 'Development', A: 0, fullMark: 100 },
        { subject: 'Design', A: 0, fullMark: 100 },
        { subject: 'Data Science', A: 0, fullMark: 100 },
        { subject: 'Business', A: 0, fullMark: 100 },
        { subject: 'Marketing', A: 0, fullMark: 100 }
      ]
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Mark a lesson as completed
// @route   POST /api/dashboard/progress/lesson
// @access  Private (student)
// ─────────────────────────────────────────────
const markLessonComplete = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ success: false, message: 'courseId and lessonId are required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Count total lessons
    const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);

    let progressDoc = await CourseProgress.findOne({ student: req.user.id, course: courseId });

    if (!progressDoc) {
      progressDoc = new CourseProgress({ student: req.user.id, course: courseId, completedLessons: [] });
    }

    // Avoid duplicate lesson entries
    const alreadyDone = progressDoc.completedLessons.some(l => l.lessonId.toString() === lessonId);
    if (!alreadyDone) {
      progressDoc.completedLessons.push({ lessonId });
    }

    progressDoc.lastAccessedAt = new Date();
    progressDoc.progressPercent = totalLessons > 0
      ? Math.round((progressDoc.completedLessons.length / totalLessons) * 100)
      : 0;

    await progressDoc.save();

    res.json({
      success: true,
      progress: progressDoc.progressPercent,
      completedLessons: progressDoc.completedLessons.length,
      totalLessons
    });

  } catch (error) {
    console.error('Mark Lesson Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Get progress for a specific course
// @route   GET /api/dashboard/progress/:courseId
// @access  Private (student)
// ─────────────────────────────────────────────
const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    const progressDoc = await CourseProgress.findOne({
      student: req.user.id,
      course: courseId
    }).populate('course', 'title sections lessonsCount');

    if (!progressDoc) {
      return res.json({ success: true, progress: 0, completedLessons: [] });
    }

    const completedIds = progressDoc.completedLessons.map(l => l.lessonId.toString());

    res.json({
      success: true,
      progress: progressDoc.progressPercent,
      completedLessons: completedIds,
      lastAccessedAt: progressDoc.lastAccessedAt
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  markLessonComplete,
  getCourseProgress
};
