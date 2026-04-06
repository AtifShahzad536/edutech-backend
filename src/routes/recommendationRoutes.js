const express = require('express');
const { getRecommendations, aiGuideChat } = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/', getRecommendations);
router.post('/ai-chat', aiGuideChat);

module.exports = router;
