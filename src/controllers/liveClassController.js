const mongoose = require('mongoose');
const Course = require('../models/Course');
const LiveClass = require('../models/LiveClass');
const User = require('../models/User');
const crypto = require('crypto');

// @desc    Start a live class (Instructor only)
// @route   POST /api/live/start
// @access  Private (Instructor)
const startLiveClass = async (req, res) => {
  try {
    const { courseId, title, description } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    // Check instructor owns the course
    if (course.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to go live for this course' });
    }

    const roomId = crypto.randomUUID();

    const liveClass = await LiveClass.create({
      title: title || `${course.title} - Live Session`,
      description: description || '',
      instructor: req.user.id,
      course: courseId,
      module: 'Live Session',
      status: 'live',
      scheduledFor: new Date(),
      startedAt: new Date(),
      roomId
    });

    await liveClass.populate('instructor', 'firstName lastName avatar');
    await liveClass.populate('course', 'title thumbnail');

    res.status(201).json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper to find live class by _id or roomId (UUID)
const findLiveClassByAnyId = async (id) => {
  console.log(`[IDLookup] Searching for ID: ${id}`);
  if (mongoose.Types.ObjectId.isValid(id)) {
    const lc = await LiveClass.findById(id);
    if (lc) {
      console.log(`[IDLookup] Found by ObjectId: ${lc._id}`);
      return lc;
    }
  }
  const lc = await LiveClass.findOne({ roomId: id });
  if (lc) {
    console.log(`[IDLookup] Found by roomId: ${lc.roomId}`);
  } else {
    console.log(`[IDLookup] FAILED: No record found for ID: ${id}`);
  }
  return lc;
};

// @desc    End a live class and archive recording
// @route   POST /api/live/:id/end
// @access  Private (Instructor)
const endLiveClass = async (req, res) => {
  try {
    const { recordingUrl } = req.body;
    const liveClass = await findLiveClassByAnyId(req.params.id);

    if (!liveClass) return res.status(404).json({ success: false, message: 'Live class not found' });

    if (liveClass.instructor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const startTime = liveClass.startedAt || liveClass.createdAt;
    const endTime = new Date();
    const durationMs = endTime - startTime;
    const durationMin = Math.round(durationMs / 60000);

    liveClass.status = 'ended';
    liveClass.endedAt = endTime;
    liveClass.duration = `${durationMin} min`;
    if (recordingUrl) liveClass.recordingUrl = recordingUrl;

    // Archive recording to course curriculum
    if (recordingUrl && !liveClass.addedToCurriculum) {
      const course = await Course.findById(liveClass.course);
      if (course) {
        // Find or create a "Recordings" section
        let recordingSection = course.sections.find(s => s.title === 'Live Recordings');
        if (!recordingSection) {
          course.sections.push({
            title: 'Live Recordings',
            description: 'Recorded live sessions',
            order: course.sections.length,
            lessons: []
          });
          recordingSection = course.sections[course.sections.length - 1];
        }

        recordingSection.lessons.push({
          title: liveClass.title,
          videoUrl: recordingUrl,
          duration: durationMin,
          isFree: false
        });

        await course.save();
        liveClass.addedToCurriculum = true;
      }
    }

    await liveClass.save();

    res.json({ success: true, data: liveClass, message: 'Live class ended and recording archived.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all live classes for a specific course (enrollment check)
// @route   GET /api/live/course/:courseId
// @access  Private
const getLiveClassesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Anyone can fetch (instructor of that course, or enrolled student)
    const user = await User.findById(req.user.id);
    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    const isInstructor = course.instructorId.toString() === req.user.id;
    const isEnrolled = user.enrolledCourses.map(id => id.toString()).includes(courseId);

    if (!isInstructor && !isEnrolled) {
      return res.status(403).json({ success: false, message: 'You must be enrolled to view live sessions' });
    }

    const liveClasses = await LiveClass.find({ course: courseId })
      .populate('instructor', 'firstName lastName avatar')
      .sort({ scheduledFor: -1 });

    res.json({ success: true, count: liveClasses.length, data: liveClasses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get ALL live classes for enrolled courses (student dashboard)
// @route   GET /api/live
// @access  Private
const getLiveClasses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('enrolledCourses', '_id instructorId');
    
    let liveClasses;

    if (req.user.role === 'instructor' || req.user.role === 'admin') {
      // Instructors see their own live sessions that are NOT ended
      liveClasses = await LiveClass.find({ 
        instructor: req.user.id,
        status: { $ne: 'ended' }
      })
        .populate('instructor', 'firstName lastName avatar')
        .populate('course', 'title thumbnail')
        .sort({ scheduledFor: -1 });
    } else {
      // Robust Live-Only Mode: Get user's enrollment and find matching active sessions
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });
      
      const enrolledIds = user.enrolledCourses.map(id => id.toString());
      
      liveClasses = await LiveClass.find({
        course: { $in: enrolledIds },
        status: 'live'
      })
      .populate('instructor', 'firstName lastName avatar')
      .populate('course', 'title thumbnail')
      .sort({ startedAt: -1 });
      
      console.log(`[Discovery] Found ${liveClasses.length} sessions`);
    }

    res.json({ success: true, count: liveClasses.length, data: liveClasses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get a single live class (with chat)
// @route   GET /api/live/:id
// @access  Private (enrolled/instructor)
const getLiveClassById = async (req, res) => {
  try {
    const liveClass = await LiveClass.findById(req.params.id)
      .populate('instructor', 'firstName lastName avatar')
      .populate('course', 'title thumbnail')
      .populate('chatMessages.sender', 'firstName lastName avatar');

    if (!liveClass) return res.status(404).json({ success: false, message: 'Live class not found' });

    res.json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update live class status
// @route   PATCH /api/live/:id/status
// @access  Private (Instructor)
const updateStatus = async (req, res) => {
  try {
    console.log(`[StatusUpdate] ID: ${req.params.id}, NewStatus: ${req.body.status}`);
    const liveClass = await findLiveClassByAnyId(req.params.id);
    
    if (!liveClass) {
      console.log(`[StatusUpdate] FAILED: Live class not found for ID ${req.params.id}`);
      return res.status(404).json({ success: false, message: 'Live class not found' });
    }

    liveClass.status = req.body.status;
    if (req.body.status === 'live' || req.body.status === 'online') {
      liveClass.startedAt = new Date();
    }
    
    await liveClass.save();
    console.log(`[StatusUpdate] SUCCESS: Updated status to ${req.body.status}`);
    res.json({ success: true, data: liveClass });
  } catch (error) {
    console.error(`[StatusUpdate] ERROR: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create upcoming live class (scheduled)
// @route   POST /api/live/schedule
// @access  Private (Instructor)
const scheduleLiveClass = async (req, res) => {
  try {
    const { courseId, title, description, scheduledFor } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });

    if (course.instructorId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const liveClass = await LiveClass.create({
      title,
      description: description || '',
      instructor: req.user.id,
      course: courseId,
      module: 'Live Session',
      status: 'upcoming',
      scheduledFor: new Date(scheduledFor),
      roomId: crypto.randomUUID()
    });

    await liveClass.populate('instructor', 'firstName lastName avatar');
    await liveClass.populate('course', 'title thumbnail');

    res.status(201).json({ success: true, data: liveClass });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Trigger a Pusher event (Real-time signaling/chat)
// @route   POST /api/live/pusher/trigger
// @access  Private
const pusherTrigger = async (req, res) => {
  try {
    const { event, data, channel } = req.body;
    
    if (!event || !channel || !data) {
      return res.status(400).json({ success: false, message: 'Missing event, channel, or data' });
    }

    const pusher = req.app.get('pusher');
    if (!pusher) {
      return res.status(500).json({ success: false, message: 'Pusher not initialized' });
    }

    await pusher.trigger(channel, event, data);
    res.json({ success: true });
  } catch (error) {
    console.error('Pusher Trigger Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startLiveClass,
  endLiveClass,
  getLiveClassesByCourse,
  getLiveClasses,
  getLiveClassById,
  updateStatus,
  scheduleLiveClass,
  pusherTrigger
};
