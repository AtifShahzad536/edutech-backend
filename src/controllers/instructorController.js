const instructorService = require('../services/instructor.service');
const { successResponse } = require('../utils/response.util');

const getInstructorStats = async (req, res, next) => {
  try {
    const data = await instructorService.getInstructorStats(req.user.id);
    return res.json(successResponse(data));
  } catch (error) { next(error); }
};

const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await instructorService.getInstructorCourses(req.user.id);
    return res.json(successResponse(courses, undefined, { count: courses.length }));
  } catch (error) { next(error); }
};

const getInstructorStudents = async (req, res, next) => {
  try {
    const students = await instructorService.getInstructorStudents(req.user.id);
    return res.json(successResponse(students, undefined, { count: students.length }));
  } catch (error) { next(error); }
};

module.exports = {
  getInstructorStats,
  getInstructorCourses,
  getInstructorStudents
};
