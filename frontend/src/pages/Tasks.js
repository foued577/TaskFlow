// 🚀 FILE: src/pages/Tasks.js — VERSION FINALE & COMPLÈTE

import React, { useState, useEffect } from "react";
import {
tasksAPI,
projectsAPI,
teamsAPI,
commentsAPI,
} from "../utils/api";
import { toast } from "react-toastify";
import {
Plus,
Edit2,
Trash2,
X,
Calendar as CalendarIcon,
Users,
CheckSquare,
AlertCircle,
} from "lucide-react";
import Loading from "../components/Loading";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const Tasks = () => {
const { user } = useAuth();
const isAdmin = !user?.role || user.role === "admin";

const [loading, setLoading] = useState(true);
const [tasks, setTasks] = useState([]);
const [projects, setProjects] = useState([]);
const [teams, setTeams] = useState([]);

// === MODAL ===
const [showModal, setShowModal] = useState(false);
const [modalMode, setModalMode] = useState("create");
const [selectedTask, setSelectedTask] = useState(null);

const location = useLocation();
const urlParams = new URLSearchParams(location.search);
const urlStatus = urlParams.get("status"); // not_started | in_progress | completed | overdue

// === FORM DATA ===
const [formData, setFormData] = useState({
title: "",
description: "",
projectId: "",
assignedTo: [],
dueDate: "",
priority: "medium",
status: "not_started",
tags: "",
subtasks: [],
});

// COMMENTAIRES
const [comments, setComments] = useState([]);
const [newComment, setNewComment] = useState("");

// SUBTASK TEMP
const [newSubtask, setNewSubtask] = useState("");

// --------------------------
// LOAD DATA
// --------------------------
useEffect(() => {
loadData();
}, [urlStatus]);

const loadData = async () => {
try {
const filter = urlStatus ? { status: urlStatus } : {};

if (urlStatus === "overdue") {
const overdue = await tasksAPI.getOverdue();
setTasks(overdue.data.data);
} else {
const tasksRes = await tasksAPI.getAll(filter);
setTasks(tasksRes.data.data);
}

const [projectsRes, teamsRes] = await Promise.all([
projectsAPI.getAll(),
teamsAPI.getAll(),
]);

setProjects(projectsRes.data.data);
setTeams(teamsRes.data.data);
} catch (error) {
toast.error("Erreur lors du chargement des tâches");
} finally {
setLoading(false);
}
};

// --------------------------
// OPEN CREATE MODAL
// --------------------------
const openCreateModal = () => {
if (!isAdmin) return toast.error("Accès refusé");

setModalMode("create");
resetForm();
setComments([]);
setShowModal(true);
};

// --------------------------
// OPEN EDIT MODAL
// --------------------------
const openEditModal = async (task) => {
if (!isAdmin) return toast.error("Accès refusé");

setModalMode("edit");
setSelectedTask(task);

setFormData({
title: task.title,
description: task.description,
projectId: task.project?._id,
assignedTo: task.assignedTo?.map((u) => u._id),
dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
priority: task.priority,
status: task.status,
tags: task.tags?.join(", ") || "",
subtasks: task.subtasks || [],
});

// Load comments
const c = await commentsAPI.getForTask(task._id);
setComments(c.data.data);

setShowModal(true);
};

const resetForm = () => {
setFormData({
title: "",
description: "",
projectId: "",
assignedTo: [],
dueDate: "",
priority: "medium",
status: "not_started",
tags: "",
subtasks: [],
});
};

// --------------------------
// SAVE TASK
// --------------------------
const handleSubmit = async (e) => {
e.preventDefault();
if (!isAdmin) return;

try {
const payload = {
...formData,
tags: formData.tags
? formData.tags.split(",").map((t) => t.trim())
: [],
};

if (modalMode === "create") {
await tasksAPI.create(payload);
toast.success("Tâche créée");
} else {
await tasksAPI.update(selectedTask._id, payload);
toast.success("Tâche mise à jour");
}

setShowModal(false);
loadData();
} catch (error) {
toast.error("Erreur lors de l’enregistrement");
}
};

// --------------------------
// DELETE TASK
// --------------------------
const deleteTask = async (id) => {
if (!isAdmin) return;

if (!window.confirm("Supprimer cette tâche ?")) return;

await tasksAPI.delete(id);
toast.success("Tâche supprimée");
loadData();
};

// --------------------------
// ADD SUBTASK
// --------------------------
const addSubtask = () => {
if (!newSubtask.trim()) return;

setFormData((prev) => ({
...prev,
subtasks: [...prev.subtasks, { title: newSubtask, isCompleted: false }],
}));
setNewSubtask("");
};

// --------------------------
// DELETE SUBTASK
// --------------------------
const deleteSubtask = (index) => {
setFormData((prev) => ({
...prev,
subtasks: prev.subtasks.filter((_, i) => i !== index),
}));
};

// --------------------------
// ADD COMMENT
// --------------------------
const addComment = async () => {
if (!newComment.trim()) return;

const res = await commentsAPI.create({
content: newComment,
taskId: selectedTask._id,
});

setComments([...comments, res.data.data]);
setNewComment("");
};

// BADGES
const getPriorityColor = (p) =>
({
low: "bg-blue-100 text-blue-800",
medium: "bg-yellow-100 text-yellow-800",
high: "bg-orange-100 text-orange-800",
urgent: "bg-red-100 text-red-800",
}[p]);

const getStatusColor = (s) =>
({
not_started: "bg-gray-100 text-gray-800",
in_progress: "bg-blue-100 text-blue-800",
completed: "bg-green-100 text-green-800",
overdue: "bg-red-100 text-red-800",
}[s]);

if (loading) return <Loading fullScreen={false} />;

// ========================================================
// RENDER
// ========================================================

return (
<div className="space-y-6">

{/* HEADER */}
<div className="flex items-center justify-between">
<h1 className="text-2xl font-bold">
{urlStatus === "overdue" ? "Tâches en retard" : "Tâches"}
</h1>

{isAdmin && (
<button onClick={openCreateModal} className="btn btn-primary flex items-center">
<Plus className="w-5 h-5 mr-2" /> Nouvelle tâche
</button>
)}
</div>

{/* LIST */}
{tasks.length === 0 ? (
<div className="card text-center py-10">
<CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
<p className="text-gray-600">Aucune tâche trouvée</p>
</div>
) : (
<div className="space-y-4">
{tasks.map((task) => {
const overdue =
task.dueDate &&
new Date(task.dueDate) < new Date() &&
task.status !== "completed";

return (
<div
key={task._id}
className="p-4 border rounded-lg hover:border-primary-300 transition"
>
{/* HEADER */}
<div className="flex items-start justify-between mb-2">
<div>
<h3 className="text-lg font-bold">{task.title}</h3>

{task.project && (
<p className="text-sm text-gray-500">
Projet : <span>{task.project.name}</span>
</p>
)}
</div>

{isAdmin && (
<div className="flex space-x-1">
<button
onClick={() => openEditModal(task)}
className="p-2 text-gray-400 hover:text-gray-600"
>
<Edit2 className="w-4 h-4" />
</button>
<button
onClick={() => deleteTask(task._id)}
className="p-2 text-red-400 hover:text-red-600"
>
<Trash2 className="w-4 h-4" />
</button>
</div>
)}
</div>

{/* STATUS & PRIORITY */}
<div className="flex gap-2 mb-3">
<span className={`badge ${getPriorityColor(task.priority)}`}>
{task.priority}
</span>

<span
className={`badge ${
overdue
? "bg-red-100 text-red-800"
: getStatusColor(task.status)
}`}
>
{overdue ? "En retard" : task.status.replace("_", " ")}
</span>
</div>

{/* USERS */}
{task.assignedTo.length > 0 && (
<div className="flex items-center gap-2 mb-3">
{task.assignedTo.map((u) => (
<span
key={u._id}
className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-800 text-xs font-semibold"
>
{u.firstName[0]}
{u.lastName[0]}
</span>
))}
</div>
)}

{/* DUE DATE */}
{task.dueDate && (
<p className="text-sm text-gray-500 flex items-center">
<CalendarIcon className="w-4 h-4 mr-1" />
{formatDistanceToNow(new Date(task.dueDate), {
addSuffix: true,
locale: fr,
})}
</p>
)}
</div>
);
})}
</div>
)}

{/* =========================================== */}
{/* TASK MODAL */}
{/* =========================================== */}
{showModal && (
<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">

{/* HEADER */}
<div className="flex items-center justify-between mb-4">
<h2 className="text-xl font-bold">
{modalMode === "create" ? "Nouvelle tâche" : "Modifier la tâche"}
</h2>
<button
onClick={() => setShowModal(false)}
className="text-gray-400 hover:text-gray-600"
>
<X className="w-6 h-6" />
</button>
</div>

{/* FORM */}
<form onSubmit={handleSubmit} className="space-y-4">

{/* TITLE */}
<div>
<label className="block text-sm font-medium mb-2">Titre</label>
<input
type="text"
className="input"
value={formData.title}
onChange={(e) =>
setFormData({ ...formData, title: e.target.value })
}
required
/>
</div>

{/* PROJECT */}
<div>
<label className="block text-sm font-medium mb-2">
Projet
</label>
<select
className="input"
value={formData.projectId}
onChange={(e) =>
setFormData({ ...formData, projectId: e.target.value })
}
>
<option value="">Sélectionner...</option>
{projects.map((p) => (
<option key={p._id} value={p._id}>
{p.name}
</option>
))}
</select>
</div>

{/* USERS */}
<div>
<label className="block text-sm font-medium mb-2">
Utilisateurs assignés
</label>
<div className="border p-3 rounded-lg max-h-40 overflow-y-auto space-y-1">
{teams.map((team) =>
team.members.map((m) => (
<label
key={m.user._id}
className="flex items-center gap-2 text-sm"
>
<input
type="checkbox"
checked={formData.assignedTo.includes(m.user._id)}
onChange={() => {
setFormData((prev) => {
const exists = prev.assignedTo.includes(
m.user._id
);
return {
...prev,
assignedTo: exists
? prev.assignedTo.filter(
(id) => id !== m.user._id
)
: [...prev.assignedTo, m.user._id],
};
});
}}
/>
{m.user.firstName} {m.user.lastName}
</label>
))
)}
</div>
</div>

{/* DESCRIPTION */}
<div>
<label className="block text-sm font-medium mb-2">
Description
</label>
<textarea
className="input"
rows={3}
value={formData.description}
onChange={(e) =>
setFormData({ ...formData, description: e.target.value })
}
/>
</div>

{/* DUE DATE */}
<div>
<label className="block text-sm font-medium mb-2">
Date limite
</label>
<input
type="date"
className="input"
value={formData.dueDate}
onChange={(e) =>
setFormData({ ...formData, dueDate: e.target.value })
}
/>
</div>

{/* PRIORITY */}
<div>
<label className="block text-sm font-medium mb-2">
Priorité
</label>
<select
className="input"
value={formData.priority}
onChange={(e) =>
setFormData({ ...formData, priority: e.target.value })
}
>
<option value="low">Basse</option>
<option value="medium">Moyenne</option>
<option value="high">Haute</option>
<option value="urgent">Urgente</option>
</select>
</div>

{/* STATUS */}
<div>
<label className="block text-sm font-medium mb-2">
Statut
</label>
<select
className="input"
value={formData.status}
onChange={(e) =>
setFormData({ ...formData, status: e.target.value })
}
>
<option value="not_started">Non démarrée</option>
<option value="in_progress">En cours</option>
<option value="completed">Terminée</option>
<option value="overdue">En retard</option>
</select>
</div>

{/* TAGS */}
<div>
<label className="block text-sm font-medium mb-2">
Tags (séparés par des virgules)
</label>
<input
type="text"
className="input"
value={formData.tags}
onChange={(e) =>
setFormData({ ...formData, tags: e.target.value })
}
/>
</div>

{/* SUBTASKS */}
<div className="border rounded-lg p-3">
<label className="block text-sm font-medium mb-2">
Sous-tâches
</label>

{/* Add subtask */}
<div className="flex gap-2 mb-3">
<input
type="text"
className="input flex-1"
placeholder="Nouvelle sous-tâche"
value={newSubtask}
onChange={(e) => setNewSubtask(e.target.value)}
/>
<button
type="button"
className="btn btn-primary"
onClick={addSubtask}
>
+
</button>
</div>

{/* List subtasks */}
<div className="space-y-2">
{formData.subtasks.map((st, i) => (
<div
key={i}
className="flex items-center justify-between bg-gray-50 p-2 rounded"
>
<span>{st.title}</span>

<button
type="button"
className="text-red-500"
onClick={() => deleteSubtask(i)}
>
<Trash2 className="w-4 h-4" />
</button>
</div>
))}
</div>
</div>

{/* COMMENTS (edit mode only) */}
{modalMode === "edit" && (
<div className="border rounded-lg p-3">
<label className="block text-sm font-medium mb-2">
Commentaires
</label>

<div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
{comments.map((c) => (
<div key={c._id} className="p-2 bg-gray-50 rounded">
<p className="text-sm text-gray-800">{c.content}</p>
<span className="text-xs text-gray-500">
{format(new Date(c.createdAt), "dd MMM yyyy HH:mm", {
locale: fr,
})}
</span>
</div>
))}
</div>

<div className="flex gap-2">
<input
type="text"
className="input flex-1"
placeholder="Votre commentaire..."
value={newComment}
onChange={(e) => setNewComment(e.target.value)}
/>
<button
type="button"
className="btn btn-primary"
onClick={addComment}
>
Envoyer
</button>
</div>
</div>
)}

{/* BUTTONS */}
<div className="flex gap-4 pt-4">
<button type="submit" className="flex-1 btn btn-primary">
{modalMode === "create"
? "Créer la tâche"
: "Mettre à jour"}
</button>

<button
type="button"
className="flex-1 btn btn-secondary"
onClick={() => setShowModal(false)}
>
Annuler
</button>
</div>
</form>
</div>
</div>
)}

</div>
);
};

export default Tasks;
