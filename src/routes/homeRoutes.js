const express = require('express');
const { getHomeStats, getFeaturedCourses, getLatestCourses } = require('../controllers/homeController');
const router = express.Router();

// All public routes - no auth required
router.get('/stats', getHomeStats);
router.get('/featured-courses', getFeaturedCourses);
router.get('/latest-courses', getLatestCourses);

module.exports = router;
