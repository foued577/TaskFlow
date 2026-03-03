// backend/controllers/taskController.js
const Task = require('../models/Task');
const Project = require('../models/Project');
// ✅ ✅ ✅ AJOUT (pour fallback si req.user.teams est vide)
const Team = require('../models/Team');

// ✅ ✅ ✅ AJOUT IMPORT MASSIF
const fs = require('fs');
const XLSX = require('xlsx');
const User = require('../models/User');

// ✅ ✅ ✅ AJOUT : pour vérifier ObjectId sans dépendance
const mongoose = require('mongoose');

// ✅ ✅ ✅ AJOUT : CSV fallback sans dépendance (gère "," et ";" + BOM)
const parseCSVFallback = (content) => {
  const clean = String(content || '').replace(/^\uFEFF/, ''); // BOM
  const lines = clean
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  // détecter séparateur
  const headerLine = lines[0];
  const sep = headerLine.includes(';') && !headerLine.includes(',') ? ';' : ',';

  const headers = headerLine.split(sep).map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(sep).map((v) => v.trim());
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = values[i] ?? '';
    });
    return obj;
  });
};

// =====================================================
// ✅ TOTAL TASKS COUNT (GLOBAL) (AJOUT)
// =====================================================
exports.getTotalCount = async (req, res) => {
  try {
    const total = await Task.countDocuments({});
    return res.status(200).json({ success: true, data: { total } });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error counting tasks',
      error: err.message,
    });
  }
};

// =====================================================
// ✅ DUPLICATE TASK (DRAFT) (AJOUT)
// =====================================================
exports.getDuplicateDraft = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name color teams team');

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // ✅ ✅ ✅ ADMIN ACCESS BY TEAM (même logique que getTask) (AJOUT)
    if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      const projectTeamIds = [
        ...((task.project?.teams || []).map((t) => t.toString())),
        ...(task.project?.team ? [task.project.team.toString()] : []),
      ];

      const isAssignedToMe = task.assignedTo.some(
        (u) => u.toString() === req.user.id.toString()
      );
      const hasTeamAccess = projectTeamIds.some((id) => userTeamIds.includes(id));

      if (!hasTeamAccess && !isAssignedToMe) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    // Member access (même logique que getTask) (AJOUT)
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const isAssigned = task.assignedTo.some((u) => u.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;

      if (!isAssigned && !isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    // Draft = copie nettoyée
    const draft = task.toObject();
    delete draft._id;
    delete draft.createdAt;
    delete draft.updatedAt;

    // Ajustements par défaut
    if (draft.title) draft.title = `Copie de - ${draft.title}`;

    res.status(200).json({ success: true, data: draft });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error duplicating task',
      error: err.message,
    });
  }
};

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

    if (q.status) filters.status = q.status;
    if (q.priority) filters.priority = q.priority;
    if (q.projectId) filters.project = q.projectId;

    // ✅ ✅ ✅ ARCHIVE FILTER (AJOUT)
    // /tasks -> non archivées
    // /tasks?archived=true -> archivées
    if (q.archived === 'true' || q.archived === true) {
      filters.archived = true;
    } else {
      filters.archived = { $ne: true };
    }

    // ✅ ✅ ✅ ADMIN SCOPING BY TEAMS (AJOUT)
    // admin (pas superadmin) voit seulement tâches des projets de ses équipes
    // + tâches assignées à lui
    if (role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      // projets accessibles par ses équipes (teams ou legacy team)
      const allowedProjects = await Project.find({
        $or: [{ teams: { $in: userTeamIds } }, { team: { $in: userTeamIds } }],
      }).select('_id');

      const allowedProjectIds = allowedProjects.map((p) => p._id);

      // si le front filtre par projectId, on vérifie qu'il est dans ses projets
      if (filters.project) {
        const projId = filters.project.toString();
        const ok = allowedProjectIds.some((id) => id.toString() === projId);
        if (!ok) {
          return res.status(200).json({ success: true, data: [] });
        }
      } else {
        // ✅ ✅ ✅ IMPORTANT : tu as dit "je veux juste les tâches assignées à moi"
        // => on garde uniquement assignedTo: userId (AJOUT)
        filters.assignedTo = userId;
      }
    }

    // Role filtering (member)
    if (role !== 'admin' && role !== 'superadmin') {
      filters.$or = [{ assignedTo: userId }, { createdBy: userId }];
    }

    if (q.filterType === 'assignedToMe') {
      filters.assignedTo = userId;
    }

    if (q.filterType === 'createdByMeNotAssignedToMe') {
      filters.createdBy = userId;
      filters.assignedTo = { $ne: userId };
    }

    const tasks = await Task.find(filters)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name color teams team') // ✅ AJOUT (teams/team utile)
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: tasks });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching tasks',
      error: err.message,
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
      .populate('project', 'name color teams team'); // ✅ AJOUT

    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // ✅ ✅ ✅ ADMIN ACCESS BY TEAM (AJOUT)
    if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      const projectTeamIds = [
        ...((task.project?.teams || []).map((t) => t.toString())),
        ...(task.project?.team ? [task.project.team.toString()] : []),
      ];

      const isAssignedToMe = task.assignedTo.some(
        (u) => u.toString() === req.user.id.toString()
      );
      const hasTeamAccess = projectTeamIds.some((id) => userTeamIds.includes(id));

      if (!hasTeamAccess && !isAssignedToMe) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    // Member access
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const isAssigned = task.assignedTo.some((u) => u.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;

      if (!isAssigned && !isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching task',
      error: err.message,
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

    // ✅ ✅ ✅ ADMIN (pas superadmin) -> doit créer seulement dans ses équipes (AJOUT)
    if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      const projectTeams = (project.teams || []).map((t) => t.toString());
      const legacyTeam = project.team ? project.team.toString() : null;

      const allowed =
        projectTeams.some((t) => userTeamIds.includes(t)) ||
        (legacyTeam && userTeamIds.includes(legacyTeam));

      if (!allowed) {
        // ✅ ✅ ✅ ULTIMATE FALLBACK (AJOUT)
        // Vérifie directement si l'admin est membre d'une des équipes du projet (teams ou legacy team)
        const projectTeamIdsForCheck = [...projectTeams, ...(legacyTeam ? [legacyTeam] : [])];

        // si projet n'a aucun team => on bloque (comportement actuel)
        const isMemberOfProjectTeam = projectTeamIdsForCheck.length
          ? await Team.exists({
              _id: { $in: projectTeamIdsForCheck },
              'members.user': req.user.id,
            })
          : false;

        // ✅ ✅ ✅ MINI MODIF : on ne refuse QUE si pas membre (sinon on laisse passer)
        if (!isMemberOfProjectTeam) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to create a task in this project',
          });
        }
      }
    }

    // Member restriction
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const userTeamIds = req.user.teams?.map((t) => t.toString()) || [];
      const projectTeams = project.teams?.map((t) => t.toString()) || [];

      const allowed = projectTeams.some((t) => userTeamIds.includes(t));
      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to create a task in this project',
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
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error creating task',
      error: err.message,
    });
  }
};

// =====================================================
// UPDATE TASK
// =====================================================
exports.updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };

    const task = await Task.findById(req.params.id).populate('project', 'teams team'); // ✅ AJOUT
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // ✅ ✅ ✅ ADMIN (pas superadmin) -> update seulement si team access OU assigné à lui (AJOUT)
    if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      const projectTeamIds = [
        ...((task.project?.teams || []).map((t) => t.toString())),
        ...(task.project?.team ? [task.project.team.toString()] : []),
      ];

      const isAssignedToMe = task.assignedTo.some(
        (u) => u.toString() === req.user.id.toString()
      );
      const hasTeamAccess = projectTeamIds.some((id) => userTeamIds.includes(id));

      if (!hasTeamAccess && !isAssignedToMe) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    // Member restriction
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const isAssigned = task.assignedTo.some((u) => u.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;

      if (!isAssigned && !isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    Object.assign(task, updates);
    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error updating task',
      error: err.message,
    });
  }
};

// =====================================================
// DELETE TASK
// =====================================================
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'teams team'); // ✅ AJOUT
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // ✅ ✅ ✅ ADMIN (pas superadmin) -> delete seulement si team access (AJOUT)
    if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      const projectTeamIds = [
        ...((task.project?.teams || []).map((t) => t.toString())),
        ...(task.project?.team ? [task.project.team.toString()] : []),
      ];
      const hasTeamAccess = projectTeamIds.some((id) => userTeamIds.includes(id));
      if (!hasTeamAccess) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    if (
      req.user.role !== 'admin' &&
      req.user.role !== 'superadmin' &&
      task.createdBy.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await task.deleteOne();

    res.status(200).json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error deleting task',
      error: err.message,
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

    // ✅ ✅ ✅ COMPAT MODEL (AJOUT)
    // Le modèle utilise isCompleted, mais ici on gardait completed
    task.subtasks.push({ title, completed: false, isCompleted: false });

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error adding subtask',
      error: err.message,
    });
  }
};

// =====================================================
// TOGGLE SUBTASK
// =====================================================
exports.toggleSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;

    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

    // ✅ ✅ ✅ COMPAT MODEL (AJOUT)
    // On bascule isCompleted (champ du modèle) + on garde completed si existant
    subtask.isCompleted = !subtask.isCompleted;
    subtask.completed = subtask.isCompleted;

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error toggling subtask',
      error: err.message,
    });
  }
};

// =====================================================
// UPLOAD ATTACHMENT
// =====================================================
exports.uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileData = {
      filename: req.file.filename,
      originalName: req.file.originalname,

      // ✅ ✅ ✅ COMPAT MODEL (AJOUT)
      // Le modèle utilise "mimetype" (pas "mimeType")
      mimetype: req.file.mimetype,
      mimeType: req.file.mimetype,

      size: req.file.size,
      uploadedAt: new Date(),
    };

    task.attachments.push(fileData);
    await task.save();

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: fileData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error uploading attachment',
      error: err.message,
    });
  }
};

// =====================================================
// GET OVERDUE TASKS
// =====================================================
exports.getOverdueTasks = async (req, res) => {
  try {
    const now = new Date();

    const filters = {
      dueDate: { $lt: now },
      status: { $ne: 'completed' },

      // ✅ ✅ ✅ EXCLUDE ARCHIVED (AJOUT)
      archived: { $ne: true },
    };

    // ✅ ✅ ✅ ADMIN SCOPING BY TEAMS (AJOUT)
    if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      const allowedProjects = await Project.find({
        $or: [{ teams: { $in: userTeamIds } }, { team: { $in: userTeamIds } }],
      }).select('_id');

      const allowedProjectIds = allowedProjects.map((p) => p._id);

      // ✅ ✅ ✅ IMPORTANT : uniquement assignées à moi (AJOUT)
      filters.assignedTo = req.user.id;

      // (garde la compat : si tu veux aussi limiter au scope projets, ça ne casse rien)
      filters.project = { $in: allowedProjectIds };
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      filters.assignedTo = req.user.id;
    }

    const tasks = await Task.find(filters)
      .populate('assignedTo', 'firstName lastName email')
      .populate('project', 'name');

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error fetching overdue tasks',
      error: err.message,
    });
  }
};

// =====================================================
// ✅ ARCHIVE TASK (AJOUT)
// =====================================================
exports.archiveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'teams team'); // ✅ AJOUT
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // ✅ ✅ ✅ ADMIN (pas superadmin) -> peut archiver seulement si team access OU assigné à lui (AJOUT)
    if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      const projectTeamIds = [
        ...((task.project?.teams || []).map((t) => t.toString())),
        ...(task.project?.team ? [task.project.team.toString()] : []),
      ];

      const isAssignedToMe = task.assignedTo.some(
        (u) => u.toString() === req.user.id.toString()
      );
      const hasTeamAccess = projectTeamIds.some((id) => userTeamIds.includes(id));

      if (!hasTeamAccess && !isAssignedToMe) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    // Member restriction
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const isAssigned = task.assignedTo.some((u) => u.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;

      if (!isAssigned && !isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    task.archived = true;
    await task.save();

    res.status(200).json({ success: true, message: 'Task archived', data: task });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error archiving task',
      error: err.message,
    });
  }
};

// =====================================================
// ✅ UNARCHIVE TASK (AJOUT)
// =====================================================
exports.unarchiveTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'teams team'); // ✅ AJOUT
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    // ✅ ✅ ✅ ADMIN (pas superadmin) -> peut restaurer seulement si team access OU assigné à lui (AJOUT)
    if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
      let userTeamIds = (req.user.teams || []).map((t) => t.toString());

      // ✅ ✅ ✅ FALLBACK si User.teams pas à jour (AJOUT)
      if (!userTeamIds || userTeamIds.length === 0) {
        const teams = await Team.find({ 'members.user': req.user.id }).select('_id');
        userTeamIds = teams.map((t) => t._id.toString());
      }

      const projectTeamIds = [
        ...((task.project?.teams || []).map((t) => t.toString())),
        ...(task.project?.team ? [task.project.team.toString()] : []),
      ];

      const isAssignedToMe = task.assignedTo.some(
        (u) => u.toString() === req.user.id.toString()
      );
      const hasTeamAccess = projectTeamIds.some((id) => userTeamIds.includes(id));

      if (!hasTeamAccess && !isAssignedToMe) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    // Member restriction
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const isAssigned = task.assignedTo.some((u) => u.toString() === req.user.id);
      const isCreator = task.createdBy.toString() === req.user.id;

      if (!isAssigned && !isCreator) {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    task.archived = false;
    await task.save();

    res.status(200).json({ success: true, message: 'Task restored', data: task });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error restoring task',
      error: err.message,
    });
  }
};

// =====================================================
// ✅ IMPORT TASKS FROM FILE (CSV/XLSX) (AJOUT)
// =====================================================
exports.importTasksFromFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const originalName = req.file.originalname || '';
    const lower = originalName.toLowerCase();
    const filePath = req.file.path;

    const normalizeKey = (s) =>
      String(s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\s+/g, '');

    const toISODate = (val) => {
      if (!val) return '';
      if (val instanceof Date && !isNaN(val)) return val.toISOString();
      const d = new Date(val);
      if (!isNaN(d)) return d.toISOString();
      return '';
    };

    let rows = [];

    if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      const wb = XLSX.readFile(filePath);
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    } else if (lower.endsWith('.csv')) {
      const content = fs.readFileSync(filePath, 'utf8');
      rows = parseCSVFallback(content); // ✅ ✅ ✅ FALLBACK sans dépendance
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported file type. Please upload a .csv or .xlsx file',
      });
    }

    // Nettoyage fichier temporaire (si besoin)
    try {
      fs.unlinkSync(filePath);
    } catch {}

    // Mapping des colonnes (FR/EN)
    const mapRow = (r) => {
      const obj = {};
      for (const k of Object.keys(r)) {
        obj[normalizeKey(k)] = r[k];
      }

      return {
        title: obj.title || obj.titre || '',
        description: obj.description || obj.desc || '',
        projectId:
          obj.projectid ||
          obj.projetid ||
          obj.projet ||
          obj.project ||
          obj.nomdeprojet ||
          obj.projectname ||
          '',
        assignedToRaw: obj.assignedto || obj.assigne || obj.assignea || obj.assignera || '',
        priority: obj.priority || obj.priorite || 'medium',
        status: obj.status || obj.statut || 'not_started',
        estimatedHours: obj.estimatedhours || obj.estimationheures || obj.estimation || 0,
        startDate: obj.startdate || obj.datededebut || obj.debut || '',
        dueDate: obj.duedate || obj.datedecheance || obj.echeance || '',
        tagsRaw: obj.tags || obj.tag || '',
      };
    };

    const created = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const raw = mapRow(rows[i]);
      const rowNumber = i + 2; // +2 car ligne 1 = header

      if (!raw.title || !raw.projectId) {
        errors.push({
          row: rowNumber,
          message: 'title/titre et projectId/projet (ou nom de projet) sont obligatoires',
        });
        continue;
      }

      // ✅ ✅ ✅ Projet : accepte ID Mongo OU nom du projet (fallback)
      let project = null;
      if (mongoose.Types.ObjectId.isValid(String(raw.projectId))) {
        project = await Project.findById(raw.projectId);
      } else {
        project = await Project.findOne({ name: String(raw.projectId).trim() });
      }

      if (!project) {
        errors.push({ row: rowNumber, message: `Projet introuvable: ${raw.projectId}` });
        continue;
      }

      // assignedTo (IDs ou emails séparés par virgules)
      let assignedTo = [];
      if (raw.assignedToRaw) {
        const tokens = String(raw.assignedToRaw)
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        for (const t of tokens) {
          if (t.includes('@')) {
            const u = await User.findOne({ email: t }).select('_id');
            if (u?._id) assignedTo.push(u._id);
          } else {
            // ✅ ✅ ✅ si c'est un id mongo valide on le garde, sinon on ignore silencieusement
            if (mongoose.Types.ObjectId.isValid(String(t))) assignedTo.push(t);
          }
        }
      }

      // tags
      const tags = raw.tagsRaw
        ? String(raw.tagsRaw)
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean)
        : [];

      const taskDoc = await Task.create({
        title: raw.title,
        description: raw.description,
        project: project._id, // ✅ ✅ ✅ important : stocker l'id du projet
        assignedTo,
        priority: raw.priority || 'medium',
        status: raw.status || 'not_started',
        estimatedHours: Number(raw.estimatedHours || 0),
        startDate: raw.startDate ? toISODate(raw.startDate) : undefined,
        dueDate: raw.dueDate ? toISODate(raw.dueDate) : undefined,
        tags,
        createdBy: req.user.id,
      });

      created.push(taskDoc);
    }

    return res.status(200).json({
      success: true,
      createdCount: created.length,
      errorCount: errors.length,
      errors,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Error importing tasks',
      error: err.message,
    });
  }
};
