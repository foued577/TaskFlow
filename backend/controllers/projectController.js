const Project = require('../models/Project');
const Team = require('../models/Team');

// Helper : déterminer si l'utilisateur est admin global
const isGlobalAdmin = (user) => {
return !user.role || user.role === 'admin';
};

// ===============================================
// 🔹 GET ALL PROJECTS
// @route GET /api/projects
// @access Private
// ===============================================
exports.getProjects = async (req, res) => {
try {
let query = {};

if (!isGlobalAdmin(req.user)) {
// 🔐 Membre : on récupère d'abord ses équipes
const userTeams = await Team.find({ 'members.user': req.user.id }).select('_id');
const teamIds = userTeams.map((t) => t._id);

query = {
$or: [
{ teams: { $in: teamIds } }, // nouveaux projets (multi-équipes)
{ team: { $in: teamIds } }, // anciens projets (champ "team")
{ createdBy: req.user.id }, // projets qu'il a créés
],
};
}

const projects = await Project.find(query)
.populate('teams', 'name color')
.populate('team', 'name color')
.sort({ createdAt: -1 });

res.status(200).json({
success: true,
count: projects.length,
data: projects,
});
} catch (error) {
console.error('Get projects error:', error);
res.status(500).json({
success: false,
message: 'Error fetching projects',
error: error.message,
});
}
};

// ===============================================
// 🔹 GET ONE PROJECT
// @route GET /api/projects/:id
// @access Private
// ===============================================
exports.getProject = async (req, res) => {
try {
const project = await Project.findById(req.params.id)
.populate('teams', 'name color')
.populate('team', 'name color');

if (!project) {
return res.status(404).json({
success: false,
message: 'Project not found',
});
}

// Admin global → accès complet
if (!isGlobalAdmin(req.user)) {
// Récupérer les équipes du user
const userTeams = await Team.find({ 'members.user': req.user.id }).select('_id');
const userTeamIds = userTeams.map((t) => t._id.toString());

const projectTeamsIds = [
...(project.teams || []).map((t) => t._id.toString()),
];

if (project.team) {
projectTeamsIds.push(project.team._id.toString());
}

const isCreator = project.createdBy.toString() === req.user.id.toString();
const hasTeamAccess = projectTeamsIds.some((id) => userTeamIds.includes(id));

if (!isCreator && !hasTeamAccess) {
return res.status(403).json({
success: false,
message: 'You do not have access to this project',
});
}
}

res.status(200).json({
success: true,
data: project,
});
} catch (error) {
console.error('Get project error:', error);
res.status(500).json({
success: false,
message: 'Error fetching project',
error: error.message,
});
}
};

// ===============================================
// 🔹 CREATE PROJECT (ADMIN ONLY)
// @route POST /api/projects
// @access Admin
// ===============================================
exports.createProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({
success: false,
message: 'Only administrators can create projects',
});
}

const {
name,
description,
teamIds,
startDate,
endDate,
tags,
priority,
color,
} = req.body;

if (!name || !teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
return res.status(400).json({
success: false,
message: 'Project name and at least one team are required',
});
}

// Legacy : si une seule équipe → on remplit aussi "team"
const legacyTeamId = teamIds.length === 1 ? teamIds[0] : undefined;

const project = await Project.create({
name,
description: description || '',
team: legacyTeamId, // pour compatibilité avec l’ancien code
teams: teamIds, // nouveau champ multi-équipes
startDate: startDate || null,
endDate: endDate || null,
tags: tags || [],
priority: priority || 'medium',
color: color || '#10B981',
createdBy: req.user.id, // ✅ OBLIGATOIRE avec ton schéma
});

res.status(201).json({
success: true,
data: project,
});
} catch (error) {
console.error('Create project error:', error);
res.status(500).json({
success: false,
message: 'Error creating project',
error: error.message,
});
}
};

// ===============================================
// 🔹 UPDATE PROJECT (ADMIN ONLY)
// @route PUT /api/projects/:id
// @access Admin
// ===============================================
exports.updateProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({
success: false,
message: 'Only administrators can update projects',
});
}

const updates = { ...req.body };

// Si on reçoit "teamIds" depuis le front, on synchronise "teams" + "team"
if (Array.isArray(updates.teamIds)) {
updates.teams = updates.teamIds;
updates.team = updates.teamIds.length === 1 ? updates.teamIds[0] : undefined;
delete updates.teamIds;
}

const project = await Project.findByIdAndUpdate(req.params.id, updates, {
new: true,
});

if (!project) {
return res.status(404).json({
success: false,
message: 'Project not found',
});
}

res.status(200).json({
success: true,
data: project,
});
} catch (error) {
console.error('Update project error:', error);
res.status(500).json({
success: false,
message: 'Error updating project',
error: error.message,
});
}
};

// ===============================================
// 🔹 DELETE PROJECT (ADMIN ONLY)
// @route DELETE /api/projects/:id
// @access Admin
// ===============================================
exports.deleteProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({
success: false,
message: 'Only administrators can delete projects',
});
}

const project = await Project.findById(req.params.id);

if (!project) {
return res.status(404).json({
success: false,
message: 'Project not found',
});
}

await project.deleteOne();

res.status(200).json({
success: true,
message: 'Project deleted',
});
} catch (error) {
console.error('Delete project error:', error);
res.status(500).json({
success: false,
message: 'Error deleting project',
error: error.message,
});
}
};
