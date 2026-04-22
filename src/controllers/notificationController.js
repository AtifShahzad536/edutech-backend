const notificationService = require('../services/notification.service');
const { successResponse } = require('../utils/response.util');

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(req.user.id);
    return res.json(successResponse(notifications, undefined, { count: notifications.length }));
  } catch (error) { next(error); }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    return res.json(successResponse(notification));
  } catch (error) { next(error); }
};

module.exports = {
  getNotifications,
  markAsRead
};
