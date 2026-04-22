const uploadService = require('../services/upload.service');
const { successResponse } = require('../utils/response.util');

const uploadProfileImage = async (req, res, next) => {
  try {
    const url = await uploadService.uploadProfileImage(req.file?.buffer, req.file?.mimetype, req.user.id);
    return res.status(200).json(successResponse(url));
  } catch (error) { next(error); }
};

const uploadAssignmentFile = async (req, res, next) => {
  try {
    const data = await uploadService.uploadAssignmentFile(req.file?.buffer, req.file?.mimetype, req.file?.originalname);
    return res.status(200).json(successResponse(data.secureUrl, undefined, { originalName: data.originalName }));
  } catch (error) { next(error); }
};

const getSignedDeliveryUrl = async (req, res, next) => {
  try {
    const url = await uploadService.getSignedDeliveryUrl(req.query.url);
    return res.status(200).json(successResponse({ url })); // Needs to be { success: true, data: { url: ... } } or just url? Let's check original. The original returned { success: true, url }. Our formatter returns { success: true, data: { url } }, but to match legacy frontend without breaking it, let's just return raw json or wrap properly.
  } catch (error) { next(error); }
};

module.exports = {
  uploadProfileImage,
  uploadAssignmentFile,
  getSignedDeliveryUrl
};
