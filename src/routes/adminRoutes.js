const express = require('express');
const { getPlatformStats, getAllUsers } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');
const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);

module.exports = router;
