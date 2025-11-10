const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const History = require('../models/History');

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { taskId, content, mentions = [] } = req.body; // ✅ Correction ici

    if (!taskId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Task ID and content are required'
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // ✅ mentions vient déjà sous forme d'IDs → pas de conversion nécessaire
    const mentionedUserIds = mentions.filter(id => id !== req.user.id);

    // ✅ Create comment
    const comment = await Comment.create({
      task: taskId,
      user: req.user.id,
      content,
      mentions: mentionedUserIds
    });

    // ✅ Add history
    await History.create({
      user: req.user.id,
      action: 'commented',
      entityType: 'task',
      entityId: taskId,
      entityName: task.title,
      project: task.project
    });

    // ✅ Notify assigned users except sender
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

    // ✅ Notify mentioned users
    for (const userId of mentionedUserIds) {
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
