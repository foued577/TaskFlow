const Notification = require("../models/Notification");

// GET USER NOTIFICATIONS
exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);

    const unreadCount = await Notification.countDocuments({
      user: req.user.id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// MARK AS READ
exports.markAsRead = async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });

  res.status(200).json({ success: true });
};

// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id },
    { isRead: true }
  );

  res.status(200).json({ success: true });
};

// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  await Notification.findByIdAndDelete(req.params.id);
  res.status(200).json({ success: true });
};
