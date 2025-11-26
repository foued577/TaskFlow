const Project = require("../models/Project");
const Team = require("../models/Team");

// Helper : admin global
const isGlobalAdmin = (user) => !user.role || user.role === "admin";

// =================================================================
// GET ALL PROJECTS
// =================================================================
exports.getProjects = async (req, res) => {
try {
let filter = {};

if (!isGlobalAdmin(req.user)) {
const userTeams = req.user.teams?.map((t) => t.toString()) || [];
filter = { teams: { $in: userTeams } };
}

const projects = await Project.find(filter)
.populate("teams", "name color")
.sort({ createdAt: -1 });

res.status(200).json({ success: true, data: projects });
} catch (error) {
console.error("Get projects error:", error);
res.status(500).json({ success: false, message: "Error fetching projects" });
}
};

// =================================================================
// GET ONE PROJECT
// =================================================================
exports.getProject = async (req, res) => {
try {
const project = await Project.findById(req.params.id)
.populate("teams", "name color");

if (!project)
return res.status(404).json({ success: false, message: "Project not found" });

if (!isGlobalAdmin(req.user)) {
const userTeams = req.user.teams.map((id) => id.toString());
const projectTeams = project.teams.map((t) => t._id.toString());
const allowed = projectTeams.some((id) => userTeams.includes(id));

if (!allowed)
return res.status(403).json({
success: false,
message: "You do not have access to this project"
});
}

res.status(200).json({ success: true, data: project });
} catch (error) {
console.error("Get project error:", error);
res.status(500).json({ success: false, message: "Error fetching project" });
}
};

// =================================================================
// CREATE PROJECT (ADMIN ONLY)
// =================================================================
exports.createProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({ success: false, message: "Only administrators can create projects" });
}

let {
name,
description,
teamIds,
teams,
startDate,
endDate,
tags,
priority,
color
} = req.body;

// Normalisation FRONT
const finalTeams =
Array.isArray(teamIds) && teamIds.length > 0
? teamIds
: Array.isArray(teams) && teams.length > 0
? teams
: [];

if (!name || finalTeams.length === 0) {
return res.status(400).json({
success: false,
message: "Project name and at least one team are required"
});
}

// Vérification : les équipes existent
const existingTeams = await Team.find({ _id: { $in: finalTeams } }).select("_id");

if (existingTeams.length !== finalTeams.length) {
return res.status(400).json({
success: false,
message: "One or more selected teams do not exist"
});
}

const project = await Project.create({
name,
description,
teams: finalTeams,
startDate: startDate || null,
endDate: endDate || null,
tags: Array.isArray(tags) ? tags : [],
priority: priority || "medium",
color: color || "#10B981",
});

res.status(201).json({ success: true, data: project });
} catch (error) {
console.error("Create project error:", error);
res.status(500).json({
success: false,
message: "Error creating project",
error: error.message,
});
}
};

// =================================================================
// UPDATE PROJECT (ADMIN ONLY)
// =================================================================
exports.updateProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({
success: false,
message: "Only administrators can update projects"
});
}

let updateData = { ...req.body };

// Normalisation teamIds/teams
if (updateData.teamIds || updateData.teams) {
const newTeams = updateData.teamIds || updateData.teams;
updateData.teams = newTeams;
delete updateData.teamIds;
}

const project = await Project.findByIdAndUpdate(req.params.id, updateData, {
new: true,
runValidators: true
});

if (!project)
return res.status(404).json({ success: false, message: "Project not found" });

res.status(200).json({ success: true, data: project });
} catch (error) {
console.error("Update project error:", error);
res.status(500).json({ success: false, message: "Error updating project" });
}
};

// =================================================================
// DELETE PROJECT (ADMIN ONLY)
// =================================================================
exports.deleteProject = async (req, res) => {
try {
if (!isGlobalAdmin(req.user)) {
return res.status(403).json({
success: false,
message: "Only administrators can delete projects"
});
}

const project = await Project.findById(req.params.id);

if (!project)
return res.status(404).json({ success: false, message: "Project not found" });

await project.deleteOne();

res.status(200).json({
success: true,
message: "Project deleted successfully"
});
} catch (error) {
console.error("Delete project error:", error);
res.status(500).json({ success: false, message: "Error deleting project" });
}
};
