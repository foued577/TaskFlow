const Task = require('../models/Task');
const Project = require('../models/Project');

// =====================================================
// GET ALL TASKS
// =====================================================
exports.getTasks = async (req, res) => {
try {
const userId = req.user.id;
const role = req.user.role || 'admin';
let filters = {};
let q = { ...req.query };

// Remove empty filters
Object.keys(q).forEach((k) => {
if (!q[k]) delete q[k];
});

if (q.status) filters.status = q.status;
if (q.priority) filters.priority = q.priority;
if (q.projectId) filters.project = q.projectId;

// ✅ ✅ ✅ ARCHIVE FILTER (AJOUT)
// /tasks -> non archivées
// /tasks?archived=true -> archivées
if (q.archived === 'true' || q.archived === true) {
filters.archived = true;
} else {
filters.archived = { $ne: true };
}

// ✅ ✅ ✅ ADMIN SCOPING (MODIF MINIMALE)
// admin (pas superadmin) voit seulement tâches assignées à lui
if (role === 'admin' && !req.user.isSuperAdmin) {
filters.assignedTo = userId;

// si le front envoie projectId, on garde aussi assignedTo (intersection)
if (filters.project) {
filters.project = filters.project;
}
}

// Role filtering (member)
if (role !== 'admin' && role !== 'superadmin') {
filters.$or = [
{ assignedTo: userId },
{ createdBy: userId }
];
}

if (q.filterType === 'assignedToMe') {
filters.assignedTo = userId;
}

if (q.filterType === 'createdByMeNotAssignedToMe') {
filters.createdBy = userId;
filters.assignedTo = { $ne: userId };
}

const tasks = await Task.find(filters)
.populate('assignedTo', 'firstName lastName email')
.populate('project', 'name color teams team') // ✅ AJOUT (teams/team utile)
.sort({ createdAt: -1 });

res.status(200).json({ success: true, data: tasks });

} catch (err) {
res.status(500).json({ success: false, message: 'Error fetching tasks', error: err.message });
}
};

// =====================================================
// GET ONE TASK
// =====================================================
exports.getTask = async (req, res) => {
try {
const task = await Task.findById(req.params.id)
.populate('assignedTo', 'firstName lastName email')
.populate('project', 'name color teams team'); // ✅ AJOUT

if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

// ✅ ✅ ✅ ADMIN ACCESS (MODIF MINIMALE)
// admin (pas superadmin) -> accès seulement si assigné à lui
if ((req.user.role === 'admin' && !req.user.isSuperAdmin)) {
const isAssignedToMe = task.assignedTo.some(u => u.toString() === req.user.id.toString());
if (!isAssignedToMe) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

// Member access
if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
const isAssigned = task.assignedTo.some(u => u.toString() === req.user.id);
const isCreator = task.createdBy.toString() === req.user.id;

if (!isAssigned && !isCreator) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

res.status(200).json({ success: true, data: task });

} catch (err) {
res.status(500).json({ success: false, message: 'Error fetching task', error: err.message });
}
};

// =====================================================
// CREATE TASK
// =====================================================
exports.createTask = async (req, res) => {
try {
const { title, description, projectId, assignedTo, priority, status, dueDate } = req.body;

const project = await Project.findById(projectId);
if (!project) {
return res.status(404).json({ success: false, message: 'Project not found' });
}

// ✅ ✅ ✅ ADMIN (pas superadmin) -> doit créer seulement dans ses équipes (AJOUT)
if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
const userTeamIds = (req.user.teams || []).map(t => t.toString());
const projectTeams = (project.teams || []).map(t => t.toString());
const legacyTeam = project.team ? project.team.toString() : null;

const allowed =
projectTeams.some(t => userTeamIds.includes(t)) ||
(legacyTeam && userTeamIds.includes(legacyTeam));

if (!allowed) {
return res.status(403).json({
success: false,
message: 'Not authorized to create a task in this project'
});
}
}

// Member restriction
if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
const userTeamIds = req.user.teams?.map(t => t.toString()) || [];
const projectTeams = project.teams?.map(t => t.toString()) || [];

const allowed = projectTeams.some(t => userTeamIds.includes(t));
if (!allowed) {
return res.status(403).json({
success: false,
message: 'Not authorized to create a task in this project'
});
}
}

const task = await Task.create({
title,
description,
project: projectId,
assignedTo,
priority,
status,
dueDate,
createdBy: req.user.id
});

res.status(201).json({ success: true, data: task });

} catch (err) {
res.status(500).json({ success: false, message: 'Error creating task', error: err.message });
}
};

// =====================================================
// UPDATE TASK
// =====================================================
exports.updateTask = async (req, res) => {
try {
const updates = { ...req.body };

const task = await Task.findById(req.params.id).populate('project', 'teams team'); // ✅ AJOUT
if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

// ✅ ✅ ✅ ADMIN (pas superadmin) -> update seulement si assigné à lui (MODIF MINIMALE)
if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
const isAssignedToMe = task.assignedTo.some(u => u.toString() === req.user.id.toString());
if (!isAssignedToMe) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

// Member restriction
if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
const isAssigned = task.assignedTo.some(u => u.toString() === req.user.id);
const isCreator = task.createdBy.toString() === req.user.id;

if (!isAssigned && !isCreator) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

Object.assign(task, updates);
await task.save();

res.status(200).json({ success: true, data: task });

} catch (err) {
res.status(500).json({ success: false, message: 'Error updating task', error: err.message });
}
};

// =====================================================
// DELETE TASK
// =====================================================
exports.deleteTask = async (req, res) => {
try {
const task = await Task.findById(req.params.id).populate('project', 'teams team'); // ✅ AJOUT
if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

// ✅ ✅ ✅ ADMIN (pas superadmin) -> delete seulement si assigné à lui (MODIF MINIMALE)
if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
const isAssignedToMe = task.assignedTo.some(u => u.toString() === req.user.id.toString());
if (!isAssignedToMe) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

if (req.user.role !== 'admin' && req.user.role !== 'superadmin' && task.createdBy.toString() !== req.user.id) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}

await task.deleteOne();

res.status(200).json({ success: true, message: 'Task deleted' });

} catch (err) {
res.status(500).json({ success: false, message: 'Error deleting task', error: err.message });
}
};

// =====================================================
// ADD SUBTASK
// =====================================================
exports.addSubtask = async (req, res) => {
try {
const task = await Task.findById(req.params.id);
if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

const title = req.body.title;
if (!title) {
return res.status(400).json({ success: false, message: 'Subtask title required' });
}

// ✅ ✅ ✅ COMPAT MODEL (AJOUT)
// Le modèle utilise isCompleted, mais ici on gardait completed
task.subtasks.push({ title, completed: false, isCompleted: false });

await task.save();

res.status(200).json({ success: true, data: task });

} catch (err) {
res.status(500).json({ success: false, message: 'Error adding subtask', error: err.message });
}
};

// =====================================================
// TOGGLE SUBTASK
// =====================================================
exports.toggleSubtask = async (req, res) => {
try {
const { id, subtaskId } = req.params;

const task = await Task.findById(id);
if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

const subtask = task.subtasks.id(subtaskId);
if (!subtask) return res.status(404).json({ success: false, message: 'Subtask not found' });

// ✅ ✅ ✅ COMPAT MODEL (AJOUT)
// On bascule isCompleted (champ du modèle) + on garde completed si existant
subtask.isCompleted = !subtask.isCompleted;
subtask.completed = subtask.isCompleted;

await task.save();

res.status(200).json({ success: true, data: task });

} catch (err) {
res.status(500).json({
success: false,
message: 'Error toggling subtask',
error: err.message
});
}
};

// =====================================================
// UPLOAD ATTACHMENT
// =====================================================
exports.uploadAttachment = async (req, res) => {
try {
const task = await Task.findById(req.params.id);
if (!task) {
return res.status(404).json({ success: false, message: 'Task not found' });
}

if (!req.file) {
return res.status(400).json({ success: false, message: 'No file uploaded' });
}

const fileData = {
filename: req.file.filename,
originalName: req.file.originalname,

// ✅ ✅ ✅ COMPAT MODEL (AJOUT)
// Le modèle utilise "mimetype" (pas "mimeType")
mimetype: req.file.mimetype,
mimeType: req.file.mimetype,

size: req.file.size,
uploadedAt: new Date()
};

task.attachments.push(fileData);
await task.save();

res.status(200).json({
success: true,
message: 'File uploaded successfully',
data: fileData
});

} catch (err) {
res.status(500).json({
success: false,
message: 'Error uploading attachment',
error: err.message
});
}
};

// =====================================================
// GET OVERDUE TASKS
// =====================================================
exports.getOverdueTasks = async (req, res) => {
try {
const now = new Date();

const filters = {
dueDate: { $lt: now },
status: { $ne: 'completed' },

// ✅ ✅ ✅ EXCLUDE ARCHIVED (AJOUT)
archived: { $ne: true }
};

// ✅ ✅ ✅ ADMIN SCOPING (MODIF MINIMALE)
if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
filters.assignedTo = req.user.id;
}

if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
filters.assignedTo = req.user.id;
}

const tasks = await Task.find(filters)
.populate('assignedTo', 'firstName lastName email')
.populate('project', 'name');

res.status(200).json({
success: true,
count: tasks.length,
data: tasks
});

} catch (err) {
res.status(500).json({
success: false,
message: 'Error fetching overdue tasks',
error: err.message
});
}
};

// =====================================================
// ✅ ARCHIVE TASK (AJOUT)
// =====================================================
exports.archiveTask = async (req, res) => {
try {
const task = await Task.findById(req.params.id).populate('project', 'teams team'); // ✅ AJOUT
if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

// ✅ ✅ ✅ ADMIN (pas superadmin) -> peut archiver seulement si assigné à lui (MODIF MINIMALE)
if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
const isAssignedToMe = task.assignedTo.some(u => u.toString() === req.user.id.toString());
if (!isAssignedToMe) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

// Member restriction
if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
const isAssigned = task.assignedTo.some(u => u.toString() === req.user.id);
const isCreator = task.createdBy.toString() === req.user.id;

if (!isAssigned && !isCreator) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

task.archived = true;
await task.save();

res.status(200).json({ success: true, message: 'Task archived', data: task });

} catch (err) {
res.status(500).json({ success: false, message: 'Error archiving task', error: err.message });
}
};

// =====================================================
// ✅ UNARCHIVE TASK (AJOUT)
// =====================================================
exports.unarchiveTask = async (req, res) => {
try {
const task = await Task.findById(req.params.id).populate('project', 'teams team'); // ✅ AJOUT
if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

// ✅ ✅ ✅ ADMIN (pas superadmin) -> peut restaurer seulement si assigné à lui (MODIF MINIMALE)
if (req.user.role === 'admin' && !req.user.isSuperAdmin) {
const isAssignedToMe = task.assignedTo.some(u => u.toString() === req.user.id.toString());
if (!isAssignedToMe) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

// Member restriction
if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
const isAssigned = task.assignedTo.some(u => u.toString() === req.user.id);
const isCreator = task.createdBy.toString() === req.user.id;

if (!isAssigned && !isCreator) {
return res.status(403).json({ success: false, message: 'Not authorized' });
}
}

task.archived = false;
await task.save();

res.status(200).json({ success: true, message: 'Task restored', data: task });

} catch (err) {
res.status(500).json({ success: false, message: 'Error restoring task', error: err.message });
}
};
