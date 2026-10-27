const Notification = require('../models/Notification');

const listNotifications = async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('issue', 'ticketNumber title status');

  const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

  return res.json({ notifications, unreadCount });
};

const markNotificationRead = async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) {
    return res.status(404).json({ message: 'Notification not found.' });
  }

  notification.isRead = true;
  await notification.save();

  return res.json({ message: 'Notification marked as read.', notification });
};

const markAllNotificationsRead = async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { isRead: true });
  return res.json({ message: 'All notifications marked as read.' });
};

module.exports = {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
