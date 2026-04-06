const mongoose = require('mongoose');
const path = require('path');
const LiveClass = require('./src/models/LiveClass');
const Course = require('./src/models/Course');
const User = require('./src/models/User');

const debug = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/Edutech');
    console.log('Connected to DB');

    const liveClasses = await LiveClass.find({ status: { $ne: 'ended' } }).populate('course', 'title');
    console.log('\n--- LIVE CLASSES (Active) ---');
    if (liveClasses.length === 0) console.log('None');
    liveClasses.forEach(lc => {
      console.log(`Title: ${lc.title} | Status: ${lc.status} | CourseID: ${lc.course?._id} | RoomID: ${lc.roomId}`);
    });

    const students = await User.find({ role: 'student' });
    students.forEach(student => {
       console.log(`\n--- STUDENT: ${student.firstName} ${student.lastName} (${student._id}) ---`);
       console.log('Enrolled Course IDs:', student.enrolledCourses.map(id => id.toString()));
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

debug();
