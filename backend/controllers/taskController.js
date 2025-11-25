const Task = require('../models/Task');
const Project = require('../models/Project');

// =========================
// GET ALL TASKS
// =========================
exports.getTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role || 'admin';

    let filters = {};
    let queryFilters = { ...req.query };

    // Nettoyage query
    Object.keys(queryFilters).forEach((key) => {
      if (!queryFilters[key]) delete queryFilters[key];
    });

    // Filtres simples
    if (queryFilters.status) filters.status = queryFilters.status;
    if (queryFilters.priority) filters.priority = queryFilters.priority;
    if (queryFilters.projectId) filters.project = queryFilters.projectId;

    // =========================
    // 🔥 Filtre intelligent selon rôle
    // =========================

    if (role !== 'admin') {
      // Le user NON admin ne peut voir que :
      filters.$or = [
        { assignedTo: userId },
        { createdBy: userId }
      ];
    }

    // =========================
    // 🔥 Filtre Type (frontend)
    // =========================

    if (queryFilters.filterType === 'assignedToMe') {
      filters.assignedTo = userId;
    }

    if (queryFilters.filterType === 'createdByMeNotAssignedToMe') {
      filters.createdBy = userId;
      filters.assignedTo = { $ne: userId };
    }

    // =========================
    // Requête finale
    // =========================
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

// =========================
// GET ONE TASK
// =========================
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name color');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Sécurité membre
    if (req.user.role !== 'admin') {
      if (
        !task.assignedTo.includes(req.user.id) &&
        task.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
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

// =========================
// CREATE TASK
// =========================
exports.createTask = async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // 🔐 Membre doit appartenir à une équipe du projet
    if (req.user.role !== 'admin') {
      const userTeamIds = req.user.teams?.map(t => t.toString()) || [];
      const projectTeamIds = project.teams?.map(t => t.toString()) || [];

      const hasAccess = projectTeamIds.some(id => userTeamIds.includes(id));

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create task in this project'
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

// =========================
// UPDATE TASK
// =========================
exports.updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Sécurité membre
    if (req.user.role !== 'admin') {
      if (
        !task.assignedTo.includes(req.user.id) &&
        task.createdBy.toString() !== req.user.id
      ) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
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

// =========================
// DELETE TASK
// =========================
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    if (req.user.role !== 'admin' && task.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
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

// =========================
// OVERDUE TASKS
// =========================
exports.getOverdue = async (req, res) => {
  try {
    const now = new Date();

    const filters = {
      dueDate: { $lt: now },
      status: { $ne: 'completed' }
    };

    if (req.user.role !== 'admin') {
      filters.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filters).populate('assignedTo');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue tasks',
      error: err.message
    });
  }
};
