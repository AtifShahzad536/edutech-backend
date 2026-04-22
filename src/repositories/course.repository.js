const Course = require('../models/Course');

const findCourses = async (query, sort, skip, limit) => {
  return Course.find(query)
    .populate('instructorId', 'firstName lastName avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();
};

const countCourses = async (query) => {
  return Course.countDocuments(query);
};

const findCourseById = async (id) => {
  return Course.findById(id).populate('instructorId', 'firstName lastName avatar bio').lean();
};

const createCourse = async (data) => {
  return Course.create(data);
};

const updateCourse = async (id, data) => {
  return Course.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
};

const incrementStudentsCount = async (id) => {
  return Course.findByIdAndUpdate(id, { $inc: { studentsCount: 1 } });
};

const findCoursesForAnalytics = async (pipeline) => {
  return Course.aggregate(pipeline);
};

const findCoursesByIds = async (ids) => {
  return Course.find({ _id: { $in: ids } })
    .populate('instructorId', 'firstName lastName avatar')
    .lean();
}

module.exports = {
  findCourses,
  countCourses,
  findCourseById,
  createCourse,
  updateCourse,
  incrementStudentsCount,
  findCoursesForAnalytics,
  findCoursesByIds,
};
