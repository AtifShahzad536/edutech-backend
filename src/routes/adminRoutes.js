const express = require('express');
const { 
  getPlatformStats, getAllUsers, updateUser, deleteUser, 
  getSettings, updateSettings, getPayments, getPaymentStats,
  getPlatformAnalytics, getLiveClasses, getAdminCourses, getAdminAssignments
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/settings', getSettings);
router.patch('/settings', updateSettings);
router.get('/payments', getPayments);
router.get('/payments/stats', getPaymentStats);
router.get('/analytics', getPlatformAnalytics);
router.get('/live-classes', getLiveClasses);
router.get('/courses', getAdminCourses);
router.get('/assignments', getAdminAssignments);

module.exports = router;
