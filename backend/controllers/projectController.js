const Project = require('../models/Project');
const Team = require('../models/Team');

// Helper : déterminer si user est admin global
const isGlobalAdmin = (user) => {
return !user.role || user.role === 'admin';
};

// ===============================================
// 🔹 GET ALL PROJECTS
// ===============================================
exports.getProjects = async (req, res) => {
try {
let query = {};

// 🔒 Si MEMBER → ne voir que ses projets via ses équipes
if (!isGlobalAdmin(req.user)) {
const userTeams = req.user.teams || [];
query = { teams: { $in: userTeams } };
}

const projects = await Project.find(query)
.populate('teams', 'name color')
.sort({ createdAt: -1 });

res.status(200).json({
success: true,
count: projects.length,
data: projects
});

} catch (error) {
res.status(500).json({
success: false,
message: 'Error fetching projects',
error: error.message
});
}
};

// ===============================================
// 🔹 GET ONE PROJECT
// ===============================================
exports.getProject = async (req, res) => {
try {
const project = await Project.findById(req.params.id)
.populate('teams', 'name color');

if (!project) {
return res.status(404).json({
success: false,
message: 'Project not found'
});
}

// 🔒 Si MEMBER → vérifier qu'il appartient à une équipe du projet
if (!isGlobalAdmin(req.user)) {
const userTeams = req.user.teams.map(id => id.toString());
const projectTeams = project.teams.map(t => t._id.toString());

const allowed = projectTeams.some(teamId => userTeams.includes(teamId));

if (!allowed) {
return res.status(403).json({
success: false,
message: 'You do not have access to this project'
});
}
}

res.status(200).json({
success: true,
data: project
});

} catch (error) {
res.status(500).json({
success: false,
message: 'Error fetching project',
error: error.message
});
}
};

// ===============================================
// 🔹 CREATE PROJECT (ADMIN ONLY)
// ===============================================
exports.createProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({
success: false,
message: 'Only administrators can create projects'
});
}

let { name, description, teamIds, teams, startDate, endDate, tags, priority, color } = req.body;

// 🟢 Rendre compatible teams ou teamIds
const finalTeams = teamIds || teams;

if (!name || !finalTeams || finalTeams.length === 0) {
return res.status(400).json({
success: false,
message: 'Project name and at least one team are required'
});
}

const project = await Project.create({
name,
description,
teams: finalTeams,
startDate,
endDate,
tags,
priority,
color
});

res.status(201).json({
success: true,
data: project
});

} catch (error) {
console.error("CREATE PROJECT ERROR:", error);
res.status(500).json({
success: false,
message: 'Error creating project',
error: error.message
});
}
};

// ===============================================
// 🔹 UPDATE PROJECT (ADMIN ONLY)
// ===============================================
exports.updateProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({
success: false,
message: 'Only administrators can update projects'
});
}

const project = await Project.findByIdAndUpdate(
req.params.id,
req.body,
{ new: true }
);

if (!project) {
return res.status(404).json({
success: false,
message: 'Project not found'
});
}

res.status(200).json({
success: true,
data: project
});

} catch (error) {
res.status(500).json({
success: false,
message: 'Error updating project',
error: error.message
});
}
};

// ===============================================
// 🔹 DELETE PROJECT (ADMIN ONLY)
// ===============================================
exports.deleteProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({
success: false,
message: 'Only administrators can delete projects'
});
}

const project = await Project.findById(req.params.id);

if (!project) {
return res.status(404).json({
success: false,
message: 'Project not found'
});
}

await project.deleteOne();

res.status(200).json({
success: true,
message: 'Project deleted'
});

} catch (error) {
res.status(500).json({
success: false,
message: 'Error deleting project',
error: error.message
});
}
};
