const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');
// CREATE PROJECT
exports.createProject = async (req, res) => {
 try {
   const { name, description, teams, startDate, endDate, priority, color, tags } = req.body;
   // teams doit contenir au moins une équipe
   if (!name || !teams || !Array.isArray(teams) || teams.length === 0) {
     return res.status(400).json({
       success: false,
       message: "Project name and at least one team are required"
     });
   }
   // Vérifier chaque équipe
   for (const teamId of teams) {
     const team = await Team.findById(teamId);
     if (!team) {
       return res.status(404).json({
         success: false,
         message: `Team not found: ${teamId}`
       });
     }
     // Vérifier si user est membre
     const isMember = team.members.some(m => m.user.toString() === req.user.id);
     if (!isMember) {
       return res.status(403).json({
         success: false,
         message: "Not authorized to create project for one of the selected teams"
       });
     }
   }
   // Création projet
   const project = await Project.create({
     name,
     description,
     teams,           // 🔥 PRINCIPAL
     team: teams[0],  // 🔥 POUR COMPATIBILITÉ ANCIENNE VERSION
     startDate,
     endDate,
     priority: priority || 'medium',
     color: color || '#10B981',
     tags: tags || [],
     createdBy: req.user.id,
   });
   // Historique
   await History.create({
     user: req.user.id,
     action: 'created',
     entityType: 'project',
     entityId: project._id,
     entityName: name,
     project: project._id
   });
   // Notifications
   const allMembers = new Set();
   for (const teamId of teams) {
     const team = await Team.findById(teamId);
     team.members.forEach(m => allMembers.add(m.user.toString()));
   }
   allMembers.delete(req.user.id);
   for (const memberId of allMembers) {
     await Notification.create({
       recipient: memberId,
       sender: req.user.id,
       type: "project_added",
       title: "New project created",
       message: `${req.user.firstName} created project "${name}"`,
       relatedProject: project._id
     });
   }
   const populated = await Project.findById(project._id)
     .populate("teams", "name color")
     .populate("createdBy", "firstName lastName");
   res.status(201).json({
     success: true,
     data: populated
   });
 } catch (err) {
   res.status(500).json({
     success: false,
     message: "Error creating project",
     error: err.message
   });
 }
};
// GET PROJECTS
exports.getProjects = async (req, res) => {
 try {
   const teamMemberships = await Team.find({ 'members.user': req.user.id });
   const teamIds = teamMemberships.map(t => t._id);
   const projects = await Project.find({
     $or: [
       { team: { $in: teamIds } },
       { teams: { $in: teamIds } }
     ]
   })
     .populate("teams", "name color")
     .populate("team", "name color")
     .populate("createdBy", "firstName lastName")
     .sort('-createdAt');
   res.status(200).json({
     success: true,
     count: projects.length,
     data: projects
   });
 } catch (err) {
   res.status(500).json({
     success: false,
     message: "Error fetching projects",
     error: err.message
   });
 }
};
// GET ONE PROJECT
exports.getProject = async (req, res) => {
 try {
   const project = await Project.findById(req.params.id)
     .populate("teams")
     .populate("team")
     .populate("createdBy", "firstName lastName");
   if (!project) {
     return res.status(404).json({
       success: false,
       message: "Project not found"
     });
   }
   // Vérifier si user est dans au moins une équipe
   const userTeams = new Set(
     (project.teams || []).map(t => t._id.toString())
   );
   if (project.team) userTeams.add(project.team.toString());
   const membership = await Team.find({
     _id: { $in: Array.from(userTeams) },
     'members.user': req.user.id
   });
   if (membership.length === 0) {
     return res.status(403).json({
       success: false,
       message: "Not authorized"
     });
   }
   res.status(200).json({
     success: true,
     data: project
   });
 } catch (err) {
   res.status(500).json({
     success: false,
     message: "Error fetching project",
     error: err.message
   });
 }
};
