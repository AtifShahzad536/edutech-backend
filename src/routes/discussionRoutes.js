const express = require('express');
const { 
  getDiscussions, 
  createDiscussion, 
  getAllDiscussions,
  getDiscussionById,
  addReply,
  toggleLike,
  toggleReplyLike
} = require('../controllers/discussionController');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.use(protect);

router.get('/all', getAllDiscussions);
router.get('/thread/:id', getDiscussionById);
router.put('/thread/:id/like', toggleLike);
router.put('/thread/:id/reply/:replyId/like', toggleReplyLike);
router.post('/thread/:id/reply', addReply);
router.get('/:courseId', getDiscussions);
router.post('/', createDiscussion);

module.exports = router;
