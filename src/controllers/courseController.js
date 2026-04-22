const courseService = require('../services/course.service');
const { successResponse } = require('../utils/response.util');

const getCourses = async (req, res, next) => {
  try {
    const payload = await courseService.getAllCourses(req.query);
    return res.json(successResponse(payload.data, 'Courses fetched successfully', {
      count: payload.count,
      total: payload.total,
      page: payload.page,
      pages: payload.pages,
      source: payload.source
    }));
  } catch (error) {
    next(error);
  }
};

const getCourse = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById(req.params.id);
    return res.json(successResponse(course));
  } catch (error) {
    next(error);
  }
};

const createCourse = async (req, res, next) => {
  try {
    const course = await courseService.createCourse(req.body, req.user.id);
    return res.status(201).json(successResponse(course, 'Course created successfully'));
  } catch (error) {
    next(error);
  }
};

const enrollFree = async (req, res, next) => {
  try {
    const result = await courseService.enrollFreeCourse(req.params.id, req.user.id);
    return res.json(successResponse(result, result.message));
  } catch (error) {
    next(error);
  }
};

const getEnrolledCourses = async (req, res, next) => {
  try {
    const courses = await courseService.getEnrolledCourses(req.user.id);
    return res.json(successResponse(courses, 'Enrolled courses fetched successfully', { count: courses.length }));
  } catch (error) {
    next(error);
  }
};

const getCourseAnalytics = async (req, res, next) => {
  try {
    const analytics = await courseService.getAnalytics();
    return res.json(successResponse(analytics));
  } catch (error) {
    next(error);
  }
};

const updateCourse = async (req, res, next) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body, req.user);
    return res.json(successResponse(course, 'Course updated successfully'));
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
