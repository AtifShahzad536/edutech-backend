const Notification = require('../models/Notification');
const AppError = require('../utils/appError');

class NotificationService {
  async getNotifications(userId) {
    return Notification.find({ user: userId }).sort({ createdAt: -1 });
  }

  async markAsRead(notificationId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new AppError('Not found', 404);
    
    notification.isRead = true;
    await notification.save();
    return notification;
  }
}

module.exports = new NotificationService();
