const Comment = require('../models/Comment');
const Task = require('../models/Task');
const User = require('../models/User'); // ✅ Ajout
const Notification = require('../models/Notification');
const History = require('../models/History');

@@ -8,7 +9,7 @@ const History = require('../models/History');
// @access  Private
exports.createComment = async (req, res) => {
  try {
    const { taskId, content, mentions } = req.body;
    const { taskId, content, mentionedNames } = req.body; // ✅ changé ici

    if (!taskId || !content) {
      return res.status(400).json({
@@ -25,14 +26,24 @@ exports.createComment = async (req, res) => {
      });
    }

    // ✅ Convert @mentions text → userIds
    let mentionedUserIds = [];
    if (mentionedNames && mentionedNames.length > 0) {
      mentionedUserIds = await User.find({
        firstName: { $in: mentionedNames }
      }).select('_id');

      mentionedUserIds = mentionedUserIds.map(u => u._id.toString());
    }

    const comment = await Comment.create({
      task: taskId,
      user: req.user.id,
      content,
      mentions: mentions || []
      mentions: mentionedUserIds
    });

    // Create history entry
    // ✅ Add history
    await History.create({
      user: req.user.id,
      action: 'commented',
@@ -42,35 +53,33 @@ exports.createComment = async (req, res) => {
      project: task.project
    });

    // Notify task assignees
    // ✅ Notify assigned users except sender
    for (const userId of task.assignedTo) {
      if (userId.toString() !== req.user.id) {
        await Notification.create({
          recipient: userId,
          sender: req.user.id,
          type: 'comment_added',
          title: 'New comment',
          message: `${req.user.firstName} commented on task "${task.title}"`,
          title: 'Nouveau commentaire',
          message: `${req.user.firstName} a commenté la tâche "${task.title}"`,
          relatedTask: taskId,
          relatedProject: task.project
        });
      }
    }

    // Notify mentioned users
    if (mentions && mentions.length > 0) {
      for (const userId of mentions) {
        if (userId !== req.user.id) {
          await Notification.create({
            recipient: userId,
            sender: req.user.id,
            type: 'mention',
            title: 'You were mentioned',
            message: `${req.user.firstName} mentioned you in a comment on task "${task.title}"`,
            relatedTask: taskId,
            relatedProject: task.project
          });
        }
    // ✅ Notify mentioned users
    for (const userId of mentionedUserIds) {
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

@@ -82,6 +91,7 @@ exports.createComment = async (req, res) => {
      success: true,
      data: populatedComment
    });

  } catch (error) {
    res.status(500).json({
      success: false,
@@ -129,27 +139,23 @@ exports.updateComment = async (req, res) => {
      });
    }

    // Check if user is comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this comment'
        message: 'Not authorized'
      });
    }

    comment.content = req.body.content;
    comment.isEdited = true;
    comment.editedAt = new Date();

    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
    const updated = await Comment.findById(comment._id)
      .populate('user', 'firstName lastName email avatar');

    res.status(200).json({
      success: true,
      data: updatedComment
    });
    res.status(200).json({ success: true, data: updated });

  } catch (error) {
    res.status(500).json({
      success: false,
@@ -167,18 +173,11 @@ exports.deleteComment = async (req, res) => {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      });
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    // Check if user is comment owner
    if (comment.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this comment'
      });
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await comment.deleteOne();
@@ -187,6 +186,7 @@ exports.deleteComment = async (req, res) => {
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
