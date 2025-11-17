const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');
// -----------------------------------------------------------
// CREATE PROJECT
// -----------------------------------------------------------
exports.createProject = async (req, res) => {
 try {
   const { name, description, teams, startDate, endDate, priority, color, tags } = req.body;
   if (!name || !teams || !Array.isArray(teams) || teams.length === 0) {
     return res.status(400).json({
       success: false,
       message: "Project name and at least one team are required"
     });
   }
   // Verify teams exist
   const validTeams = await Team.find({ _id: { $in: teams } });
   if (validTeams.length !== teams.length) {
     return res.status(404).json({
       success: false,
       message: "One or more selected teams do not exist"
     });
   }
   // Check user belongs to at least one team
   const isMember = validTeams.some(team =>
     team.members.some(m => m.user.toString() === req.user.id)
   );
   if (!isMember) {
     return res.status(403).json({
       success: false,
       message: "Not authorized to create a project for these teams"
     });
   }
   // Create project
   const project = await Project.create({
     name,
     description,
     teams,
     startDate,
     endDate,
     priority: priority || "medium",
     color: color || "#10B981",
     tags: tags || [],
     createdBy: req.user.id,
     // Legacy compatibility
     team: teams[0]
   });
   // Add history log
   await History.create({
     user: req.user.id,
     action: "created",
     entityType: "project",
     entityId: project._id,
     entityName: project.name,
     project: project._id
   });
   // Notify team members
   const notifiedUsers = new Set();
   for (const t of validTeams) {
     for (const member of t.members) {
       if (member.user.toString() !== req.user.id) {
         notifiedUsers.add(member.user.toString());
       }
     }
   }
   for (const userId of notifiedUsers) {
     await Notification.create({
       recipient: userId,
       sender: req.user.id,
       type: "project_added",
       title: "New project created",
       message: `${req.user.firstName} created project "${name}"`,
       relatedProject: project._id
     });
   }
   const populatedProject = await Project.findById(project._id)
     .populate("teams", "name color")
     .populate("createdBy", "firstName lastName");
   res.status(201).json({
     success: true,
     data: populatedProject
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     message: "Error creating project",
     error: error.message
   });
 }
};

// -----------------------------------------------------------
// GET ALL PROJECTS
// -----------------------------------------------------------
exports.getProjects = async (req, res) => {
 try {
   const { teamId, status } = req.query;
   let query = {};
   if (teamId) {
     query.teams = teamId;
   } else {
     const teams = await Team.find({ 'members.user': req.user.id });
     const userTeams = teams.map(t => t._id);
     query.teams = { $in: userTeams };
   }
   if (status) {
     query.status = status;
   }
   const projects = await Project.find(query)
     .populate("teams", "name color")
     .populate("createdBy", "firstName lastName")
     .sort("-createdAt");
   res.status(200).json({
     success: true,
     count: projects.length,
     data: projects
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     message: "Error fetching projects",
     error: error.message
   });
 }
};

// -----------------------------------------------------------
// GET SINGLE PROJECT
// -----------------------------------------------------------
exports.getProject = async (req, res) => {
 try {
   const project = await Project.findById(req.params.id)
     .populate("teams")
     .populate("createdBy", "firstName lastName");
   if (!project) {
     return res.status(404).json({
       success: false,
       message: "Project not found"
     });
   }
   // Authorization: user must belong to at least one team
   const teams = await Team.find({ _id: { $in: project.teams } });
   const isMember = teams.some(t =>
     t.members.some(m => m.user.toString() === req.user.id)
   );
   if (!isMember) {
     return res.status(403).json({
       success: false,
       message: "Not authorized"
     });
   }
   res.status(200).json({
     success: true,
     data: project
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     message: "Error fetching project",
     error: error.message
   });
 }
};

// -----------------------------------------------------------
// UPDATE PROJECT
// -----------------------------------------------------------
exports.updateProject = async (req, res) => {
 try {
   const { name, description, teams, startDate, endDate, status, priority, color, tags } = req.body;
   const project = await Project.findById(req.params.id);
   if (!project) {
     return res.status(404).json({
       success: false,
       message: "Project not found"
     });
   }
   const validTeams = await Team.find({ _id: { $in: project.teams } });
   const isMember = validTeams.some(t =>
     t.members.some(m => m.user.toString() === req.user.id)
   );
   if (!isMember) {
     return res.status(403).json({
       success: false,
       message: "Not authorized"
     });
   }
   if (name) project.name = name;
   if (description !== undefined) project.description = description;
   if (teams) {
     project.teams = teams;
     project.team = teams[0]; // legacy support
   }
   if (startDate !== undefined) project.startDate = startDate;
   if (endDate !== undefined) project.endDate = endDate;
   if (status) project.status = status;
   if (priority) project.priority = priority;
   if (color) project.color = color;
   if (tags) project.tags = tags;
   await project.save();
   await History.create({
     user: req.user.id,
     action: "updated",
     entityType: "project",
     entityId: project._id,
     entityName: project.name,
     project: project._id
   });
   const updated = await Project.findById(project._id)
     .populate("teams", "name color")
     .populate("createdBy", "firstName lastName");
   res.status(200).json({
     success: true,
     data: updated
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     message: "Error updating project",
     error: error.message
   });
 }
};

// -----------------------------------------------------------
// DELETE PROJECT
// -----------------------------------------------------------
exports.deleteProject = async (req, res) => {
 try {
   const project = await Project.findById(req.params.id);
   if (!project) {
     return res.status(404).json({
       success: false,
       message: "Project not found"
     });
   }
   const teams = await Team.find({ _id: { $in: project.teams } });
   const isMember = teams.some(t =>
     t.members.some(m => m.user.toString() === req.user.id)
   );
   if (!isMember) {
     return res.status(403).json({
       success: false,
       message: "Not authorized"
     });
   }
   await project.deleteOne();
   res.status(200).json({
     success: true,
     message: "Project deleted successfully"
   });
 } catch (error) {
   res.status(500).json({
     success: false,
     message: "Error deleting project",
     error: error.message
   });
 }
};
