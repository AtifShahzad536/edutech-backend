const recommendationService = require('../services/recommendation.service');
const { successResponse } = require('../utils/response.util');

const getRecommendations = async (req, res, next) => {
  try {
    const data = await recommendationService.getRecommendations(req.user.id);
    return res.json(successResponse(data.recommendations, data.aiMessage, { enrolledCategories: data.enrolledCategories }));
  } catch (error) { next(error); }
};

const aiGuideChat = async (req, res, next) => {
  try {
    const reply = await recommendationService.aiGuideChat(req.body.message, req.user.id);
    return res.json(successResponse({ reply }));
  } catch (error) { next(error); }
};

module.exports = {
  getRecommendations,
  aiGuideChat
};
