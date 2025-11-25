const Task = require('../models/Task');
const Project = require('../models/Project');

// =====================================================
// GET ALL TASKS
// =====================================================
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || 'admin';
    let filters = {};
    let q = { ...req.query };

    // Remove empty filters
    Object.keys(q).forEach((k) => {
      if (!q[k]) delete q[k];
    });

    // Simple filters
    if (q.status) filters.status = q.status;
    if (q.priority) filters.priority = q.priority;
    if (q.projectId) filters.project = q.projectId;

    // =====================================================
    // 🔐 Role filters
    // =====================================================
    if (role !== 'admin') {
      filters.$or = [
        { assignedTo: userId },
        { createdBy: userId }
      ];
    }

    // =====================================================
    // 🔥 Special filters from frontend
    // =====================================================
    if (q.filterType === 'assignedToMe') {
      filters.assignedTo = userId;
    }

    if (q.filterType === 'createdByMeNotAssignedToMe') {
      filters.createdBy = userId;
      filters.assignedTo = { $ne: userId };
    }

    const tasks = await Task.find(filters)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name color')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: tasks
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: err.message
    });
  }
};

// =====================================================
// GET ONE TASK
// =====================================================
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name color');

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // 🔐 Non-admin access rules
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(u => u.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;

      if (!isAssigned && !isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: err.message
    });
  }
};

// =====================================================
// CREATE TASK
// =====================================================
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // 🔐 Member restriction: must belong to one project team
    if (req.user.role !== 'admin') {
      const userTeamIds = req.user.teams?.map(t => t.toString()) || [];
      const projectTeams = project.teams?.map(t => t.toString()) || [];

      const allowed = projectTeams.some(t => userTeamIds.includes(t));
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create a task in this project'
        });
      }
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo,
      priority,
      status,
      dueDate,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: err.message
    });
  }
};

// =====================================================
// UPDATE TASK
// =====================================================
exports.updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // 🔐 Non-admin restriction
    if (req.user.role !== 'admin') {
      const isAssigned = task.assignedTo.some(u => u.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;

      if (!isAssigned && !isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    Object.assign(task, updates);
    await task.save();

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: err.message
    });
  }
};

// =====================================================
// DELETE TASK
// =====================================================
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Task deleted'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: err.message
    });
  }
};

// =====================================================
// ADD SUBTASK
// =====================================================
exports.addSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const title = req.body.title;
    if (!title) {
      return res.status(400).json({ success: false, message: 'Subtask title required' });
    }

    task.subtasks.push({ title, completed: false });
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, mess
