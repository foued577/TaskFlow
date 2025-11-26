const Project = require('../models/Project');
const Team = require('../models/Team');

// Helper : admin global
const isGlobalAdmin = (user) => !user.role || user.role === "admin";

// ===============================================
// GET ALL PROJECTS
// ===============================================
exports.getProjects = async (req, res) => {
try {
let query = {};

if (!isGlobalAdmin(req.user)) {
const userTeams = req.user.teams?.map(id => id.toString()) || [];
query = { teams: { $in: userTeams } };
}

const projects = await Project.find(query)
.populate("teams", "name color")
.sort({ createdAt: -1 });

res.status(200).json({ success: true, data: projects });

} catch (error) {
console.error("GetProjects ERROR:", error);
res.status(500).json({ success: false, message: "Error fetching projects" });
}
};

// ===============================================
// GET ONE PROJECT
// ===============================================
exports.getProject = async (req, res) => {
try {
const project = await Project.findById(req.params.id)
.populate("teams", "name color");

if (!project)
return res.status(404).json({ success: false, message: "Project not found" });

if (!isGlobalAdmin(req.user)) {
const userTeams = req.user.teams.map(t => t.toString());
const projectTeams = project.teams.map(t => t._id.toString());

const allowed = projectTeams.some(id => userTeams.includes(id));
if (!allowed) {
return res.status(403).json({ success: false, message: "Access denied" });
}
}

res.status(200).json({ success: true, data: project });

} catch (error) {
console.error("GetProject ERROR:", error);
res.status(500).json({ success: false, message: "Error fetching project" });
}
};

// ===============================================
// CREATE PROJECT
// ===============================================
exports.createProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({ success: false, message: "Admins only" });
}

let { name, description, teamIds, startDate, endDate, tags, priority, color } = req.body;

if (!name || !teamIds || !Array.isArray(teamIds) || teamIds.length === 0) {
return res.status(400).json({
success: false,
message: "Project name and at least one team required"
});
}

// Normalize teamIds
teamIds = teamIds.map(id =>
typeof id === "object" ? id._id?.toString() : id.toString()
);

// Validate teams exist
const teamsExist = await Team.find({ _id: { $in: teamIds } });
if (teamsExist.length !== teamIds.length) {
return res.status(400).json({
success: false,
message: "One or more teams do not exist"
});
}

const project = await Project.create({
name,
description,
teams: teamIds,
startDate: startDate || null,
endDate: endDate || null,
tags: Array.isArray(tags) ? tags : [],
priority: priority || "medium",
color: color || "#10B981"
});

res.status(201).json({ success: true, data: project });

} catch (error) {
console.error("CreateProject ERROR:", error);
res.status(500).json({ success: false, message: "Error creating project" });
}
};

// ===============================================
// UPDATE PROJECT
// ===============================================
exports.updateProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({ success: false, message: "Admins only" });
}

const data = req.body;

if (data.teamIds) {
data.teamIds = data.teamIds.map(id =>
typeof id === "object" ? id._id?.toString() : id.toString()
);
}

const project = await Project.findByIdAndUpdate(req.params.id, data, { new: true });

if (!project)
return res.status(404).json({ success: false, message: "Project not found" });

res.status(200).json({ success: true, data: project });

} catch (error) {
console.error("UpdateProject ERROR:", error);
res.status(500).json({ success: false, message: "Error updating project" });
}
};

// ===============================================
// DELETE PROJECT
// ===============================================
exports.deleteProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({ success: false, message: "Admins only" });
}

const project = await Project.findById(req.params.id);
if (!project)
return res.status(404).json({ success: false, message: "Project not found" });

await project.deleteOne();

res.status(200).json({ success: true, message: "Project deleted" });

} catch (error) {
console.error("DeleteProject ERROR:", error);
res.status(500).json({ success: false, message: "Error deleting project" });
}
};
