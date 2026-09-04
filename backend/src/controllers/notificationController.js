const Notification = require('../models/Notification');
const { inMemoryNotifications } = require('../services/notificationService');

const getMyNotifications = async (req, res, next) => {
  try {
    const userId = (req.user.id || req.user._id).toString();

    let notifications = [];
    try {
      notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(20).lean();
    } catch (err) {
      notifications = inMemoryNotifications.filter(
        (n) => n.userId && n.userId.toString() === userId
      );
    }

    if (!notifications || notifications.length === 0) {
      notifications = inMemoryNotifications.filter(
        (n) => n.userId && n.userId.toString() === userId
      );
    }

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = (req.user.id || req.user._id).toString();

    try {
      await Notification.findOneAndUpdate({ _id: id, userId }, { isRead: true });
    } catch (err) {
      const found = inMemoryNotifications.find((n) => (n._id || n.id) === id);
      if (found) found.isRead = true;
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read.'
    });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const userId = (req.user.id || req.user._id).toString();

    try {
      await Notification.updateMany({ userId }, { isRead: true });
    } catch (err) {
      inMemoryNotifications.forEach((n) => {
        if (n.userId && n.userId.toString() === userId) {
          n.isRead = true;
        }
      });
    }

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read.'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
  markAllAsRead
};
