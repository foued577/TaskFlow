const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');

// @desc    Create new task
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

// ✅ FIXED GET TASKS
exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, filterType } = req.query;

    const teams = await Team.find({ 'members.user': req.user.id });
    const teamIds = teams.map(t => t._id);

    const projects = await Project.find({ team: { $in: teamIds } });
    const allowedProjectIds = projects.map(p => p._id);

    let query = {
      project: projectId ? projectId : { $in: allowedProjectIds },
      parentTask: null
    };

    if (status) query.status = status;
    if (priority) query.priority = priority;

    if (filterType === "assignedToMe") {
      query.assignedTo = { $in: [req.user.id] };
    }

    if (filterType === "createdByMeNotAssignedToMe") {
      query.createdBy = req.user.id;
      query.assignedTo = { $nin: [req.user.id] };
    }

    const tasks = await Task.find(query)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('project', 'name color team')
      .sort('-createdAt');

    res.status(200).json({ success: true, count: tasks.length, data: tasks });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching tasks', error: error.message });
  }
};

// @desc    Get single task
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

    const project = await Project.findById(task.project).populate('team');
    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) return res.status(403).json({ success: false, message: 'Not authorized' });

    res.status(200).json({ success: true, data: task });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching task', error: error.message });
  }
};

// @desc    Update task
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const fields = ['title', 'description', 'status', 'priority', 'estimatedHours', 'startDate', 'dueDate', 'tags', 'assignedTo'];
    fields.forEach(f => { if (req.body[f] !== undefined) task[f] = req.body[f]; });

    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName')
      .populate('project', 'name color');

    res.status(200).json({ success: true, data: updatedTask });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating task', error: error.message });
  }
};

// @desc    Delete task
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

// @desc    Get overdue tasks
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

    res.status(200).json({ success: true, count: tasks.length, data: tasks });

  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching overdue tasks', error: error.message });
  }
};
