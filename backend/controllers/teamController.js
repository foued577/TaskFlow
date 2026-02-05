const Team = require("../models/Team");
const User = require("../models/User");

/* ---------------------------------------------------------------
Helper : vérifier admin global OU admin d'équipe
---------------------------------------------------------------- */
const isTeamAdmin = (team, userId, userRole) => {
if (userRole === "superadmin") return true; // ✅ superadmin global
if (userRole === "admin") return true; // admin global

const member = team.members.find((m) => {
return m.user.toString() === userId.toString();
});

// membre admin OU ancien schéma sans rôle
return member && (member.role === "admin" || !member.role);
};

/* ---------------------------------------------------------------
GET /api/teams → Toutes les équipes (superadmin) ou ses équipes (admin+member)
---------------------------------------------------------------- */
exports.getTeams = async (req, res) => {
try {
let teams;

if (req.user.role === "superadmin") {
teams = await Team.find()
.populate("members.user", "firstName lastName email avatar role")
.populate("createdBy", "firstName lastName");
} else {
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

/* ---------------------------------------------------------------
GET /api/teams/:id → Une équipe
---------------------------------------------------------------- */
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

/* ---------------------------------------------------------------
POST /api/teams → Créer une équipe (admin only)
---------------------------------------------------------------- */
exports.createTeam = async (req, res) => {
try {
if (req.user.role !== "admin" && req.user.role !== "superadmin") {
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
members: [{ user: req.user.id, role: "admin" }],
});

res.status(201).json({ success: true, data: team });
} catch (error) {
console.error("Create team error:", error);
res.status(500).json({ success: false, message: "Error creating team" });
}
};

/* ---------------------------------------------------------------
PUT /api/teams/:id → Modifier une équipe (admin équipe / admin global)
---------------------------------------------------------------- */
exports.updateTeam = async (req, res) => {
try {
const team = await Team.findById(req.params.id);
if (!team)
return res.status(404).json({ success: false, message: "Team not found" });

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

/* ---------------------------------------------------------------
POST /api/teams/:id/members → Ajouter un membre
---------------------------------------------------------------- */
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

/* ---------------------------------------------------------------
DELETE /api/teams/:id/members/:userId → Retirer un membre
---------------------------------------------------------------- */
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

/* ---------------------------------------------------------------
DELETE /api/teams/:id → Supprimer une équipe (ADMIN GLOBAL ONLY)
---------------------------------------------------------------- */
exports.deleteTeam = async (req, res) => {
try {
if (req.user.role !== "admin" && req.user.role !== "superadmin") {
return res.status(403).json({
success: false,
message: "Only admins can delete teams",
});
}

const team = await Team.findById(req.params.id);

if (!team) {
return res.status(404).json({
success: false,
message: "Team not found",
});
}

await team.deleteOne();

res.status(200).json({
success: true,
message: "Team deleted successfully",
});
} catch (error) {
console.error("Delete team error:", error);
res.status(500).json({ success: false, message: "Error deleting team" });
}
};
