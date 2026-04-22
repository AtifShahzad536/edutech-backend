const homeService = require('../services/home.service');
const { successResponse } = require('../utils/response.util');

const getHomeStats = async (req, res, next) => {
  try {
    const stats = await homeService.getHomeStats();
    return res.json(successResponse({ stats }));
  } catch (error) { next(error); }
};

const getFeaturedCourses = async (req, res, next) => {
  try {
    const courses = await homeService.getFeaturedCourses();
    return res.json(successResponse(courses));
  } catch (error) { next(error); }
};

const getLatestCourses = async (req, res, next) => {
  try {
    const courses = await homeService.getLatestCourses();
    return res.json(successResponse(courses));
  } catch (error) { next(error); }
};

module.exports = { getHomeStats, getFeaturedCourses, getLatestCourses };
