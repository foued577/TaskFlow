const Task = require("../models/Task");
const Project = require("../models/Project");
const Team = require("../models/Team");

// -----------------------------------------------------
// GET /api/tasks — Admin = toutes les tâches
// Membre = uniquement tâches de ses équipes
// -----------------------------------------------------
exports.getTasks = async (req, res) => {
  try {
    let tasks;

    if (req.user.role === "admin") {
      // Admin : toutes les tâches
      tasks = await Task.find()
        .populate("project", "name color team")
        .populate("assignedTo", "firstName lastName email");
    } else {
      // Membre : uniquement tâches des projets d'équipes dont il fait partie
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
// GET /api/tasks/:id
// -----------------------------------------------------
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("project", "name color team")
      .populate("assignedTo", "firstName lastName email");

    if (!task)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    // Vérifier si user a accès au projet
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

    const { title, description, status, priority, project, assignedTo, dueDate } =
      req.body;

    const task = await Task.create({
      title,
      description,
      status,
      priority,
      project,
      assignedTo,
      dueDate,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// -----------------------------------------------------
// PUT /api/tasks/:id — Admin ou membre du projet assigné
// -----------------------------------------------------
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task)
      return res.status(404).json({ success: false, message: "Tâche introuvable" });

    // Vérifier autorisations
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
// DELETE /api/tasks/:id — Admin seulement
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
