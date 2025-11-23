const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');

// ------------------------------------------------------
// CREATE PROJECT
// ------------------------------------------------------
exports.createProject = async (req, res) => {
try {
const { name, description, teamIds, startDate, endDate, priority, color, tags } = req.body;

// Vérification champs obligatoires
if (!name || !teamIds || teamIds.length === 0) {
return res.status(400).json({
success: false,
message: "Project name and at least one team are required",
});
}

// Vérifier que toutes les équipes existent
const teams = await Team.find({ _id: { $in: teamIds } });
if (teams.length !== teamIds.length) {
return res.status(404).json({
success: false,
message: "One or more teams not found",
});
}

// Vérifier que l'utilisateur appartient à AU MOINS UNE de ces équipes
const isMember = teams.some(team =>
team.members.some(m => m.user.toString() === req.user.id)
);

if (!isMember) {
return res.status(403).json({
success: false,
message: "Not authorized to create project in these teams",
});
}

// Création du projet
const project = await Project.create({
name,
description: description || "",
teams: teamIds, // NOUVEAU correct
team: teamIds[0], // compatibilité avec anciens champs
startDate: startDate || null,
endDate: endDate || null,
priority: priority || 'medium',
color: color || '#10B981',
tags: tags || [],
createdBy: req.user.id,
});

// Historique
await History.create({
user: req.user.id,
action: "created",
entityType: "project",
entityId: project._id,
entityName: name,
project: project._id,
});

// Notification à tous les membres des équipes
const memberIds = [
...new Set(
teams.flatMap(t =>
t.members.map(m => m.user.toString()).filter(id => id !== req.user.id)
)
),
];

for (const memberId of memberIds) {
await Notification.create({
recipient: memberId,
sender: req.user.id,
type: "project_added",
title: "Nouveau projet",
message: `${req.user.firstName} a créé le projet "${name}"`,
relatedProject: project._id,
});
}

const populated = await Project.findById(project._id)
.populate("teams", "name color")
.populate("createdBy", "firstName lastName");

res.status(201).json({ success: true, data: populated });
} catch (error) {
res.status(500).json({
success: false,
message: "Error creating project",
error: error.message,
});
}
};


// ------------------------------------------------------
// GET PROJECTS FOR USER
// ------------------------------------------------------
exports.getProjects = async (req, res) => {
try {
const { status } = req.query;

const teams = await Team.find({ "members.user": req.user.id });
const teamIds = teams.map(t => t._id);

let query = {
$or: [
{ team: { $in: teamIds } }, // compatibilité ancien schéma
{ teams: { $in: teamIds } },
],
};

if (status) query.status = status;

const projects = await Project.find(query)
.populate("teams", "name color")
.populate("team", "name color")
.populate("createdBy", "firstName lastName")
.sort("-createdAt");

res.status(200).json({
success: true,
count: projects.length,
data: projects,
});
} catch (error) {
res.status(500).json({
success: false,
message: "Error fetching projects",
error: error.message,
});
}
};


// ------------------------------------------------------
// GET ONE PROJECT
// ------------------------------------------------------
exports.getProject = async (req, res) => {
try {
const project = await Project.findById(req.params.id)
.populate("teams")
.populate("team")
.populate("createdBy", "firstName lastName");

if (!project) {
return res.status(404).json({ success: false, message: "Project not found" });
}

// Vérifier que user appartient au projet
const teams = await Team.find({ _id: { $in: project.teams } });

const isMember = teams.some(team =>
team.members.some(m => m.user.toString() === req.user.id)
);

if (!isMember) {
return res.status(403).json({ success: false, message: "Not authorized" });
}

res.status(200).json({ success: true, data: project });
} catch (error) {
res.status(500).json({
success: false,
message: "Error fetching project",
error: error.message,
});
}
};


// ------------------------------------------------------
// UPDATE PROJECT
// ------------------------------------------------------
exports.updateProject = async (req, res) => {
try {
const { name, description, startDate, endDate, status, priority, color, tags, teamIds } =
req.body;

const project = await Project.findById(req.params.id);

if (!project) {
return res.status(404).json({ success: false, message: "Project not found" });
}

// Validation teams
if (teamIds && teamIds.length > 0) {
const teams = await Team.find({ _id: { $in: teamIds } });

const isMember = teams.some(team =>
team.members.some(m => m.user.toString() === req.user.id)
);

if (!isMember) {
return res.status(403).json({
success: false,
message: "Not authorized to modify project in these teams",
});
}

project.teams = teamIds;
project.team = teamIds[0]; // compatibilité
}

if (name) project.name = name;
if (description !== undefined) project.description = description;
if (startDate !== undefined) project.startDate = startDate;
if (endDate !== undefined) project.endDate = endDate;
if (status) project.status = status;
if (priority) project.priority = priority;
if (color) project.color = color;
if (tags) project.tags = tags;

await project.save();

const updated = await Project.findById(project._id)
.populate("teams", "name color")
.populate("createdBy", "firstName lastName");

res.status(200).json({ success: true, data: updated });
} catch (error) {
res.status(500).json({
success: false,
message: "Error updating project",
error: error.message,
});
}
};


// ------------------------------------------------------
// DELETE PROJECT
// ------------------------------------------------------
exports.deleteProject = async (req, res) => {
try {
const project = await Project.findById(req.params.id);

if (!project) {
return res.status(404).json({ success: false, message: "Project not found" });
}

await project.deleteOne();

res.status(200).json({
success: true,
message: "Project deleted successfully",
});
} catch (error) {
res.status(500).json({
success: false,
message: "Error deleting project",
error: error.message,
});
}
};
