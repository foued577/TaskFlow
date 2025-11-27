import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { Plus, Filter } from 'lucide-react';
import Loading from '../components/Loading';
import TaskModal from '../components/TaskModal';
import { useAuth } from '../context/AuthContext'; // ⬅️ AJOUT

const Kanban = () => {
const { user } = useAuth(); // ⬅️ AJOUT
const isAdmin = !user?.role || user.role === "admin"; // ⬅️ AJOUT

const [tasks, setTasks] = useState([]);
const [projects, setProjects] = useState([]);
const [selectedProject, setSelectedProject] = useState('');
const [loading, setLoading] = useState(true);
const [showModal, setShowModal] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);
const [draggedTask, setDraggedTask] = useState(null);

const columns = [
{ id: 'not_started', title: 'Non démarrée', color: 'bg-gray-100' },
{ id: 'in_progress', title: 'En cours', color: 'bg-blue-100' },
{ id: 'completed', title: 'Terminée', color: 'bg-green-100' },
];

useEffect(() => {
loadData();
}, [selectedProject]);

const loadData = async () => {
try {
const [tasksRes, projectsRes] = await Promise.all([
tasksAPI.getAll(selectedProject ? { projectId: selectedProject } : {}),
projectsAPI.getAll(),
]);
setTasks(tasksRes.data.data);
setProjects(projectsRes.data.data);
} catch (error) {
toast.error('Erreur lors du chargement');
} finally {
setLoading(false);
}
};

const handleTaskClick = (task) => {
setSelectedTask(task);
setShowModal(true);
};

const handleDragStart = (e, task) => {
setDraggedTask(task);
e.dataTransfer.effectAllowed = 'move';
};

const handleDragOver = (e) => {
e.preventDefault();
e.dataTransfer.dropEffect = 'move';
};

const handleDrop = async (e, newStatus) => {
e.preventDefault();

if (!draggedTask || draggedTask.status === newStatus) {
setDraggedTask(null);
return;
}

try {
await tasksAPI.update(draggedTask._id, { status: newStatus });
toast.success('Statut mis à jour');
loadData();
} catch (error) {
toast.error('Erreur lors de la mise à jour');
} finally {
setDraggedTask(null);
}
};

const getTasksByStatus = (status) => {
return tasks.filter((task) => task.status === status);
};

const getPriorityColor = (priority) => {
const colors = {
low: 'border-l-blue-500',
medium: 'border-l-yellow-500',
high: 'border-l-orange-500',
urgent: 'border-l-red-500',
};
return colors[priority] || colors.medium;
};

if (loading) return <Loading fullScreen={false} />;

return (
<div>
{/* Header */}
<div className="flex items-center justify-between mb-6">
<h1 className="text-2xl font-bold text-gray-900">Tableau Kanban</h1>

{/* 🔥 AFFICHER BOUTON UNIQUEMENT POUR ADMIN */}
{isAdmin && (
<button
onClick={() => {
setSelectedTask(null);
setShowModal(true);
}}
className="btn btn-primary flex items-center"
>
<Plus className="w-5 h-5 mr-2" />
Nouvelle tâche
</button>
)}
</div>

{/* Filter */}
<div className="card mb-6">
<div className="flex items-center space-x-4">
<Filter className="w-5 h-5 text-gray-600" />
<select
value={selectedProject}
onChange={(e) => setSelectedProject(e.target.value)}
className="input flex-1"
>
<option value="">Tous les projets</option>
{projects.map((project) => (
<option key={project._id} value={project._id}>
{project.name}
</option>
))}
</select>
</div>
</div>

{/* Kanban Board */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
{columns.map((column) => {
const columnTasks = getTasksByStatus(column.id);

return (
<div key={column.id} className="flex flex-col">
{/* Column Header */}
<div className={`${column.color} rounded-t-lg p-4 border-b-2 border-gray-300`}>
<div className="flex items-center justify-between">
<h3 className="font-bold text-gray-900">{column.title}</h3>
<span className="bg-white px-2 py-1 rounded-full text-sm font-semibold text-gray-700">
{columnTasks.length}
</span>
</div>
</div>

{/* Column Content */}
<div
onDragOver={handleDragOver}
onDrop={(e) => handleDrop(e, column.id)}
className="flex-1 bg-gray-50 rounded-b-lg p-4 min-h-[500px]"
>
<div className="space-y-3">
{columnTasks.map((task) => (
<div
key={task._id}
draggable
onDragStart={(e) => handleDragStart(e, task)}
onClick={() => handleTaskClick(task)}
className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer border-l-4 ${getPriorityColor(task.priority)} ${
draggedTask?._id === task._id ? 'opacity-50' : ''
}`}
>
{/* Task Title */}
<h4 className="font-semibold text-gray-900 mb-2">{task.title}</h4>

{/* Project Badge */}
{task.project && (
<div className="flex items-center mb-2">
<div
className="w-2 h-2 rounded-full mr-2"
style={{ backgroundColor: task.project.color }}
/>
<span className="text-xs text-gray-600">
{task.project.name}
</span>
</div>
)}

{/* Task Description */}
{task.description && (
<p className="text-sm text-gray-600 mb-3 line-clamp-2">
{task.description}
</p>
)}

{/* Task Meta */}
<div className="flex items-center justify-between">
<div className="flex items-center space-x-2">
<span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
{task.priority}
</span>

{task.subtasks && task.subtasks.length > 0 && (
<span className="text-xs px-2 py-1 rounded bg-indigo-100 text-indigo-800">
✓ {task.subtasks.filter((st) => st.isCompleted).length}/{task.subtasks.length}
</span>
)}
</div>

{task.assignedTo && task.assignedTo.length > 0 && (
<div className="flex -space-x-2">
{task.assignedTo.slice(0, 3).map((user, index) => (
<div
key={user._id || index}
className="w-6 h-6 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
title={`${user.firstName} ${user.lastName}`}
>
{user.firstName?.charAt(0)}
{user.lastName?.charAt(0)}
</div>
))}
{task.assignedTo.length > 3 && (
<div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-semibold border-2 border-white">
+{task.assignedTo.length - 3}
</div>
)}
</div>
)}
</div>

{/* Due Date */}
{task.dueDate && (
<div className="mt-3 pt-3 border-t border-gray-200">
<div className="flex items-center text-xs text-gray-500">
<span>📅</span>
<span className="ml-1">
{new Date(task.dueDate).toLocaleDateString('fr-FR', {
day: 'numeric',
month: 'short',
})}
</span>
{new Date(task.dueDate) < new Date() &&
task.status !== 'completed' && (
<span className="ml-2 text-red-600 font-semibold">
En retard
</span>
)}
</div>
</div>
)}
</div>
))}

{columnTasks.length === 0 && (
<div className="text-center py-8 text-gray-400">
<p className="text-sm">Aucune tâche</p>
<p className="text-xs mt-1">Glissez-déposez une tâche ici</p>
</div>
)}
</div>
</div>
</div>
);
})}
</div>

{/* Task Modal */}
{showModal && (
<TaskModal
task={selectedTask}
projects={projects}
onClose={() => {
setShowModal(false);
setSelectedTask(null);
}}
onSave={() => {
setShowModal(false);
setSelectedTask(null);
loadData();
}}
/>
)}
</div>
);
};

export default Kanban;
