// 🚀 FILE: src/pages/Tasks.js — VERSION FINALE & COMPLÈTE

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tasksAPI, projectsAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
CheckSquare,
Plus,
Filter,
Calendar as CalendarIcon,
AlertCircle,
X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../components/Loading";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Tasks = () => {
const location = useLocation();
const { user } = useAuth();

const isAdmin = !user?.role || user.role === "admin";

const [tasks, setTasks] = useState([]);
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

const [showModal, setShowModal] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);

const [taskView, setTaskView] = useState("all");
const [filters, setFilters] = useState({
projectId: "",
status: "",
priority: "",
});
const [isOverdueMode, setIsOverdueMode] = useState(false);

const [formData, setFormData] = useState({
title: "",
description: "",
projectId: "",
dueDate: "",
priority: "medium",
status: "not_started",
subtasks: [],
comments: [],
});

useEffect(() => {
const params = new URLSearchParams(location.search);
const statusParam = params.get("status");
setIsOverdueMode(statusParam === "overdue");
setFilters({
projectId: "",
status: statusParam && statusParam !== "overdue" ? statusParam : "",
priority: "",
});
}, [location.search]);

useEffect(() => {
loadData();
}, [filters, isOverdueMode, taskView]);

const loadData = async () => {
try {
setLoading(true);
let query = { ...filters };
Object.keys(query).forEach((key) => {
if (!query[key]) delete query[key];
});

if (taskView === "assigned") query.filterType = "assignedToMe";
if (taskView === "created_not_assigned")
query.filterType = "createdByMeNotAssignedToMe";

const tasksRes = await tasksAPI.getAll(query);
const projectsRes = await projectsAPI.getAll();

let fetchedTasks = tasksRes.data.data;
if (isOverdueMode) {
fetchedTasks = fetchedTasks.filter(
(t) =>
t.dueDate &&
new Date(t.dueDate) < new Date() &&
t.status !== "completed"
);
}

fetchedTasks = fetchedTasks.sort((a, b) => {
const dateA = a.dueDate ? new Date(a.dueDate) : null;
const dateB = b.dueDate ? new Date(b.dueDate) : null;
if (dateA && dateB) return dateA - dateB;
if (dateA && !dateB) return -1;
if (!dateA && dateB) return 1;
return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
});

setTasks(fetchedTasks);
setProjects(projectsRes.data.data);
} catch {
toast.error("Erreur lors du chargement des tâches");
} finally {
setLoading(false);
}
};

const handleTaskClick = (task) => {
if (!isAdmin) return;
setSelectedTask(task);
setFormData({
title: task.title,
description: task.description || "",
projectId: task.project?._id || "",
dueDate: task.dueDate
? format(new Date(task.dueDate), "yyyy-MM-dd")
: "",
priority: task.priority || "medium",
status: task.status || "not_started",
subtasks: task.subtasks || [],
comments: task.comments || [],
});
setShowModal(true);
};

const handleTaskUpdate = async () => {
await loadData();
setShowModal(false);
setSelectedTask(null);
};

const handleSubmit = async (e) => {
e.preventDefault();
if (!isAdmin) {
toast.error("Vous n'avez pas les droits");
return;
}
try {
const payload = { ...formData };
if (selectedTask) {
await tasksAPI.update(selectedTask._id, payload);
toast.success("Tâche mise à jour");
} else {
await tasksAPI.create(payload);
toast.success("Tâche créée");
}
handleTaskUpdate();
} catch {
toast.error("Erreur lors de la sauvegarde");
}
};

const addSubtask = () => {
setFormData({
...formData,
subtasks: [...formData.subtasks, { title: "", isCompleted: false }],
});
};

const updateSubtask = (index, field, value) => {
const newSubtasks = [...formData.subtasks];
newSubtasks[index][field] = value;
setFormData({ ...formData, subtasks: newSubtasks });
};

const removeSubtask = (index) => {
const newSubtasks = formData.subtasks.filter((_, i) => i !== index);
setFormData({ ...formData, subtasks: newSubtasks });
};

const addComment = (text) => {
if (!text.trim()) return;
const newComment = {
text,
author: `${user.firstName} ${user.lastName}`,
createdAt: new Date(),
};
setFormData({
...formData,
comments: [...formData.comments, newComment],
});
};

const getPriorityColor = (priority) =>
({
low: "bg-blue-100 text-blue-800",
medium: "bg-yellow-100 text-yellow-800",
high: "bg-orange-100 text-orange-800",
urgent: "bg-red-100 text-red-800",
}[priority] || "bg-gray-100 text-gray-800");

const getStatusColor = (status) =>
({
not_started: "bg-gray-100 text-gray-800",
in_progress: "bg-blue-100 text-blue-800",
completed: "bg-green-100 text-green-800",
overdue: "bg-red-100 text-red-800",
}[status] || "bg-gray-100 text-gray-800");

const getStatusLabel = (status) =>
({
not_started: "Non démarrée",
in_progress: "En cours",
completed: "Terminée",
overdue: "En retard",
}[status] || status);

if (loading) return <Loading fullScreen={false} />;

return (
<div>
{/* HEADER */}
<div className="flex items-center justify-between mb-6">
<h1 className="text-2xl font-bold text-gray-900">
{isOverdueMode ? "Tâches en retard" : "Tâches"}
</h1>
{isAdmin && (
<button
onClick={() => {
setSelectedTask(null);
setFormData({
title: "",
description: "",
projectId: "",
dueDate: "",
priority: "medium",
status: "not_started",
subtasks: [],
comments: [],
});
setShowModal(true);
}}
className="btn btn-primary flex items-center"
>
<Plus className="w-5 h-5 mr-2" /> Nouvelle tâche
</button>
)}
</div>

{/* FILTERS */}
{!isOverdueMode && (
<div className="card mb-6 p-4">
<div className="flex items-center mb-4">
<Filter className="w-5 h-5 mr-2 text-gray-600" />
<h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
</div>
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
<div>
<label className="block text-sm mb-2">Statut</label>
<select
value={filters.status}
onChange={(e) =>
setFilters({ ...filters, status: e.target.value })
}
className="input"
>
<option value="">Tous</option>
<option value="not_started">Non démarrée</option>
<option value="in_progress">En cours</option>
<option value="completed">Terminée</option>
<option value="overdue">En retard</option>
</select>
</div>
</div>
</div>
)}

{/* LIST */}
{tasks.length === 0 ? (
<div className="card text-center py-12">
<CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
<h3 className="text-lg font-medium">Aucune tâche</h3>
</div>
) : (
<div className="space-y-4">
<AnimatePresence>
{tasks.map((task) => {
const isOverdue =
task.dueDate &&
new Date(task.dueDate) < new Date() &&
task.status !== "completed";
return (
<motion.div
key={task._id}
initial={{ opacity: 0, y: 10 }}
animate={{ opacity: 1, y: 0 }}
exit={{ opacity: 0 }}
transition={{ duration: 0.2 }}
onClick={() => handleTaskClick(task)}
className="card hover:shadow-lg cursor-pointer"
>
<div className="flex items-start justify-between">
<div>
<h3 className="text-lg font-bold">{task.title}</h3>
<p className="text-sm text-gray-600">
{task.project?.name}
</p>
<div className="flex gap-2 mt-3">
<span
className={`badge ${getStatusColor(
isOverdue ? "overdue" : task.status
)}`}
>
{getStatusLabel(isOverdue ? "overdue" : task.status)}
</span>
<span
className={`badge ${getPriorityColor(task.priority)}`}
>
{task.priority}
</span>
</div>
</div>
</div>
</motion.div>
);
})}
</AnimatePresence>
</div>
)}

{/* MODAL */}
{showModal && (
<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
<div className="flex items-center justify-between mb-4">
<h2 className="text-xl font-bold">
{selectedTask ? "Modifier la tâche" : "Nouvelle tâche"}
</h2>
<button
onClick={() => setShowModal(false)}
className="text-gray-400 hover:text-gray-600"
>
<X className="w-6 h-6" />
</button>
</div>

<form onSubmit={handleSubmit} className="space-y-4">
<input
type="text"
placeholder="Titre"
className="input"
value={formData.title}
onChange={(e) =>
setFormData({ ...formData, title: e.target.value })
}
required
/>
<textarea
placeholder="Description"
className="input"
rows={3}
value={formData.description}
onChange={(e) =>
setFormData({ ...formData, description: e.target.value })
}
/>
<select
className="input"
value={formData.projectId}
onChange={(e) =>
setFormData({ ...formData, projectId: e.target.value })
}
>
<option value="">Sélectionner un projet</option>
{projects.map((p) => (
<option key={p._id} value={p._id}>
{p.name}
</option>
))}
</select>

{/* SOUS-TÂCHES */}
<div>
<label className="block text-sm font-medium mb-2">
Sous-tâches
</label>
{formData.subtasks.map((sub, i) => (
<div key={i} className="flex items-center gap-2 mb-2">
<input
type="text"
className="input flex-1"
placeholder={`Sous-tâche ${i + 1}`}
value={sub.title}
onChange={(e) =>
updateSubtask(i, "title", e.target.value)
}
/>
<button
type="button"
onClick={() => removeSubtask(i)}
className="text-red-500 hover:text-red-700"
>
✕
</button>
</div>
))}
<button
type="button"
onClick={addSubtask}
className="btn btn-light mt-2"
>
+ Ajouter une sous-tâche
</button>
</div>

{/* COMMENTAIRES */}
<div>
<label className="block text-sm font-medium mb-2">
Commentaires
</label>
{formData.comments.length === 0 && (
<p className="text-sm text-gray-500 mb-2">
Aucun commentaire
</p>
)}
{formData.comments.map((c, i) => (
<div key={i} className="text-sm bg-gray-50 p-2 rounded mb-1">
<span className="font-semibold">{c.author}</span> —{" "}
{format(new Date(c.createdAt), "dd MMM yyyy", { locale: fr })}
<p>{c.text}</p>
</div>
))}
<input
type="text"
placeholder="Ajouter un commentaire..."
className="input mt-2"
onKeyDown={(e) => {
if (e.key === "Enter") {
e.preventDefault();
addComment(e.target.value);
e.target.value = "";
}
}}
/>
</div>

<button type="submit" className="btn btn-primary w-full">
{selectedTask ? "Mettre à jour" : "Créer la tâche"}
</button>
</form>
</div>
</div>
)}
</div>
);
};

export default Tasks;
