exports.createComment = async (req, res) => {
  try {
    const { taskId, content, mentions } = req.body; // ✅ On récupère mentions (IDs directes)

    if (!taskId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Task ID and content are required'
      });
    }

    const task = await Task.findById(taskId).populate('assignedTo', '_id');
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // ✅ On garde tel quel
    const comment = await Comment.create({
      task: taskId,
      user: req.user.id,
      content,
      mentions: mentions || []
    });

    // ✅ Historique
    await History.create({
      user: req.user.id,
      action: 'commented',
      entityType: 'task',
      entityId: taskId,
      entityName: task.title,
      project: task.project
    });

    // ✅ Notifier les assignés (sauf l'auteur)
    for (const userId of task.assignedTo) {
      if (userId.toString() !== req.user.id) {
        await Notification.create({
          recipient: userId,
          sender: req.user.id,
          type: 'comment_added',
          title: 'Nouveau commentaire',
          message: `${req.user.firstName} a commenté la tâche "${task.title}"`,
          relatedTask: taskId,
          relatedProject: task.project
        });
      }
    }

    // ✅ Notifier les personnes mentionnées
    if (mentions && mentions.length > 0) {
      for (const userId of mentions) {
        if (userId !== req.user.id) {
          await Notification.create({
            recipient: userId,
            sender: req.user.id,
            type: 'mention',
            title: 'Vous avez été mentionné',
            message: `${req.user.firstName} vous a mentionné dans la tâche "${task.title}"`,
            relatedTask: taskId,
            relatedProject: task.project
          });
        }
      }
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'firstName lastName email avatar')
      .populate('mentions', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedComment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: error.message
    });
  }
};
