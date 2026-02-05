const Task = require('../models/Task');
const Project = require('../models/Project');
const Team = require('../models/Team');
const User = require('../models/User');
const History = require('../models/History');
const XLSX = require('xlsx');

// ✅ ✅ ✅ HELPER (AJOUT)
const isSuperAdmin = (req) => req.user && req.user.role === 'superadmin';

// Export tasks to Excel
exports.exportTasks = async (req, res) => {
try {
const { projectId, status, priority, startDate, endDate } = req.query;

// Build query
let query = {};
if (projectId) query.project = projectId;
if (status) query.status = status;
if (priority) query.priority = priority;
if (startDate || endDate) {
query.dueDate = {};
if (startDate) query.dueDate.$gte = new Date(startDate);
if (endDate) query.dueDate.$lte = new Date(endDate);
}

// ✅ ✅ ✅ ACCESS FILTER (AJOUT)
// superadmin -> voit tout
// admin/member -> seulement tâches assignées OU créées par lui
if (!isSuperAdmin(req)) {
query.$or = [{ assignedTo: req.user.id }, { createdBy: req.user.id }];
}

const tasks = await Task.find(query)
.populate('project', 'name')
.populate('assignedTo', 'firstName lastName email')
.populate('createdBy', 'firstName lastName')
.sort({ createdAt: -1 });

// Prepare data for Excel
const data = tasks.map(task => ({
'ID': task._id.toString(),
'Titre': task.title,
'Description': task.description || '',
'Projet': task.project?.name || '',
'Statut': task.status,
'Priorité': task.priority,
'Assigné à': task.assignedTo.map(u => `${u.firstName} ${u.lastName}`).join(', '),
'Heures estimées': task.estimatedHours || 0,
'Date début': task.startDate ? new Date(task.startDate).toLocaleDateString('fr-FR') : '',
'Date échéance': task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR') : '',
'Sous-tâches': task.subtasks?.length || 0,
'Sous-tâches complétées': task.subtasks?.filter(st => st.isCompleted).length || 0,
'Progression (%)': task.completionPercentage || 0,
'En retard': task.isOverdue ? 'Oui' : 'Non',
'Créé par': task.createdBy ? `${task.createdBy.firstName} ${task.createdBy.lastName}` : '',
'Date création': new Date(task.createdAt).toLocaleDateString('fr-FR'),
'Dernière MAJ': new Date(task.updatedAt).toLocaleDateString('fr-FR')
}));

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);

// Set column widths
ws['!cols'] = [
{ wch: 25 }, // ID
{ wch: 30 }, // Titre
{ wch: 40 }, // Description
{ wch: 20 }, // Projet
{ wch: 15 }, // Statut
{ wch: 12 }, // Priorité
{ wch: 30 }, // Assigné à
{ wch: 12 }, // Heures
{ wch: 12 }, // Date début
{ wch: 12 }, // Date échéance
{ wch: 12 }, // Sous-tâches
{ wch: 18 }, // Complétées
{ wch: 12 }, // Progression
{ wch: 10 }, // En retard
{ wch: 20 }, // Créé par
{ wch: 12 }, // Date création
{ wch: 12 } // MAJ
];

XLSX.utils.book_append_sheet(wb, ws, 'Tâches');

// Generate buffer
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

// Send file
res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', `attachment; filename=taches_${Date.now()}.xlsx`);
res.send(buffer);

} catch (error) {
console.error('Export tasks error:', error);
res.status(500).json({ success: false, message: error.message });
}
};

// Export projects statistics
exports.exportProjects = async (req, res) => {
try {
// ✅ ✅ ✅ ACCESS FILTER (AJOUT)
// superadmin -> tous les projets
// admin/member -> projets liés à ses équipes OU créés par lui
let projectQuery = {};

if (!isSuperAdmin(req)) {
const userTeams = await Team.find({ 'members.user': req.user.id }).select('_id');
const teamIds = userTeams.map(t => t._id);

projectQuery = {
$or: [
{ teams: { $in: teamIds } }, // nouveau schéma
{ team: { $in: teamIds } }, // legacy
{ createdBy: req.user.id }
]
};
}

const projects = await Project.find(projectQuery)
.populate('team', 'name')
.populate('createdBy', 'firstName lastName');

// Get tasks count for each project
const projectsData = await Promise.all(
projects.map(async (project) => {
// ✅ ✅ ✅ ACCESS FILTER (AJOUT)
// superadmin -> toutes les tâches du projet
// admin/member -> tâches assignées OU créées par lui dans ce projet
let taskQuery = { project: project._id };

if (!isSuperAdmin(req)) {
taskQuery.$or = [{ assignedTo: req.user.id }, { createdBy: req.user.id }];
}

const tasks = await Task.find(taskQuery);

const totalTasks = tasks.length;
const completedTasks = tasks.filter(t => t.status === 'completed').length;
const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
const overdueTasks = tasks.filter(t => t.isOverdue && t.status !== 'completed').length;

return {
'ID': project._id.toString(),
'Nom': project.name,
'Description': project.description || '',
'Équipe': project.team?.name || '',
'Statut': project.status,
'Priorité': project.priority,
'Total tâches': totalTasks,
'Tâches terminées': completedTasks,
'Tâches en cours': inProgressTasks,
'Tâches en retard': overdueTasks,
'Taux de complétion (%)': totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
'Date début': project.startDate ? new Date(project.startDate).toLocaleDateString('fr-FR') : '',
'Date fin': project.endDate ? new Date(project.endDate).toLocaleDateString('fr-FR') : '',
'Tags': project.tags?.join(', ') || '',
'Créé par': project.createdBy ? `${project.createdBy.firstName} ${project.createdBy.lastName}` : '',
'Date création': new Date(project.createdAt).toLocaleDateString('fr-FR')
};
})
);

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(projectsData);

ws['!cols'] = [
{ wch: 25 }, { wch: 25 }, { wch: 40 }, { wch: 20 }, { wch: 12 },
{ wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
{ wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 12 }
];

XLSX.utils.book_append_sheet(wb, ws, 'Projets');

const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', `attachment; filename=projets_${Date.now()}.xlsx`);
res.send(buffer);

} catch (error) {
console.error('Export projects error:', error);
res.status(500).json({ success: false, message: error.message });
}
};

// Export global statistics
exports.exportStatistics = async (req, res) => {
try {
// ✅ ✅ ✅ ACCESS FILTER (AJOUT)
// superadmin -> global
// admin/member -> stats limitées à ses équipes/projets/tâches
if (!isSuperAdmin(req)) {
const userTeams = await Team.find({ 'members.user': req.user.id }).select('_id');
const teamIds = userTeams.map(t => t._id);

const projects = await Project.find({
$or: [
{ teams: { $in: teamIds } },
{ team: { $in: teamIds } },
{ createdBy: req.user.id }
]
});

const projectIds = projects.map(p => p._id);

const [tasks, teams] = await Promise.all([
Task.find({
$or: [
{ assignedTo: req.user.id },
{ createdBy: req.user.id }
]
}).populate('project', 'name'),
Team.find({ 'members.user': req.user.id })
]);

// On garde users comme avant (pas critique pour l’export stats), mais on limite à l’utilisateur courant
const users = await User.find({ _id: req.user.id });

// Global statistics
const globalStats = {
'Métrique': 'Valeur',
'Total utilisateurs': users.length,
'Total équipes': teams.length,
'Total projets': projects.length,
'Total tâches': tasks.length,
'Tâches non démarrées': tasks.filter(t => t.status === 'not_started').length,
'Tâches en cours': tasks.filter(t => t.status === 'in_progress').length,
'Tâches terminées': tasks.filter(t => t.status === 'completed').length,
'Tâches en retard': tasks.filter(t => t.isOverdue && t.status !== 'completed').length,
'Taux de complétion global (%)': Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) || 0
};

// Stats by priority
const priorityStats = [
{
'Priorité': 'Urgente',
'Nombre': tasks.filter(t => t.priority === 'urgent').length,
'Terminées': tasks.filter(t => t.priority === 'urgent' && t.status === 'completed').length
},
{
'Priorité': 'Haute',
'Nombre': tasks.filter(t => t.priority === 'high').length,
'Terminées': tasks.filter(t => t.priority === 'high' && t.status === 'completed').length
},
{
'Priorité': 'Moyenne',
'Nombre': tasks.filter(t => t.priority === 'medium').length,
'Terminées': tasks.filter(t => t.priority === 'medium' && t.status === 'completed').length
},
{
'Priorité': 'Basse',
'Nombre': tasks.filter(t => t.priority === 'low').length,
'Terminées': tasks.filter(t => t.priority === 'low' && t.status === 'completed').length
}
];

// Stats by project
const projectStats = await Promise.all(
projects.slice(0, 20).map(async (project) => {
const projectTasks = tasks.filter(t => t.project?._id.toString() === project._id.toString());
return {
'Projet': project.name,
'Total tâches': projectTasks.length,
'Terminées': projectTasks.filter(t => t.status === 'completed').length,
'En cours': projectTasks.filter(t => t.status === 'in_progress').length,
'En retard': projectTasks.filter(t => t.isOverdue && t.status !== 'completed').length,
'Taux complétion (%)': projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100) : 0
};
})
);

// Create workbook with multiple sheets
const wb = XLSX.utils.book_new();

// Sheet 1: Global stats
const ws1 = XLSX.utils.json_to_sheet([globalStats]);
XLSX.utils.book_append_sheet(wb, ws1, 'Statistiques Globales');

// Sheet 2: Priority stats
const ws2 = XLSX.utils.json_to_sheet(priorityStats);
XLSX.utils.book_append_sheet(wb, ws2, 'Par Priorité');

// Sheet 3: Project stats
const ws3 = XLSX.utils.json_to_sheet(projectStats);
XLSX.utils.book_append_sheet(wb, ws3, 'Par Projet');

const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', `attachment; filename=statistiques_${Date.now()}.xlsx`);
return res.send(buffer);
}

const [tasks, projects, teams, users] = await Promise.all([
Task.find().populate('project', 'name'),
Project.find(),
Team.find(),
User.find()
]);

// Global statistics
const globalStats = {
'Métrique': 'Valeur',
'Total utilisateurs': users.length,
'Total équipes': teams.length,
'Total projets': projects.length,
'Total tâches': tasks.length,
'Tâches non démarrées': tasks.filter(t => t.status === 'not_started').length,
'Tâches en cours': tasks.filter(t => t.status === 'in_progress').length,
'Tâches terminées': tasks.filter(t => t.status === 'completed').length,
'Tâches en retard': tasks.filter(t => t.isOverdue && t.status !== 'completed').length,
'Taux de complétion global (%)': Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) || 0
};

// Stats by priority
const priorityStats = [
{
'Priorité': 'Urgente',
'Nombre': tasks.filter(t => t.priority === 'urgent').length,
'Terminées': tasks.filter(t => t.priority === 'urgent' && t.status === 'completed').length
},
{
'Priorité': 'Haute',
'Nombre': tasks.filter(t => t.priority === 'high').length,
'Terminées': tasks.filter(t => t.priority === 'high' && t.status === 'completed').length
},
{
'Priorité': 'Moyenne',
'Nombre': tasks.filter(t => t.priority === 'medium').length,
'Terminées': tasks.filter(t => t.priority === 'medium' && t.status === 'completed').length
},
{
'Priorité': 'Basse',
'Nombre': tasks.filter(t => t.priority === 'low').length,
'Terminées': tasks.filter(t => t.priority === 'low' && t.status === 'completed').length
}
];

// Stats by project
const projectStats = await Promise.all(
projects.slice(0, 20).map(async (project) => {
const projectTasks = tasks.filter(t => t.project?._id.toString() === project._id.toString());
return {
'Projet': project.name,
'Total tâches': projectTasks.length,
'Terminées': projectTasks.filter(t => t.status === 'completed').length,
'En cours': projectTasks.filter(t => t.status === 'in_progress').length,
'En retard': projectTasks.filter(t => t.isOverdue && t.status !== 'completed').length,
'Taux complétion (%)': projectTasks.length > 0 ? Math.round((projectTasks.filter(t => t.status === 'completed').length / projectTasks.length) * 100) : 0
};
})
);

// Create workbook with multiple sheets
const wb = XLSX.utils.book_new();

// Sheet 1: Global stats
const ws1 = XLSX.utils.json_to_sheet([globalStats]);
XLSX.utils.book_append_sheet(wb, ws1, 'Statistiques Globales');

// Sheet 2: Priority stats
const ws2 = XLSX.utils.json_to_sheet(priorityStats);
XLSX.utils.book_append_sheet(wb, ws2, 'Par Priorité');

// Sheet 3: Project stats
const ws3 = XLSX.utils.json_to_sheet(projectStats);
XLSX.utils.book_append_sheet(wb, ws3, 'Par Projet');

const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', `attachment; filename=statistiques_${Date.now()}.xlsx`);
res.send(buffer);

} catch (error) {
console.error('Export statistics error:', error);
res.status(500).json({ success: false, message: error.message });
}
};

// Export team report
exports.exportTeamReport = async (req, res) => {
try {
const { teamId } = req.params;

// ✅ ✅ ✅ ACCESS FILTER (AJOUT)
// superadmin -> ok
// admin/member -> seulement si membre de l’équipe
if (!isSuperAdmin(req)) {
const isMember = await Team.findOne({ _id: teamId, 'members.user': req.user.id }).select('_id');
if (!isMember) {
return res.status(403).json({ success: false, message: 'Not allowed' });
}
}

const team = await Team.findById(teamId).populate('members.user', 'firstName lastName email');
if (!team) {
return res.status(404).json({ success: false, message: 'Team not found' });
}

const projects = await Project.find({ team: teamId });
const projectIds = projects.map(p => p._id);

// ✅ ✅ ✅ ACCESS FILTER (AJOUT)
// superadmin -> toutes les tâches
// admin/member -> tâches assignées OU créées par lui
let taskQuery = { project: { $in: projectIds } };
if (!isSuperAdmin(req)) {
taskQuery.$or = [{ assignedTo: req.user.id }, { createdBy: req.user.id }];
}

const tasks = await Task.find(taskQuery)
.populate('assignedTo', 'firstName lastName');

// Member statistics
const memberStats = team.members.map(member => {
const userTasks = tasks.filter(t =>
t.assignedTo.some(u => u._id.toString() === member.user._id.toString())
);

return {
'Membre': `${member.user.firstName} ${member.user.lastName}`,
'Email': member.user.email,
'Total tâches': userTasks.length,
'Terminées': userTasks.filter(t => t.status === 'completed').length,
'En cours': userTasks.filter(t => t.status === 'in_progress').length,
'Non démarrées': userTasks.filter(t => t.status === 'not_started').length,
'En retard': userTasks.filter(t => t.isOverdue && t.status !== 'completed').length,
'Taux complétion (%)': userTasks.length > 0 ? Math.round((userTasks.filter(t => t.status === 'completed').length / userTasks.length) * 100) : 0,
'Date d\'ajout': new Date(member.joinedAt).toLocaleDateString('fr-FR')
};
});

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(memberStats);

ws['!cols'] = [
{ wch: 25 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
{ wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 12 }
];

XLSX.utils.book_append_sheet(wb, ws, 'Rapport Équipe');

const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', `attachment; filename=equipe_${team.name}_${Date.now()}.xlsx`);
res.send(buffer);

} catch (error) {
console.error('Export team report error:', error);
res.status(500).json({ success: false, message: error.message });
}
};

// Export history
exports.exportHistory = async (req, res) => {
try {
const { startDate, endDate, entityType } = req.query;

let query = {};
if (startDate || endDate) {
query.createdAt = {};
if (startDate) query.createdAt.$gte = new Date(startDate);
if (endDate) query.createdAt.$lte = new Date(endDate);
}
if (entityType) query.entityType = entityType;

// ✅ ✅ ✅ ACCESS FILTER (AJOUT)
// superadmin -> ok
// admin/member -> historique lié à lui
if (!isSuperAdmin(req)) {
query.user = req.user.id;
}

const history = await History.find(query)
.populate('user', 'firstName lastName email')
.populate('project', 'name')
.sort({ createdAt: -1 })
.limit(1000);

const data = history.map(h => ({
'Date': new Date(h.createdAt).toLocaleDateString('fr-FR'),
'Heure': new Date(h.createdAt).toLocaleTimeString('fr-FR'),
'Utilisateur': h.user ? `${h.user.firstName} ${h.user.lastName}` : 'Inconnu',
'Email': h.user?.email || '',
'Action': h.action,
'Type': h.entityType,
'Entité': h.entityName,
'Projet': h.project?.name || '',
'Détails': JSON.stringify(h.details)
}));

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(data);

ws['!cols'] = [
{ wch: 12 }, { wch: 10 }, { wch: 25 }, { wch: 30 }, { wch: 15 },
{ wch: 10 }, { wch: 30 }, { wch: 20 }, { wch: 50 }
];

XLSX.utils.book_append_sheet(wb, ws, 'Historique');

const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
res.setHeader('Content-Disposition', `attachment; filename=historique_${Date.now()}.xlsx`);
res.send(buffer);

} catch (error) {
console.error('Export history error:', error);
res.status(500).json({ success: false, message: error.message });
}
};
