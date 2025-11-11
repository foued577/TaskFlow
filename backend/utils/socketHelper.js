/**
 * Helper function to emit a notification via Socket.io
 * @param {Object} io - Socket.io instance
 * @param {Object} notification - Notification object to send
 */
const emitNotification = (io, notification) => {
  if (!io) {
    console.error('❌ Socket.io instance not available');
    return;
  }

  try {
    // Émettre la notification à tous les clients connectés
    // Dans une implémentation plus avancée, on pourrait émettre uniquement au destinataire
    io.emit('notification:new', {
      message: notification.message,
      title: notification.title,
      type: notification.type,
      recipient: notification.recipient,
      sender: notification.sender,
      relatedTask: notification.relatedTask,
      relatedProject: notification.relatedProject,
      relatedTeam: notification.relatedTeam,
      createdAt: notification.createdAt || new Date(),
    });

    console.log('🔔 Notification émise via Socket.io:', notification.type);
  } catch (error) {
    console.error('❌ Erreur lors de l\'émission de la notification:', error.message);
  }
};

module.exports = { emitNotification };

