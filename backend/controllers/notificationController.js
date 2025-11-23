const Notification = require("../models/Notification");

// GET USER NOTIFICATIONS
exports.getNotifications = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Le modèle utilise 'user' comme champ
    const notifications = await Notification.find({ user: req.user.id })
      .populate("user", "firstName lastName email")
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
    console.error("Erreur lors du chargement des notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// MARK AS READ
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification introuvable" 
      });
    }

    // Vérifier que la notification appartient à l'utilisateur
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: "Accès refusé" 
      });
    }

    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la notification:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// MARK ALL AS READ
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user.id },
      { isRead: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour des notifications:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// DELETE NOTIFICATION
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ 
        success: false, 
        message: "Notification introuvable" 
      });
    }

    // Vérifier que la notification appartient à l'utilisateur
    if (notification.user.toString() !== req.user.id) {
      return res.status(403).json({ 
        success: false, 
        message: "Accès refusé" 
      });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la suppression de la notification:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
