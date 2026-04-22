const assignmentRepository = require('../repositories/assignment.repository');
const submissionRepository = require('../repositories/submission.repository');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/appError');

class AssignmentService {
  async getStudentAssignmentsWithStats(userId) {
    const user = await userRepository.findUserById(userId);
    if (!user) throw new AppError('User not found', 404);
    
    const enrolledCourseIds = (user.enrolledCourses || []).map(c => c._id || c);

    const assignments = await assignmentRepository.findAssignments(
      { course: { $in: enrolledCourseIds }, status: 'active' },
      { populate: [{ path: 'course', select: 'title thumbnail category' }, { path: 'instructor', select: 'firstName lastName avatar' }], sort: { dueDate: 1 } }
    );

    const assignmentIds = assignments.map(a => a._id);
    const submissions = await submissionRepository.findSubmissions({
      assignment: { $in: assignmentIds },
      student: userId
    });

    const merged = assignments.map(a => {
      const submission = submissions.find(s => s.assignment.toString() === a._id.toString());
      return {
        id: a._id,
        title: a.title,
        description: a.description,
        course: a.course?.title || 'General',
        courseId: a.course?._id,
        instructor: a.instructor ? `${a.instructor.firstName} ${a.instructor.lastName}` : 'Course Instructor',
        dueDate: a.dueDate,
        totalPoints: a.totalPoints,
        status: submission ? (submission.status === 'graded' ? 'graded' : 'submitted') : 'pending',
        score: submission?.grade || null,
        feedback: submission?.feedback || null,
        submittedAt: submission?.submittedAt || null,
        submissionId: submission?._id || null,
        attachments: a.attachments || []
      };
    });

    const stats = {
      pending: merged.filter(a => a.status === 'pending').length,
      submitted: merged.filter(a => a.status === 'submitted').length,
      graded: merged.filter(a => a.status === 'graded').length,
      avgGrade: (() => {
        const graded = merged.filter(a => a.status === 'graded' && a.score !== null);
        if (!graded.length) return null;
        return Math.round(graded.reduce((sum, a) => sum + (a.score / a.totalPoints) * 100, 0) / graded.length);
      })()
    };

    return { assignments: merged, stats };
  }

  async createAssignment(data, instructorId) {
    return assignmentRepository.createAssignment({ ...data, instructor: instructorId });
  }

  async getCourseAssignments(courseId) {
    return assignmentRepository.findAssignments({ course: courseId }, { populate: 'instructor firstName lastName avatar', sort: { dueDate: 1 } });
  }

  async submitAssignment(assignmentId, userId, data, userRole) {
    const assignment = await assignmentRepository.findAssignmentById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    const user = await userRepository.findUserById(userId);
    const enrolledCourseIds = (user.enrolledCourses || []).map(c => c._id || c);
    const isEnrolled = enrolledCourseIds.some(id => id.toString() === assignment.course.toString());
    if (!isEnrolled && userRole !== 'admin') throw new AppError('Not enrolled in this course', 403);

    const existing = await submissionRepository.findOneSubmission({ assignment: assignmentId, student: userId });
    if (existing) {
      existing.content = data.content;
      existing.attachments = data.attachments;
      existing.status = 'submitted';
      existing.submittedAt = Date.now();
      await existing.save();
      return existing;
    }

    return submissionRepository.createSubmission({
      assignment: assignmentId,
      student: userId,
      content: data.content,
      attachments: data.attachments
    });
  }

  async gradeSubmission(submissionId, data) {
    const submission = await submissionRepository.updateSubmission(submissionId, {
      ...data,
      status: 'graded',
      gradedAt: Date.now()
    });
    if (!submission) throw new AppError('Submission not found', 404);
    return submission;
  }

  async getStudentSubmissions(userId) {
    return submissionRepository.findSubmissions(
      { student: userId },
      { populate: { path: 'assignment', select: 'title course dueDate' }, sort: { submittedAt: -1 } }
    );
  }

  async getAssignmentById(id) {
    const assignment = await assignmentRepository.findAssignmentById(id, [{ path: 'course', select: 'title' }, { path: 'instructor', select: 'firstName lastName avatar' }]);
    if (!assignment) throw new AppError('Assignment not found', 404);
    return assignment;
  }

  async getInstructorAssignmentsWithMetrics(instructorId) {
    const assignments = await assignmentRepository.findAssignments(
      { instructor: instructorId },
      { populate: { path: 'course', select: 'title studentsCount' }, sort: { createdAt: -1 } }
    );

    const assignmentIds = assignments.map(a => a._id);
    const submissionCounts = await submissionRepository.aggregateSubmissions([
      { $match: { assignment: { $in: assignmentIds } } },
      { $group: { _id: "$assignment", count: { $sum: 1 } } }
    ]);

    return assignments.map(a => {
      const subCount = submissionCounts.find(s => s._id.toString() === a._id.toString());
      return {
        id: a._id,
        title: a.title,
        description: a.description,
        course: a.course?.title || 'Unknown',
        courseId: a.course?._id,
        dueDate: a.dueDate,
        submissions: subCount ? subCount.count : 0,
        totalStudents: a.course?.studentsCount || 0,
        status: 'Active',
        difficulty: a.difficulty || 'Intermediate',
        maxScore: a.totalPoints,
        attachments: a.attachments || []
      };
    });
  }

  async getAssignmentSubmissions(assignmentId) {
    const assignment = await assignmentRepository.findAssignmentById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    return submissionRepository.findSubmissions(
      { assignment: assignmentId },
      { populate: { path: 'student', select: 'firstName lastName email avatar' }, sort: { submittedAt: -1 } }
    );
  }

  async updateAssignment(assignmentId, userId, userRole, data) {
    const assignment = await assignmentRepository.findAssignmentById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    if (assignment.instructor.toString() !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to update this assignment', 403);
    }

    return assignmentRepository.updateAssignment(assignmentId, data);
  }

  async deleteAssignment(assignmentId, userId, userRole) {
    const assignment = await assignmentRepository.findAssignmentById(assignmentId);
    if (!assignment) throw new AppError('Assignment not found', 404);

    if (assignment.instructor.toString() !== userId && userRole !== 'admin') {
      throw new AppError('Not authorized to delete this assignment', 403);
    }

    await assignmentRepository.deleteAssignment(assignmentId);
    await submissionRepository.deleteSubmissionsByAssignment(assignmentId);
    return null;
  }
}

module.exports = new AssignmentService();
