const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const History = require('../models/History');

// @desc    Create comment
// @route   POST /api/comments
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { taskId, content, mentions } = req.body;

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

    const comment = await Comment.create({
      task: taskId,
      user: req.user.id,
      content,
      mentions: mentions || []
    });

    // Create history entry
    try {
      await History.create({
        user: req.user.id,
        action: 'commented',
        entityType: 'task',
        entityId: taskId,
        entityName: task.title,
        project: task.project || null
      });
    } catch (historyError) {
      console.error("Erreur lors de la création de l'historique:", historyError);
      // Ne pas faire échouer la requête si l'historique échoue
    }

    // Notify task assignees - s'assurer que assignedTo existe et est un tableau
    if (task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
      for (const userId of task.assignedTo) {
        if (userId && userId.toString() !== req.user.id) {
          try {
            await Notification.create({
              user: userId,
              type: 'comment_added',
              title: 'New comment',
              message: `${req.user.firstName} commented on task "${task.title}"`
            });
          } catch (notifError) {
            console.error("Erreur lors de la création de la notification:", notifError);
            // Ne pas faire échouer la requête si la notification échoue
          }
        }
      }
    }

    // Notify mentioned users
    if (mentions && Array.isArray(mentions) && mentions.length > 0) {
      for (const userId of mentions) {
        if (userId && userId.toString() !== req.user.id) {
          try {
            await Notification.create({
              user: userId,
              type: 'mention',
              title: 'You were mentioned',
              message: `${req.user.firstName} mentioned you in a comment on task "${task.title}"`
            });
          } catch (notifError) {
            console.error("Erreur lors de la création de la notification:", notifError);
            // Ne pas faire échouer la requête si la notification échoue
          }
        }
      }
    }

    const populatedComment = await Comment.findById(comment._id)
      .populate('user', 'firstName lastName email')
      .populate('mentions', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedComment
    });
  } catch (error) {
    console.error("Erreur lors de la création du commentaire:", error);
    res.status(500).json({
      success: false,
      message: 'Error creating comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get comments for task
// @route   GET /api/comments/:taskId ou GET /api/comments/task/:taskId
// @access  Private
exports.getComments = async (req, res) => {
  try {
    // Gérer les deux formats : /comments/:taskId et /comments/task/:taskId
    const taskId = req.params.taskId || req.params.id;
    
    const comments = await Comment.find({ task: taskId })
      .populate('user', 'firstName lastName email')
      .populate('mentions', 'firstName lastName')
      .sort('createdAt');

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
  } catch (error) {
    console.error("Erreur lors du chargement des commentaires:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching comments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private
exports.updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
      });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('user', 'firstName lastName email');

    res.status(200).json({
      success: true,
      data: updatedComment
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du commentaire:", error);
    res.status(500).json({
      success: false,
      message: 'Error updating comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
    }

    // Check if user is comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du commentaire:", error);
    res.status(500).json({
      success: false,
      message: 'Error deleting comment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
