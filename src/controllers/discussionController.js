const Discussion = require('../models/Discussion');

// @desc    Get course discussions
// @route   GET /api/discussions/:courseId
// @access  Private
const getDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find({ course: req.params.courseId })
      .populate('user', 'firstName lastName avatar')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: discussions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a discussion
// @route   POST /api/discussions
// @access  Private
const createDiscussion = async (req, res) => {
  try {
    const { courseId, title, content } = req.body;
    const discussion = await Discussion.create({
      course: courseId,
      user: req.user.id,
      title,
      content
    });
    res.status(201).json({ success: true, data: discussion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all discussions (Global Community)
// @route   GET /api/discussions/all
// @access  Private
const getAllDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find()
      .populate('user', 'firstName lastName avatar role')
      .populate('course', 'title')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: discussions.length, data: discussions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get discussion by ID
// @route   GET /api/discussions/thread/:id
// @access  Private
const getDiscussionById = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id)
      .populate('user', 'firstName lastName avatar role')
      .populate('course', 'title')
      .populate('replies.user', 'firstName lastName avatar role');
    
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    // Increment views
    discussion.views += 1;
    await discussion.save();

    res.json({ success: true, data: discussion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a reply to discussion
// @route   POST /api/discussions/thread/:id/reply
// @access  Private
const addReply = async (req, res) => {
  try {
    const { content } = req.body;
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    discussion.replies.push({
      user: req.user.id,
      content,
      createdAt: Date.now()
    });

    await discussion.save();
    
    const updated = await Discussion.findById(req.params.id)
      .populate('replies.user', 'firstName lastName avatar role');

    res.status(201).json({ success: true, data: updated.replies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle like on discussion
// @route   PUT /api/discussions/thread/:id/like
// @access  Private
const toggleLike = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    const likeIndex = discussion.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      // Unlike
      discussion.likes.splice(likeIndex, 1);
    } else {
      // Like
      discussion.likes.push(req.user.id);
    }

    await discussion.save();
    res.json({ success: true, data: discussion.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle like on reply
// @route   PUT /api/discussions/thread/:id/reply/:replyId/like
// @access  Private
const toggleReplyLike = async (req, res) => {
  try {
    const discussion = await Discussion.findById(req.params.id);
    
    if (!discussion) {
      return res.status(404).json({ success: false, message: 'Discussion not found' });
    }

    const reply = discussion.replies.id(req.params.replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }

    const likeIndex = reply.likes.indexOf(req.user.id);
    if (likeIndex > -1) {
      // Unlike
      reply.likes.splice(likeIndex, 1);
    } else {
      // Like
      reply.likes.push(req.user.id);
    }

    await discussion.save();
    
    const updated = await Discussion.findById(req.params.id)
      .populate('replies.user', 'firstName lastName avatar role');

    res.json({ success: true, data: updated.replies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDiscussions,
  createDiscussion,
  getAllDiscussions,
  getDiscussionById,
  addReply,
  toggleLike,
  toggleReplyLike
};
