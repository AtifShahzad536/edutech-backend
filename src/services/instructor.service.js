const courseRepository = require('../repositories/course.repository');
const assignmentRepository = require('../repositories/assignment.repository');
const submissionRepository = require('../repositories/submission.repository');
const userRepository = require('../repositories/user.repository');
const CourseProgress = require('../models/CourseProgress');

class InstructorService {
  async getInstructorStats(instructorId) {
    const courses = await courseRepository.findCourses({ instructorId });
    const courseIds = courses.map(c => c._id);

    const totalStudents = courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0);
    const totalRevenue = courses.reduce((sum, c) => sum + ((c.price || 0) * (c.studentsCount || 0)), 0);
    const avgRating = courses.length > 0 
      ? (courses.reduce((sum, c) => sum + (c.rating || 0), 0) / courses.length).toFixed(1)
      : 0;

    const activeAssignments = await assignmentRepository.findAssignments({ instructor: instructorId, status: 'active' }).then(a => a.length);

    const assignmentIds = await assignmentRepository.findAssignments({ instructor: instructorId }).then(a => a.map(doc => doc._id));

    const recentSubmissions = await submissionRepository.findSubmissions(
      { assignment: { $in: assignmentIds }, status: 'submitted' },
      { populate: [{ path: 'student', select: 'firstName lastName avatar' }, { path: 'assignment', select: 'title' }], sort: { submittedAt: -1 } }
    ).then(subs => subs.slice(0, 5));

    const allCourseProgress = await CourseProgress.find({ course: { $in: courseIds } }).populate('course', 'price');
    
    // Calculate engagement (Average progress of all students in instructor's courses)
    const totalProgress = allCourseProgress.reduce((sum, p) => sum + (p.progressPercent || 0), 0);
    const avgEngagement = allCourseProgress.length > 0 ? Math.round(totalProgress / allCourseProgress.length) : 0;

    // Calculate monthly analytics (last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const analyticsHistory = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = monthNames[d.getMonth()];
      const year = d.getFullYear();
      
      const monthlyEnrollments = allCourseProgress.filter(p => {
        const pDate = new Date(p.createdAt);
        return pDate.getMonth() === d.getMonth() && pDate.getFullYear() === year;
      });
      
      const revenue = monthlyEnrollments.reduce((sum, p) => sum + (p.course?.price || 0), 0);
      analyticsHistory.push({ 
        month: monthLabel, 
        revenue, 
        students: monthlyEnrollments.length 
      });
    }

    return {
      stats: { 
        totalCourses: courses.length, 
        totalStudents, 
        activeAssignments, 
        totalRevenue, 
        rating: avgRating,
        engagement: avgEngagement
      },
      analyticsHistory,
      recentSubmissions: recentSubmissions.map(s => ({
        id: s._id,
        studentName: `${s.student?.firstName} ${s.student?.lastName}`,
        assignmentTitle: s.assignment?.title,
        submittedAt: new Date(s.submittedAt).toLocaleDateString(),
        status: 'To Review'
      }))
    };
  }

  async getInstructorCourses(instructorId) {
    return courseRepository.findCourses({ instructorId });
  }

  async getInstructorStudents(instructorId) {
    const instructorCourses = await courseRepository.findCourses({ instructorId }, 'title');
    const courseIds = instructorCourses.map(c => c._id);

    const students = await userRepository.findUsers(
      { role: 'student', enrolledCourses: { $in: courseIds } },
      { select: 'firstName lastName email avatar enrolledCourses createdAt' }
    );

    return students.map(student => {
      const matchingCourseIds = student.enrolledCourses.filter(cid => courseIds.some(icid => icid.toString() === cid.toString()));
      const matchingCourses = matchingCourseIds.map(cid => {
        const c = instructorCourses.find(ic => ic._id.toString() === cid.toString());
        return c ? c.title : 'Unknown Course';
      });

      return {
        id: student._id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        avatar: student.avatar,
        course: matchingCourses[0] || 'N/A',
        allCourses: matchingCourses,
        joinedAt: student.createdAt,
        status: 'active'
      };
    });
  }
}

module.exports = new InstructorService();
