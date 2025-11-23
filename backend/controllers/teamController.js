const Team = require("../models/Team");
const User = require("../models/User");

// ----------------------
// GET /api/teams
// ----------------------
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("members.user", "firstName lastName email");

    // S'assurer que tous les champs optionnels existent
    const teamsWithSafeData = teams.map(team => {
      const teamObj = team.toObject();
      return {
        ...teamObj,
        members: teamObj.members || [],
        projects: [] // Le modèle Team n'a pas de champ projects, mais on le garde pour compatibilité
      };
    });

    res.status(200).json({ success: true, data: teamsWithSafeData });
  } catch (error) {
    console.error("Erreur lors du chargement des équipes:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ----------------------
// GET /api/teams/:id
// ----------------------
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "firstName lastName email");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Équipe non trouvée",
      });
    }

    const teamObj = team.toObject();
    res.status(200).json({ 
      success: true, 
      data: {
        ...teamObj,
        members: teamObj.members || [],
        projects: []
      }
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'équipe:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ----------------------
// POST /api/teams (Admin only)
// ----------------------
exports.createTeam = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Seul un administrateur peut créer une équipe",
      });
    }

    const { name, description, color } = req.body;

    const team = await Team.create({
      name,
      description,
      color,
      createdBy: req.user.id,
      members: [{ user: req.user.id, role: "admin" }],
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error("Erreur lors de la création de l'équipe:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ----------------------
// PUT /api/teams/:id
// ----------------------
exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Équipe non trouvée",
      });
    }

    const isTeamAdmin = team.isTeamAdmin(req.user.id);
    const isGlobalAdmin = req.user.role === "admin";

    if (!isTeamAdmin && !isGlobalAdmin) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas les droits pour modifier cette équipe",
      });
    }

    team.name = req.body.name ?? team.name;
    team.description = req.body.description ?? team.description;
    team.color = req.body.color ?? team.color;

    await team.save();

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'équipe:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ----------------------
// POST /api/teams/:id/members
// ----------------------
exports.addMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Équipe non trouvée",
      });
    }

    const isTeamAdmin = team.isTeamAdmin(req.user.id);
    const isGlobalAdmin = req.user.role === "admin";

    if (!isTeamAdmin && !isGlobalAdmin) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas les droits pour ajouter un membre",
      });
    }

    const { userId } = req.body;

    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });
    }

    const already = team.members.some((m) => {
      if (!m.user) return false;
      return m.user.toString() === userId.toString();
    });
    
    if (already) {
      return res.status(400).json({
        success: false,
        message: "Cet utilisateur est déjà membre de cette équipe",
      });
    }

    team.members.push({ user: userId, role: "member" });
    await team.save();

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    console.error("Erreur lors de l'ajout du membre:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ----------------------
// DELETE /api/teams/:teamId/members/:userId
// ----------------------
exports.removeMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Équipe non trouvée",
      });
    }

    const isTeamAdmin = team.isTeamAdmin(req.user.id);
    const isGlobalAdmin = req.user.role === "admin";

    if (!isTeamAdmin && !isGlobalAdmin) {
      return res.status(403).json({
        success: false,
        message: "Vous n'avez pas les droits pour retirer un membre",
      });
    }

    team.members = team.members.filter(
      (m) => {
        if (!m.user) return true;
        return m.user.toString() !== userId.toString();
      }
    );

    await team.save();

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    console.error("Erreur lors du retrait du membre:", error);
    res.status(500).json({ 
      success: false, 
      message: "Erreur serveur",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
