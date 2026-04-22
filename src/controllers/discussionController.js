const discussionService = require('../services/discussion.service');
const { successResponse } = require('../utils/response.util');

const getDiscussions = async (req, res, next) => {
  try {
    const discussions = await discussionService.getDiscussions(req.params.courseId);
    return res.json(successResponse(discussions, undefined, { count: discussions.length }));
  } catch (error) { next(error); }
};

const createDiscussion = async (req, res, next) => {
  try {
    const discussion = await discussionService.createDiscussion(req.body, req.user.id);
    return res.status(201).json(successResponse(discussion));
  } catch (error) { next(error); }
};

const getAllDiscussions = async (req, res, next) => {
  try {
    const discussions = await discussionService.getAllDiscussions();
    return res.json(successResponse(discussions, undefined, { count: discussions.length }));
  } catch (error) { next(error); }
};

const getDiscussionById = async (req, res, next) => {
  try {
    const discussion = await discussionService.getDiscussionById(req.params.id);
    return res.json(successResponse(discussion));
  } catch (error) { next(error); }
};

const addReply = async (req, res, next) => {
  try {
    const replies = await discussionService.addReply(req.params.id, req.body.content, req.user.id);
    return res.status(201).json(successResponse(replies));
  } catch (error) { next(error); }
};

const toggleLike = async (req, res, next) => {
  try {
    const likes = await discussionService.toggleLike(req.params.id, req.user.id);
    return res.json(successResponse(likes));
  } catch (error) { next(error); }
};

const toggleReplyLike = async (req, res, next) => {
  try {
    const replies = await discussionService.toggleReplyLike(req.params.id, req.params.replyId, req.user.id);
    return res.json(successResponse(replies));
  } catch (error) { next(error); }
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
