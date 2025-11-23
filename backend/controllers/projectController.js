const Project = require("../models/Project");
const Team = require("../models/Team");

// ------------------------
// GET /api/projects
// ------------------------
exports.getProjects = async (req, res) => {
  try {
    let projects;

    // Admin : voit tout
    if (req.user.role === "admin") {
      projects = await Project.find()
        .populate("team", "name color")
        .populate("tasks");
    } else {
      // Membre : voit seulement les projets de ses équipes
      const teams = await Team.find({ "members.user": req.user.id }).select("_id");

      projects = await Project.find({ team: { $in: teams } })
        .populate("team", "name color")
        .populate("tasks");
    }

    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ------------------------
// GET /api/projects/:id
// ------------------------
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("team", "name color")
      .populate("tasks");

    if (!project)
      return res.status(404).json({ success: false, message: "Projet introuvable" });

    // Vérifier si user appartient à l'équipe du projet
    if (req.user.role !== "admin") {
      const team = await Team.findById(project.team);
      const isMember = team.members.some(m => m.user.toString() === req.user.id);

      if (!isMember)
        return res.status(403).json({ success: false, message: "Accès refusé" });
    }

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ------------------------
// POST /api/projects  (Admin seulement)
// ------------------------
exports.createProject = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Seul un administrateur peut créer un projet",
      });
    }

    const { name, description, color, team } = req.body;

    const project = await Project.create({
      name,
      description,
      color,
      team,
      createdBy: req.user.id,
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ------------------------
// PUT /api/projects/:id  (Admin seulement)
// ------------------------
exports.updateProject = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Seul un administrateur peut modifier un projet",
      });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      {
        name: req.body.name,
        description: req.body.description,
        color: req.body.color,
        team: req.body.team,
      },
      { new: true }
    );

    if (!project)
      return res.status(404).json({ success: false, message: "Projet introuvable" });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// ------------------------
// DELETE /api/projects/:id  (Admin seulement)
// ------------------------
exports.deleteProject = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Seul un administrateur peut supprimer un projet",
      });
    }

    const deleted = await Project.findByIdAndDelete(req.params.id);

    if (!deleted)
      return res.status(404).json({ success: false, message: "Projet introuvable" });

    res.status(200).json({ success: true, message: "Projet supprimé" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
