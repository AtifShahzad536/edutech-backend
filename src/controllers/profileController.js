const profileService = require('../services/profile.service');
const { successResponse } = require('../utils/response.util');

const updateProfile = async (req, res, next) => {
  try {
    const updatedUser = await profileService.updateProfile(req.user.id, req.body);
    return res.json(successResponse({ user: updatedUser }));
  } catch (error) {
    next(error);
  }
};

const importFromLinkedIn = async (req, res, next) => {
  try {
    const data = await profileService.importFromLinkedInPDF(req.file?.buffer, req.user.id);
    return res.json(successResponse(data, "Real records successfully parsed from your PDF"));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  importFromLinkedIn
};
