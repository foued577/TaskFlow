const Team = require("../models/Team");
const User = require("../models/User");
// ---------------------------------------------------------------
// Helper : vérifier si l'utilisateur est admin global OU admin d'équipe
// ---------------------------------------------------------------
const isTeamAdmin = (team, userId, userRole) => {
 if (userRole === "admin") return true; // Admin global = accès total
 const member = team.members.find(
   (m) => m.user.toString() === userId.toString()
 );
 // Ancienne structure : aucun rôle = considéré "admin"
 return member && (member.role === "admin" || !member.role);
};
// ---------------------------------------------------------------
// @desc    Récupérer toutes les équipes
// @route   GET /api/teams
// @access  Private
// ---------------------------------------------------------------
exports.getTeams = async (req, res) => {
 try {
   let teams;
   if (req.user.role === "admin") {
     // Admin → voit TOUTES les équipes
     teams = await Team.find()
       .populate("members.user", "firstName lastName email avatar role")
       .populate("createdBy", "firstName lastName");
   } else {
     // Membre → voit SEULEMENT ses équipes !
     teams = await Team.find({ "members.user": req.user.id })
       .populate("members.user", "firstName lastName email avatar role")
       .populate("createdBy", "firstName lastName");
   }
   res.status(200).json({ success: true, data: teams });
 } catch (error) {
   console.error("Get teams error:", error);
   res.status(500).json({ success: false, message: "Error loading teams" });
 }
};
// ---------------------------------------------------------------
// @desc    Récupérer UNE équipe
// @route   GET /api/teams/:id
// @access  Private
// ---------------------------------------------------------------
exports.getTeam = async (req, res) => {
 try {
   const team = await Team.findById(req.params.id)
     .populate("members.user", "firstName lastName email avatar role")
     .populate("createdBy", "firstName lastName");
   if (!team) {
     return res.status(404).json({ success: false, message: "Team not found" });
   }
   res.status(200).json({ success: true, data: team });
 } catch (error) {
   console.error("Get team error:", error);
   res.status(500).json({ success: false, message: "Error loading team" });
 }
};
// ---------------------------------------------------------------
// @desc    Créer une équipe
// @route   POST /api/teams
// @access  Admin Only
// ---------------------------------------------------------------
exports.createTeam = async (req, res) => {
 try {
   if (req.user.role !== "admin") {
     return res.status(403).json({
       success: false,
       message: "Only admins can create teams",
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
   console.error("Create team error:", error);
   res.status(500).json({
     success: false,
     message: "Error creating team",
   });
 }
};
// ---------------------------------------------------------------
// @desc    Modifier une équipe
// @route   PUT /api/teams/:id
// @access  Team Admin OR Global Admin
// ---------------------------------------------------------------
exports.updateTeam = async (req, res) => {
 try {
   const team = await Team.findById(req.params.id);
   if (!team) {
     return res.status(404).json({ success: false, message: "Team not found" });
   }
   if (!isTeamAdmin(team, req.user.id, req.user.role)) {
     return res.status(403).json({
       success: false,
       message: "You are not allowed to modify this team",
     });
   }
   const { name, description, color } = req.body;
   team.name = name ?? team.name;
   team.description = description ?? team.description;
   team.color = color ?? team.color;
   await team.save();
   res.status(200).json({ success: true, data: team });
 } catch (error) {
   console.error("Update team error:", error);
   res.status(500).json({ success: false, message: "Error updating team" });
 }
};
// ---------------------------------------------------------------
// @desc    Ajouter un membre à une équipe
// @route   POST /api/teams/:id/members
// @access  Team Admin OR Global Admin
// ---------------------------------------------------------------
exports.addMember = async (req, res) => {
 try {
   const { userId } = req.body;
   const team = await Team.findById(req.params.id).populate("members.user");
   if (!team)
     return res.status(404).json({ success: false, message: "Team not found" });
   if (!isTeamAdmin(team, req.user.id, req.user.role)) {
     return res.status(403).json({ success: false, message: "Not allowed" });
   }
   const alreadyMember = team.members.find(
     (m) => m.user._id.toString() === userId
   );
   if (alreadyMember) {
     return res
       .status(400)
       .json({ success: false, message: "User already in team" });
   }
   team.members.push({ user: userId });
   await team.save();
   res.status(200).json({
     success: true,
     message: "Member added",
     data: team,
   });
 } catch (error) {
   console.error("Add member error:", error);
   res.status(500).json({ success: false, message: "Error adding member" });
 }
};
// ---------------------------------------------------------------
// @desc    Retirer un membre d'une équipe
// @route   DELETE /api/teams/:id/members/:userId
// @access  Team Admin OR Global Admin
// ---------------------------------------------------------------
exports.removeMember = async (req, res) => {
 try {
   const { id, userId } = req.params;
   const team = await Team.findById(id).populate("members.user");
   if (!team)
     return res.status(404).json({ success: false, message: "Team not found" });
   if (!isTeamAdmin(team, req.user.id, req.user.role)) {
     return res.status(403).json({ success: false, message: "Not allowed" });
   }
   team.members = team.members.filter(
     (m) => m.user._id.toString() !== userId
   );
   await team.save();
   res.status(200).json({
     success: true,
     message: "Member removed",
     data: team,
   });
 } catch (error) {
   console.error("Remove member error:", error);
   res.status(500).json({ success: false, message: "Error removing member" });
 }
};
// ---------------------------------------------------------------
// @desc    Supprimer une équipe
// @route   DELETE /api/teams/:id
// @access  Team Admin OR Global Admin
// ---------------------------------------------------------------
exports.deleteTeam = async (req, res) => {
 try {
   const { id } = req.params;
   const team = await Team.findById(id);
   if (!team) {
     return res.status(404).json({ success: false, message: "Team not found" });
   }
   // Seul un admin global OU le créateur de l’équipe peut supprimer
   const isCreator = team.createdBy.toString() === req.user.id.toString();
   const isGlobalAdmin = req.user.role === "admin";
   if (!isCreator && !isGlobalAdmin) {
     return res.status(403).json({
       success: false,
       message: "Not allowed to delete this team",
     });
   }
   await Team.findByIdAndDelete(id);
   res.status(200).json({
     success: true,
     message: "Team deleted successfully",
   });
 } catch (error) {
   console.error("Delete team error:", error);
   res.status(500).json({ success: false, message: "Error deleting team" });
 }
};
