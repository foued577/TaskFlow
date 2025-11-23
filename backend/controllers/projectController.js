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
        .populate("teams", "name color")
        .populate("tasks");
    } else {
      // Membre : voit seulement les projets de ses équipes
      const teams = await Team.find({ "members.user": req.user.id }).select("_id");
      const teamIds = teams.map(t => t._id);

      projects = await Project.find({
        $or: [
          { team: { $in: teamIds } },
          { teams: { $in: teamIds } }
        ]
      })
        .populate("team", "name color")
        .populate("teams", "name color")
        .populate("tasks");
    }

    // S'assurer que les champs optionnels existent
    const safeProjects = projects.map(project => {
      const projectObj = project.toObject();
      return {
        ...projectObj,
        team: projectObj.team || null,
        teams: projectObj.teams || [],
        tasks: projectObj.tasks || []
      };
    });

    res.status(200).json({ success: true, data: safeProjects });
  } catch (error) {
    console.error("Erreur lors du chargement des projets:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ------------------------
// GET /api/projects/:id
// ------------------------
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("team", "name color")
      .populate("teams", "name color")
      .populate("tasks");

    if (!project)
      return res.status(404).json({ success: false, message: "Projet introuvable" });

    // Vérifier si user appartient à l'équipe du projet
    if (req.user.role !== "admin") {
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

    const projectObj = project.toObject();
    res.status(200).json({ 
      success: true, 
      data: {
        ...projectObj,
        team: projectObj.team || null,
        teams: projectObj.teams || []
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du projet:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    const { name, description, color, team, teamIds, startDate, endDate, priority, tags } = req.body;

    // Gérer team (ancien) ou teamIds (nouveau)
    const projectData = {
      name,
      description,
      color: color || '#10B981',
      createdBy: req.user.id,
      startDate: startDate || null,
      endDate: endDate || null,
      priority: priority || 'medium',
      tags: tags || []
    };

    // Si teamIds est fourni, utiliser teams (nouveau format)
    if (teamIds && Array.isArray(teamIds) && teamIds.length > 0) {
      projectData.teams = teamIds;
    } else if (team) {
      // Sinon, utiliser team (ancien format)
      projectData.team = team;
    }

    const project = await Project.create(projectData);

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    console.error("Erreur lors de la création du projet:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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

    const { name, description, color, team, teamIds, startDate, endDate, priority, tags } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (color !== undefined) updateData.color = color;
    if (startDate !== undefined) updateData.startDate = startDate || null;
    if (endDate !== undefined) updateData.endDate = endDate || null;
    if (priority !== undefined) updateData.priority = priority;
    if (tags !== undefined) updateData.tags = tags;

    // Gérer team (ancien) ou teamIds (nouveau)
    if (teamIds && Array.isArray(teamIds) && teamIds.length > 0) {
      updateData.teams = teamIds;
      updateData.team = null; // Optionnel : vider l'ancien champ
    } else if (team) {
      updateData.team = team;
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!project)
      return res.status(404).json({ success: false, message: "Projet introuvable" });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
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
    console.error("Erreur lors de la suppression du projet:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
