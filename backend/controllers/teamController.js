const Team = require("../models/Team");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

/**
 * NOTE IMPORTANTE
 * ----------------
 * asyncHandler a été supprimé car il n'existe pas dans ton projet.
 * Toutes les fonctions ont été converties en try/catch classiques.
 */

// -----------------------------------------------------------
// GET /api/teams - Récupérer toutes les équipes
// -----------------------------------------------------------
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate("members.user", "firstName lastName email")
      .populate("projects", "name color");

    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// -----------------------------------------------------------
// GET /api/teams/:id - Une équipe
// -----------------------------------------------------------
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "firstName lastName email")
      .populate("projects", "name color");

    if (!team) {
      return res.status(404).json({
        success: false,
        message: "Équipe non trouvée",
      });
    }

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// -----------------------------------------------------------
// POST /api/teams - Créer une équipe (ADMIN ONLY)
// -----------------------------------------------------------
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
      members: [
        {
          user: req.user.id,
          role: "admin",
        },
      ],
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// -----------------------------------------------------------
// PUT /api/teams/:id - Modifier une équipe
// -----------------------------------------------------------
exports.updateTeam = async (req, res) => {
  try {
    let team = await Team.findById(req.params.id);
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Équipe non trouvée" });

    const isTeamAdmin = team.isTeamAdmin(req.user.id);
    const isGlobalAdmin = req.user.role === "admin";

    if (!isTeamAdmin && !isGlobalAdmin) {
      return res.status(403).json({
        success: false,
        message: "Vous n’avez pas les droits pour modifier cette équipe",
      });
    }

    const updates = {
      name: req.body.name,
      description: req.body.description,
      color: req.body.color,
    };

    team = await Team.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// -----------------------------------------------------------
// POST /api/teams/:id/members - Ajouter un membre
// -----------------------------------------------------------
exports.addMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Équipe non trouvée" });

    const isTeamAdmin = team.isTeamAdmin(req.user.id);
    const isGlobalAdmin = req.user.role === "admin";

    if (!isTeamAdmin && !isGlobalAdmin) {
      return res.status(403).json({
        success: false,
        message: "Vous n’avez pas les droits pour ajouter un membre",
      });
    }

    const { userId } = req.body;
    const userExists = await User.findById(userId);

    if (!userExists)
      return res.status(404).json({
        success: false,
        message: "Utilisateur introuvable",
      });

    const alreadyMember = team.members.some(
      (m) => m.user.toString() === userId
    );

    if (alreadyMember)
      return res.status(400).json({
        success: false,
        message: "Cet utilisateur est déjà membre de l'équipe",
      });

    team.members.push({
      user: userId,
      role: "member",
    });

    await team.save();

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};

// -----------------------------------------------------------
// DELETE /api/teams/:teamId/members/:userId - Retirer un membre
// -----------------------------------------------------------
exports.removeMember = async (req, res) => {
  try {
    const { teamId, userId } = req.params;

    const team = await Team.findById(teamId);
    if (!team)
      return res
        .status(404)
        .json({ success: false, message: "Équipe non trouvée" });

    const isTeamAdmin = team.isTeamAdmin(req.user.id);
    const isGlobalAdmin = req.user.role === "admin";

    if (!isTeamAdmin && !isGlobalAdmin) {
      return res.status(403).json({
        success: false,
        message: "Vous n’avez pas les droits pour retirer un membre",
      });
    }

    team.members = team.members.filter(
      (m) => m.user.toString() !== userId.toString()
    );

    await team.save();

    res.status(200).json({ success: true, data: team });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erreur serveur" });
  }
};
