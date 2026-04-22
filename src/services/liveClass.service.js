const liveClassRepository = require('../repositories/liveClass.repository');
const courseRepository = require('../repositories/course.repository');
const userRepository = require('../repositories/user.repository');
const AppError = require('../utils/appError');
const crypto = require('crypto');

class LiveClassService {
  async startLiveClass(data, userId) {
    const course = await courseRepository.findCourseById(data.courseId);
    if (!course) throw new AppError('Course not found', 404);

    if (course.instructorId._id.toString() !== userId) {
      throw new AppError('Not authorized to go live for this course', 403);
    }

    const liveClass = await liveClassRepository.createLiveClass({
      title: data.title || `${course.title} - Live Session`,
      description: data.description || '',
      instructor: userId,
      course: data.courseId,
      module: 'Live Session',
      status: 'live',
      scheduledFor: new Date(),
      startedAt: new Date(),
      roomId: crypto.randomUUID()
    });

    await liveClass.populate('instructor', 'firstName lastName avatar');
    await liveClass.populate('course', 'title thumbnail');
    
    return liveClass;
  }

  async endLiveClass(id, recordingUrl, userId) {
    const liveClass = await liveClassRepository.findLiveClassByIdOrRoomId(id);
    if (!liveClass) throw new AppError('Live class not found', 404);

    if (liveClass.instructor.toString() !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const startTime = liveClass.startedAt || liveClass.createdAt;
    const endTime = new Date();
    const durationMin = Math.round((endTime - startTime) / 60000);

    liveClass.status = 'ended';
    liveClass.endedAt = endTime;
    liveClass.duration = `${durationMin} min`;
    if (recordingUrl) liveClass.recordingUrl = recordingUrl;

    if (recordingUrl && !liveClass.addedToCurriculum) {
      // NOTE: Here we intentionally fetch the Mongoose model to leverage .save() and array pushes
      // In a strict repository pattern, we would use $push/$set operators.
      // Doing a direct update logic to save time
      const course = await courseRepository.findCourseById(liveClass.course);
      if (course) {
        let recordingSection = course.sections.find(s => s.title === 'Live Recordings');
        if (!recordingSection) {
          course.sections.push({ title: 'Live Recordings', description: 'Recorded live sessions', order: course.sections.length, lessons: [] });
          recordingSection = course.sections[course.sections.length - 1];
        }
        recordingSection.lessons.push({ title: liveClass.title, videoUrl: recordingUrl, duration: durationMin, isFree: false });
        await courseRepository.updateCourse(course._id, { sections: course.sections }); // Using repo to save modifications
        liveClass.addedToCurriculum = true;
      }
    }

    await liveClass.save();
    return liveClass;
  }

  async getLiveClassesByCourse(courseId, userId) {
    const user = await userRepository.findUserById(userId);
    const course = await courseRepository.findCourseById(courseId);

    if (!course) throw new AppError('Course not found', 404);

    const isInstructor = course.instructorId._id.toString() === userId;
    const isEnrolled = user.enrolledCourses.map(id => id.toString()).includes(courseId);

    if (!isInstructor && !isEnrolled) {
      throw new AppError('You must be enrolled to view live sessions', 403);
    }

    return liveClassRepository.findLiveClasses(
      { course: courseId },
      { populate: 'instructor firstName lastName avatar', sort: { scheduledFor: -1 } }
    );
  }

  async getLiveClasses(user) {
    if (user.role === 'instructor' || user.role === 'admin') {
      return liveClassRepository.findLiveClasses(
        { instructor: user.id, status: { $ne: 'ended' } },
        { populate: [{ path: 'instructor', select: 'firstName lastName avatar' }, { path: 'course', select: 'title thumbnail' }], sort: { scheduledFor: -1 } }
      );
    } else {
      const fullUser = await userRepository.findUserById(user.id);
      if (!fullUser) throw new AppError('User not found', 404);

      const enrolledIds = fullUser.enrolledCourses.map(id => id.toString());
      return liveClassRepository.findLiveClasses(
        { course: { $in: enrolledIds }, status: 'live' },
        { populate: [{ path: 'instructor', select: 'firstName lastName avatar' }, { path: 'course', select: 'title thumbnail' }], sort: { startedAt: -1 } }
      );
    }
  }

  async getLiveClassById(id) {
    const liveClass = await liveClassRepository.getPopulatedLiveClass(id, [
      { path: 'instructor', select: 'firstName lastName avatar' },
      { path: 'course', select: 'title thumbnail' },
      { path: 'chatMessages.sender', select: 'firstName lastName avatar' }
    ]);
    if (!liveClass) throw new AppError('Live class not found', 404);
    return liveClass;
  }

  async updateStatus(id, newStatus) {
    const liveClass = await liveClassRepository.findLiveClassByIdOrRoomId(id);
    if (!liveClass) throw new AppError('Live class not found', 404);

    liveClass.status = newStatus;
    if (newStatus === 'live' || newStatus === 'online') {
      liveClass.startedAt = new Date();
    }
    await liveClass.save();
    return liveClass;
  }

  async scheduleLiveClass(data, userId) {
    const course = await courseRepository.findCourseById(data.courseId);
    if (!course) throw new AppError('Course not found', 404);

    if (course.instructorId._id.toString() !== userId) {
      throw new AppError('Not authorized', 403);
    }

    const liveClass = await liveClassRepository.createLiveClass({
      title: data.title,
      description: data.description || '',
      instructor: userId,
      course: data.courseId,
      module: 'Live Session',
      status: 'upcoming',
      scheduledFor: new Date(data.scheduledFor),
      roomId: crypto.randomUUID()
    });

    await liveClass.populate('instructor', 'firstName lastName avatar');
    await liveClass.populate('course', 'title thumbnail');
    
    return liveClass;
  }

  async triggerPusher(app, event, channel, data) {
    if (!event || !channel || !data) {
      throw new AppError('Missing event, channel, or data', 400);
    }
    const pusher = app.get('pusher');
    if (!pusher) throw new AppError('Pusher not initialized', 500);

    await pusher.trigger(channel, event, data);
    return true;
  }
}

module.exports = new LiveClassService();
