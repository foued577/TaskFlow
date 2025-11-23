const Team = require("../models/Team");
const User = require("../models/User");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// -----------------------------------------------------------
// GET /api/teams - Récupérer toutes les équipes
// -----------------------------------------------------------
exports.getTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find()
    .populate("members.user", "firstName lastName email")
    .populate("projects", "name color");

  res.status(200).json({ success: true, data: teams });
});

// -----------------------------------------------------------
// GET /api/teams/:id - Une équipe
// -----------------------------------------------------------
exports.getTeam = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id)
    .populate("members.user", "firstName lastName email")
    .populate("projects", "name color");

  if (!team) return next(new ErrorResponse("Équipe non trouvée", 404));

  res.status(200).json({ success: true, data: team });
});

// -----------------------------------------------------------
// POST /api/teams - Créer une équipe (ADMIN ONLY)
// -----------------------------------------------------------
exports.createTeam = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(
      new ErrorResponse("Seul un administrateur peut créer une équipe", 403)
    );
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
});

// -----------------------------------------------------------
// PUT /api/teams/:id - Modifier une équipe (Admin global ou Admin d'équipe)
// -----------------------------------------------------------
exports.updateTeam = asyncHandler(async (req, res, next) => {
  let team = await Team.findById(req.params.id);

  if (!team) return next(new ErrorResponse("Équipe non trouvée", 404));

  const isTeamAdmin = team.isTeamAdmin(req.user.id);
  const isGlobalAdmin = req.user.role === "admin";

  if (!isTeamAdmin && !isGlobalAdmin) {
    return next(
      new ErrorResponse("Vous n’avez pas les droits pour modifier cette équipe", 403)
    );
  }

  const fieldsToUpdate = {
    name: req.body.name,
    description: req.body.description,
    color: req.body.color,
  };

  team = await Team.findByIdAndUpdate(req.params.id, fieldsToUpdate, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: team });
});

// -----------------------------------------------------------
// POST /api/teams/:id/members - Ajouter un membre
// -----------------------------------------------------------
exports.addMember = asyncHandler(async (req, res, next) => {
  const team = await Team.findById(req.params.id);

  if (!team) return next(new ErrorResponse("Équipe non trouvée", 404));

  const isTeamAdmin = team.isTeamAdmin(req.user.id);
  const isGlobalAdmin = req.user.role === "admin";

  if (!isTeamAdmin && !isGlobalAdmin) {
    return next(
      new ErrorResponse("Vous n’avez pas les droits pour ajouter un membre", 403)
    );
  }

  const { userId } = req.body;

  const userExists = await User.findById(userId);
  if (!userExists) return next(new ErrorResponse("Utilisateur introuvable", 404));

  const alreadyMember = team.members.some((m) => m.user.toString() === userId);
  if (alreadyMember)
    return next(
      new ErrorResponse("Cet utilisateur est déjà membre de l'équipe", 400)
    );

  team.members.push({
    user: userId,
    role: "member",
  });

  await team.save();

  res.status(200).json({ success: true, data: team });
});

// -----------------------------------------------------------
// DELETE /api/teams/:teamId/members/:userId - Retirer un membre
// -----------------------------------------------------------
exports.removeMember = asyncHandler(async (req, res, next) => {
  const { teamId, userId } = req.params;

  const team = await Team.findById(teamId);
  if (!team) return next(new ErrorResponse("Équipe non trouvée", 404));

  const isTeamAdmin = team.isTeamAdmin(req.user.id);
  const isGlobalAdmin = req.user.role === "admin";

  if (!isTeamAdmin && !isGlobalAdmin) {
    return next(
      new ErrorResponse("Vous n’avez pas les droits pour retirer un membre", 403)
    );
  }

  team.members = team.members.filter(
    (m) => m.user.toString() !== userId.toString()
  );

  await team.save();

  res.status(200).json({ success: true, data: team });
});
