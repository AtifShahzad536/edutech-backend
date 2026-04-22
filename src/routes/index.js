const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const adminRoutes = require('./adminRoutes');
const uploadRoutes = require('./uploadRoutes');
const profileRoutes = require('./profileRoutes');
const courseRoutes = require('./courseRoutes');
const paymentRoutes = require('./paymentRoutes');
const notificationRoutes = require('./notificationRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const discussionRoutes = require('./discussionRoutes');
const liveClassRoutes = require('./liveClassRoutes');
const assignmentRoutes = require('./assignmentRoutes');
const instructorRoutes = require('./instructorRoutes');
const recommendationRoutes = require('./recommendationRoutes');
const homeRoutes = require('./homeRoutes');

const { authLimiter } = require('../middleware/rateLimiter');

router.use('/auth', authLimiter, authRoutes);
router.use('/admin', adminRoutes);
router.use('/uploads', uploadRoutes);
router.use('/users/profile', profileRoutes);
router.use('/courses', courseRoutes);
router.use('/payments', paymentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/discussions', discussionRoutes);
router.use('/live', liveClassRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/instructor', instructorRoutes);
router.use('/recommendations', recommendationRoutes);
router.use('/home', homeRoutes);

module.exports = router;
