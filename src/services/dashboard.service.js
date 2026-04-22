const User = require('../models/User');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const CourseProgress = require('../models/CourseProgress');
const AppError = require('../utils/appError');

class DashboardService {
  async getDashboardStats(userId) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const enrolledCourseIds = user.enrolledCourses || [];

    const [studentSubmissions, allAssignments] = await Promise.all([
      Submission.find({ student: userId }),
      Assignment.find({
        course: { $in: enrolledCourseIds },
        status: 'active'
      }).populate('course', 'title thumbnail category level')
    ]);

    const submittedIds = new Set(studentSubmissions.map(s => s.assignment.toString()));

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

    const totalPoints = studentSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0);
    const courseProgress = allAssignments.length > 0 ? Math.round((submittedIds.size / allAssignments.length) * 100) : 0;

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

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentSubs = await Submission.find({ student: userId, submittedAt: { $gte: sevenDaysAgo } });

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
      hours: count * 1.5
    }));

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
      else if (i > 0) break;
    }

    const recentActivity = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(8);

    const gradedSubs = studentSubmissions
      .filter(s => s.grade !== null && s.grade !== undefined)
      .slice(-8)
      .map((s, i) => ({ name: `W${i + 1}`, score: s.grade, average: 75 }));

    const categoryMap = {};
    const populatedCourses = await Course.find({ _id: { $in: enrolledCourseIds } });
    
    populatedCourses.forEach(course => {
      const cat = course.category || 'Other';
      if (!categoryMap[cat]) categoryMap[cat] = 0;
      const prog = enrolledCoursesData.find(p => p.id?.toString() === course._id.toString());
      categoryMap[cat] += prog ? prog.progress : 0;
    });

    const skillData = Object.entries(categoryMap).map(([subject, value]) => ({
      subject,
      A: Math.min(Math.round(value / Math.max(1, populatedCourses.filter(c => c.category === subject).length)), 100),
      fullMark: 100
    }));

    const notificationCount = await Notification.countDocuments({ user: userId, isRead: false });

    return {
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
        { name: 'W1', score: 0, average: 75 }, { name: 'W2', score: 0, average: 75 },
        { name: 'W3', score: 0, average: 75 }, { name: 'W4', score: 0, average: 75 }
      ],
      skillData: skillData.length > 0 ? skillData : [
        { subject: 'Development', A: 0, fullMark: 100 }, { subject: 'Design', A: 0, fullMark: 100 },
        { subject: 'Data Science', A: 0, fullMark: 100 }, { subject: 'Business', A: 0, fullMark: 100 },
        { subject: 'Marketing', A: 0, fullMark: 100 }
      ]
    };
  }

  async markLessonComplete(courseId, lessonId, userId) {
    if (!courseId || !lessonId) throw new AppError('courseId and lessonId are required', 400);

    const course = await Course.findById(courseId);
    if (!course) throw new AppError('Course not found', 404);

    const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);

    let progressDoc = await CourseProgress.findOne({ student: userId, course: courseId });
    if (!progressDoc) {
      progressDoc = new CourseProgress({ student: userId, course: courseId, completedLessons: [] });
    }

    const alreadyDone = progressDoc.completedLessons.some(l => l.lessonId.toString() === lessonId);
    if (!alreadyDone) progressDoc.completedLessons.push({ lessonId });

    progressDoc.lastAccessedAt = new Date();
    progressDoc.progressPercent = totalLessons > 0 ? Math.round((progressDoc.completedLessons.length / totalLessons) * 100) : 0;

    await progressDoc.save();

    return {
      progress: progressDoc.progressPercent,
      completedLessons: progressDoc.completedLessons.length,
      totalLessons
    };
  }

  async getCourseProgress(courseId, userId) {
    const progressDoc = await CourseProgress.findOne({ student: userId, course: courseId }).populate('course', 'title sections lessonsCount');

    if (!progressDoc) {
      return { progress: 0, completedLessons: [], lastAccessedAt: null };
    }

    return {
      progress: progressDoc.progressPercent,
      completedLessons: progressDoc.completedLessons.map(l => l.lessonId.toString()),
      lastAccessedAt: progressDoc.lastAccessedAt
    };
  }
}

module.exports = new DashboardService();
