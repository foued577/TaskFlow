const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, estimatedHours, startDate, dueDate, tags, parentTask } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({
        success: false,
        message: 'Task title and project are required'
      });
    }

    // Verify project and authorization
    const project = await Project.findById(projectId).populate('team');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || [],
      priority: priority || 'medium',
      estimatedHours: estimatedHours || 0,
      startDate,
      dueDate,
      tags: tags || [],
      parentTask: parentTask || null,
      createdBy: req.user.id
    });

    // Create history entry
    await History.create({
      user: req.user.id,
      action: 'created',
      entityType: 'task',
      entityId: task._id,
      entityName: title,
      project: projectId
    });

    // Notify assigned users
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        if (userId !== req.user.id) {
          await Notification.create({
            recipient: userId,
            sender: req.user.id,
            type: 'task_assigned',
            title: 'New task assigned',
            message: `${req.user.firstName} assigned you to task "${title}"`,
            relatedTask: task._id,
            relatedProject: projectId
          });
        }
      }
    }

    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('project', 'name color');

    res.status(201).json({
      success: true,
      data: populatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: error.message
    });
  }
};

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, assignedTo, priority, dueDate } = req.query;

    let query = {};

    if (projectId) {
      query.project = projectId;
    } else {
      // Get all projects from user's teams
      const teams = await Team.find({ 'members.user': req.user.id });
      const teamIds = teams.map(t => t._id);
      const projects = await Project.find({ team: { $in: teamIds } });
      const projectIds = projects.map(p => p._id);
      query.project = { $in: projectIds };
    }

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (priority) query.priority = priority;
    if (dueDate) {
      const date = new Date(dueDate);
      query.dueDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999))
      };
    }

    // Only parent tasks (no subtasks in main list)
    query.parentTask = null;

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('project', 'name color team')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: error.message
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('project')
      .populate('parentTask', 'title')
      .populate('subtasks.completedBy', 'firstName lastName')
      .populate('attachments.uploadedBy', 'firstName lastName');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check authorization
    const project = await Project.findById(task.project).populate('team');
    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: error.message
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo.map(id => id.toString());

    // Update fields
    const updatableFields = ['title', 'description', 'status', 'priority', 'estimatedHours', 'startDate', 'dueDate', 'tags', 'assignedTo'];
    
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    // If status changed to completed
    if (req.body.status === 'completed' && oldStatus !== 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    // Create history entry
    await History.create({
      user: req.user.id,
      action: 'updated',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      project: task.project
    });

    // Notify on status change
    if (oldStatus !== task.status) {
      const assignedUsers = task.assignedTo.filter(id => id.toString() !== req.user.id);
      for (const userId of assignedUsers) {
        await Notification.create({
          recipient: userId,
          sender: req.user.id,
          type: 'task_updated',
          title: 'Task status updated',
          message: `${req.user.firstName} changed task "${task.title}" status to ${task.status}`,
          relatedTask: task._id,
          relatedProject: task.project
        });
      }
    }

    // Notify newly assigned users
    if (req.body.assignedTo) {
      const newAssignees = task.assignedTo.filter(id => !oldAssignedTo.includes(id.toString()));
      for (const userId of newAssignees) {
        if (userId.toString() !== req.user.id) {
          await Notification.create({
            recipient: userId,
            sender: req.user.id,
            type: 'task_assigned',
            title: 'Task assigned',
            message: `${req.user.firstName} assigned you to task "${task.title}"`,
            relatedTask: task._id,
            relatedProject: task.project
          });
        }
      }
    }

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('project', 'name color');

    res.status(200).json({
      success: true,
      data: updatedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: error.message
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: error.message
    });
  }
};

// @desc    Add subtask
// @route   POST /api/tasks/:id/subtasks
// @access  Private
exports.addSubtask = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Subtask title is required'
      });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    task.subtasks.push({ title });
    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding subtask',
      error: error.message
    });
  }
};

// @desc    Toggle subtask completion
// @route   PUT /api/tasks/:id/subtasks/:subtaskId
// @access  Private
exports.toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) {
      return res.status(404).json({
        success: false,
        message: 'Subtask not found'
      });
    }

    subtask.isCompleted = !subtask.isCompleted;
    if (subtask.isCompleted) {
      subtask.completedAt = new Date();
      subtask.completedBy = req.user.id;
    } else {
      subtask.completedAt = null;
      subtask.completedBy = null;
    }

    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error toggling subtask',
      error: error.message
    });
  }
};

// @desc    Upload attachment
// @route   POST /api/tasks/:id/attachments
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    task.attachments.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user.id
    });

    await task.save();

    // Create history entry
    await History.create({
      user: req.user.id,
      action: 'attached_file',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      project: task.project,
      details: { filename: req.file.originalname }
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading attachment',
      error: error.message
    });
  }
};

// @desc    Get overdue tasks
// @route   GET /api/tasks/overdue
// @access  Private
exports.getOverdueTasks = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user.id });
    const teamIds = teams.map(t => t._id);
    const projects = await Project.find({ team: { $in: teamIds } });
    const projectIds = projects.map(p => p._id);

    const tasks = await Task.find({
      project: { $in: projectIds },
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    })
    .populate('assignedTo', 'firstName lastName email avatar')
    .populate('project', 'name color')
    .sort('dueDate');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue tasks',
      error: error.message
    });
  }
};
