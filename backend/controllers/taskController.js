const Task = require("../models/Task");
const Project = require("../models/Project");
const Team = require("../models/Team");
const path = require("path");
const fs = require("fs");

// -----------------------------------------------------
// GET /api/tasks — Admin = toutes les tâches
// Membre = uniquement tâches de ses équipes
// -----------------------------------------------------
exports.getTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === "admin") {
      tasks = await Task.find()
        .populate("project", "name color team teams")
        .populate("assignedTo", "firstName lastName email");
    } else {
      const teams = await Team.find({ "members.user": req.user.id }).select("_id");
      const teamIds = teams.map(t => t._id);

      // Gérer les projets avec team (ancien) ou teams (nouveau)
      const projects = await Project.find({
        $or: [
          { team: { $in: teamIds } },
          { teams: { $in: teamIds } }
        ]
      }).select("_id");

      const projectIds = projects.map(p => p._id);

      tasks = await Task.find({ project: { $in: projectIds } })
        .populate("project", "name color team teams")
        .populate("assignedTo", "firstName lastName email");
    }

    // S'assurer que assignedTo est toujours un tableau
    const safeTasks = tasks.map(task => {
      const taskObj = task.toObject();
      return {
        ...taskObj,
        assignedTo: taskObj.assignedTo || [],
        subtasks: taskObj.subtasks || []
      };
    });

    res.status(200).json({ success: true, data: safeTasks });
  } catch (error) {
    console.error("Erreur lors du chargement des tâches:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------
// GET /api/tasks/overdue - Tâches en retard
// -----------------------------------------------------
exports.getOverdueTasks = async (req, res) => {
  try {
    const now = new Date();

    const tasks = await Task.find({
      dueDate: { $lt: now },
      status: { $ne: "completed" }
    })
      .populate("project", "name color team teams")
      .populate("assignedTo", "firstName lastName email");

    // S'assurer que assignedTo est toujours un tableau
    const safeTasks = tasks.map(task => {
      const taskObj = task.toObject();
      return {
        ...taskObj,
        assignedTo: taskObj.assignedTo || []
      };
    });

    res.status(200).json({ 
      success: true, 
      count: safeTasks.length,
      data: safeTasks 
    });
  } catch (error) {
    console.error("Erreur lors du chargement des tâches en retard:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------
// GET /api/tasks/:id
// -----------------------------------------------------
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name color team teams")
      .populate("assignedTo", "firstName lastName email");

    if (!task)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    if (req.user.role !== "admin") {
      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(403).json({ success: false, message: "Accès refusé" });
      }

      // Gérer team (ancien) ou teams (nouveau)
      const projectTeam = project.team || (project.teams && project.teams[0]);
      if (!projectTeam) {
        return res.status(403).json({ success: false, message: "Accès refusé" });
      }

      const teamId = projectTeam._id || projectTeam;
      const team = await Team.findById(teamId);
      if (!team || !team.members) {
        return res.status(403).json({ success: false, message: "Accès refusé" });
      }

      const isMember = team.members.some(m => 
        m.user && m.user.toString() === req.user.id
      );

      if (!isMember)
        return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const taskObj = task.toObject();
    res.status(200).json({ 
      success: true, 
      data: {
        ...taskObj,
        assignedTo: taskObj.assignedTo || [],
        subtasks: taskObj.subtasks || []
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la tâche:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------
// POST /api/tasks — Admin seulement
// -----------------------------------------------------
exports.createTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Seul un administrateur peut créer une tâche",
      });
    }

    // S'assurer que assignedTo est un tableau
    const assignedTo = Array.isArray(req.body.assignedTo) 
      ? req.body.assignedTo 
      : (req.body.assignedTo ? [req.body.assignedTo] : []);

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description || '',
      status: req.body.status || 'not_started',
      priority: req.body.priority || 'medium',
      project: req.body.project,
      assignedTo: assignedTo,
      dueDate: req.body.dueDate || null,
      startDate: req.body.startDate || null,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error("Erreur lors de la création de la tâche:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------
// PUT /api/tasks/:id
// -----------------------------------------------------
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    if (req.user.role !== "admin") {
      const project = await Project.findById(task.project);
      if (!project) {
        return res.status(403).json({ success: false, message: "Accès refusé" });
      }

      // Gérer team (ancien) ou teams (nouveau)
      const projectTeam = project.team || (project.teams && project.teams[0]);
      if (!projectTeam) {
        return res.status(403).json({ success: false, message: "Accès refusé" });
      }

      const teamId = projectTeam._id || projectTeam;
      const team = await Team.findById(teamId);
      if (!team || !team.members) {
        return res.status(403).json({ success: false, message: "Accès refusé" });
      }

      const isMember = team.members.some(m => 
        m.user && m.user.toString() === req.user.id
      );

      if (!isMember)
        return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    // S'assurer que assignedTo est un tableau
    const assignedTo = req.body.assignedTo !== undefined
      ? (Array.isArray(req.body.assignedTo) 
          ? req.body.assignedTo 
          : (req.body.assignedTo ? [req.body.assignedTo] : []))
      : undefined;

    const updateData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.status !== undefined) updateData.status = req.body.status;
    if (req.body.priority !== undefined) updateData.priority = req.body.priority;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (req.body.dueDate !== undefined) updateData.dueDate = req.body.dueDate || null;
    if (req.body.startDate !== undefined) updateData.startDate = req.body.startDate || null;

    // Si la tâche est complétée, ajouter la date de complétion
    if (req.body.status === 'completed' && task.status !== 'completed') {
      updateData.completedAt = new Date();
    } else if (req.body.status !== 'completed' && task.status === 'completed') {
      updateData.completedAt = null;
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la tâche:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------
// DELETE /api/tasks/:id — Admin
// -----------------------------------------------------
exports.deleteTask = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Seul un administrateur peut supprimer une tâche",
      });
    }

    const deleted = await Task.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    res.status(200).json({ success: true, message: "Tâche supprimée" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la tâche:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------
// POST /api/tasks/:id/subtasks
// -----------------------------------------------------
exports.addSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    task.subtasks.push({
      title: req.body.title,
      isCompleted: false,
    });

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Erreur lors de l'ajout de la sous-tâche:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------
// PUT /api/tasks/:id/subtasks/:subtaskId
// -----------------------------------------------------
exports.toggleSubtask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    const subtask = task.subtasks.id(req.params.subtaskId);
    if (!subtask)
      return res.status(404).json({ success: false, message: "Sous-tâche introuvable" });

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
    console.error("Erreur lors de la modification de la sous-tâche:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// -----------------------------------------------------
// POST /api/tasks/:id/attachments
// -----------------------------------------------------
exports.uploadAttachment = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Aucun fichier envoyé" });
    }

    task.attachments.push({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    });

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    console.error("Erreur lors de l'upload du fichier:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
