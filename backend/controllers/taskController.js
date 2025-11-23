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
        .populate("project", "name color team")
        .populate("assignedTo", "firstName lastName email");
    } else {
      const teams = await Team.find({ "members.user": req.user.id }).select("_id");

      const projects = await Project.find({ team: { $in: teams } }).select("_id");

      tasks = await Task.find({ project: { $in: projects } })
        .populate("project", "name color team")
        .populate("assignedTo", "firstName lastName email");
    }

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
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
      .populate("project", "name color team")
      .populate("assignedTo", "firstName lastName email");

    res.status(200).json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// -----------------------------------------------------
// GET /api/tasks/:id
// -----------------------------------------------------
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name color team")
      .populate("assignedTo", "firstName lastName email");

    if (!task)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    if (req.user.role !== "admin") {
      const project = await Project.findById(task.project);
      const team = await Team.findById(project.team);

      const isMember = team.members.some(m => m.user.toString() === req.user.id);

      if (!isMember)
        return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
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

    const task = await Task.create({
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      project: req.body.project,
      assignedTo: req.body.assignedTo,
      dueDate: req.body.dueDate,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
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
      const team = await Team.findById(project.team);

      const isMember = team.members.some(m => m.user.toString() === req.user.id);

      if (!isMember)
        return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
        assignedTo: req.body.assignedTo,
        dueDate: req.body.dueDate,
      },
      { new: true }
    );

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
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
    res.status(500).json({ success: false, message: "Erreur serveur" });
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
      completed: false,
    });

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
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

    subtask.completed = !subtask.completed;

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
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
      url: `/uploads/${req.file.filename}`,
    });

    await task.save();

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
