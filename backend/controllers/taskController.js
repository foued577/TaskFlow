const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');

// @desc Create new task
// @route POST /api/tasks
// @access Private
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, estimatedHours, startDate, dueDate, tags, parentTask } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ success: false, message: 'Task title and project are required' });
    }

    const project = await Project.findById(projectId).populate('team');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not authorized' });

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

    await History.create({
      user: req.user.id,
      action: 'created',
      entityType: 'task',
      entityId: task._id,
      entityName: title,
      project: projectId
    });

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

    res.status(201).json({ success: true, data: populatedTask });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating task', error: error.message });
  }
};

// ✅ FIXED & STABLE GET TASKS FUNCTION
exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, filterType, assignedUser } = req.query;

    console.log('🔍 getTasks called with:', { projectId, status, priority, filterType, assignedUser });
    console.log('👤 User ID:', req.user.id);

    const teams = await Team.find({ 'members.user': req.user.id });
    const projects = await Project.find({ team: { $in: teams.map(t => t._id) } });

    console.log('👥 Teams found:', teams.length);
    console.log('📁 Projects found:', projects.length);

    let query = {
      project: projectId || { $in: projects.map(p => p._id) },
      parentTask: null
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    // ✅ Tâches où JE suis assigné
    if (filterType === "assignedToMe") {
      query.assignedTo = { $in: [req.user.id] };
    }

    // ✅ Tâches créées par moi
    if (filterType === "createdByMe") {
      query.createdBy = req.user.id;
    }

    // ✅ Tâches créées par moi mais NON assignées (du tout)
    if (filterType === "createdByMeNotAssignedToMe") {
      query.createdBy = req.user.id;
      // Cherche les tâches sans assigné OU sans moi dans les assignés
      query.$or = [
        { assignedTo: { $exists: false } },
        { assignedTo: { $size: 0 } },
        { assignedTo: { $nin: [req.user.id] } }
      ];
    }

    // ✅ Filtre direct sur un utilisateur assigné précis
    if (assignedUser) query.assignedTo = { $in: [assignedUser] };

    console.log('🔎 Final query:', JSON.stringify(query, null, 2));

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('project', 'name color team')
      .sort('-createdAt');

    console.log('✅ Tasks found:', tasks.length);

    res.status(200).json({ success: true, count: tasks.length, data: tasks });

  } catch (error) {
    console.error('❌ Error in getTasks:', error);
    res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
  }
};

// @desc Get single task
// @route GET /api/tasks/:id
// @access Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('project')
      .populate('parentTask', 'title')
      .populate('subtasks.completedBy', 'firstName lastName')
      .populate('attachments.uploadedBy', 'firstName lastName');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    res.status(200).json({ success: true, data: task });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching task', error: error.message });
  }
};

// @desc Update task
// @route PUT /api/tasks/:id
// @access Private
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const oldStatus = task.status;
    const oldAssignedTo = task.assignedTo.map(id => id.toString());

    const updatableFields = ['title', 'description', 'status', 'priority', 'estimatedHours', 'startDate', 'dueDate', 'tags', 'assignedTo'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    if (req.body.status === 'completed' && oldStatus !== 'completed') {
      task.completedAt = new Date();
    }

    await task.save();

    await History.create({
      user: req.user.id,
      action: 'updated',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      project: task.project
    });

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

    res.status(200).json({ success: true, data: updatedTask });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating task', error: error.message });
  }
};

// @desc Delete task
// @route DELETE /api/tasks/:id
// @access Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    await task.deleteOne();

    res.status(200).json({ success: true, message: 'Task deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting task', error: error.message });
  }
};

// @desc Add subtask
// @route POST /api/tasks/:id/subtasks
// @access Private
exports.addSubtask = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Subtask title is required' });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    task.subtasks.push({ title });
    await task.save();

    res.status(200).json({ success: true, data: task });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding subtask', error: error.message });
  }
};

// @desc Toggle subtask completion
// @route PUT /api/tasks/:id/subtasks/:subtaskId
// @access Private
exports.toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

    subtask.isCompleted = !subtask.isCompleted;
    if (subtask.isCompleted) {
      subtask.completedAt = new Date();
      subtask.completedBy = req.user.id;
    } else {
      subtask.completedAt = null;
      subtask.completedBy = null;
    }

    await task.save();

    res.status(200).json({ success: true, data: task });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling subtask', error: error.message });
  }
};

// @desc Upload attachment
// @route POST /api/tasks/:id/attachments
// @access Private
exports.uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    task.attachments.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user.id
    });

    await task.save();

    await History.create({
      user: req.user.id,
      action: 'attached_file',
      entityType: 'task',
      entityId: task._id,
      entityName: task.title,
      project: task.project,
      details: { filename: req.file.originalname }
    });

    res.status(200).json({ success: true, data: task });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error uploading attachment', error: error.message });
  }
};

// @desc Get overdue tasks
// @route GET /api/tasks/overdue
// @access Private
exports.getOverdueTasks = async (req, res) => {
  try {
    const teams = await Team.find({ 'members.user': req.user.id });
    const projects = await Project.find({ team: { $in: teams.map(t => t._id) } });

    const tasks = await Task.find({
      project: { $in: projects.map(p => p._id) },
      status: { $ne: 'completed' },
      dueDate: { $lt: new Date() }
    })
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('project', 'name color')
      .sort('dueDate');

    res.status(200).json({ success: true, count: tasks.length, data: tasks });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching overdue tasks', error: error.message });
  }
};
