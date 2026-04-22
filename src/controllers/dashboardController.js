const dashboardService = require('../services/dashboard.service');
const { successResponse } = require('../utils/response.util');

const getDashboardStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getDashboardStats(req.user.id);
    return res.json(successResponse(data));
  } catch (error) { next(error); }
};

const markLessonComplete = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;
    const progress = await dashboardService.markLessonComplete(courseId, lessonId, req.user.id);
    return res.json(successResponse(progress));
  } catch (error) { next(error); }
};

const getCourseProgress = async (req, res, next) => {
  try {
    const progress = await dashboardService.getCourseProgress(req.params.courseId, req.user.id);
    return res.json(successResponse(progress));
  } catch (error) { next(error); }
};

module.exports = {
  getDashboardStats,
  markLessonComplete,
  getCourseProgress
};
