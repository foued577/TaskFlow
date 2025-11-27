import React, { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { usersAPI, teamsAPI } from "../utils/api";
import { toast } from "react-toastify";

const TaskModal = ({ task, projects, onClose, onSave }) => {
const isEdit = Boolean(task);

const [teams, setTeams] = useState([]);

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

// Load teams for assignment
useEffect(() => {
const loadTeams = async () => {
try {
const res = await teamsAPI.getAll();
setTeams(res.data.data);
} catch (err) {
toast.error("Erreur lors du chargement des équipes");
}
};
loadTeams();
}, []);

// Load task into form
useEffect(() => {
if (task) {
setFormData({
title: task.title || "",
description: task.description || "",
projectId: task.project?._id || "",
assignedTo: task.assignedTo?.map((u) => u._id) || [],
dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
priority: task.priority || "medium",
status: task.status || "not_started",
tags: task.tags?.join(", ") || "",
subtasks: task.subtasks || [],
});
}
}, [task]);

const updateField = (field, value) => {
setFormData((prev) => ({ ...prev, [field]: value }));
};

// SUBTASKS
const addSubtask = () => {
setFormData((prev) => ({
...prev,
subtasks: [...prev.subtasks, { title: "", isCompleted: false }],
}));
};

const updateSubtask = (index, key, value) => {
const newList = [...formData.subtasks];
newList[index][key] = value;
setFormData((prev) => ({ ...prev, subtasks: newList }));
};

const removeSubtask = (index) => {
const newList = formData.subtasks.filter((_, i) => i !== index);
setFormData((prev) => ({ ...prev, subtasks: newList }));
};

const handleSubmit = async (e) => {
e.preventDefault();

if (!formData.title.trim()) {
toast.error("Le titre est obligatoire");
return;
}

const payload = {
...formData,
tags: formData.tags
? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
: [],
};

await onSave(payload);
};

return (
<div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">

{/* HEADER */}
<div className="flex items-center justify-between mb-4">
<h2 className="text-xl font-bold">
{isEdit ? "Modifier la tâche" : "Nouvelle tâche"}
</h2>
<button
onClick={onClose}
className="text-gray-400 hover:text-gray-600"
>
<X className="w-6 h-6" />
</button>
</div>

<form onSubmit={handleSubmit} className="space-y-4">

{/* TITLE */}
<div>
<label className="block text-sm mb-2 font-medium">Titre</label>
<input
type="text"
className="input"
value={formData.title}
onChange={(e) => updateField("title", e.target.value)}
required
/>
</div>

{/* PROJECT */}
<div>
<label className="block text-sm font-medium mb-2">Projet</label>
<select
className="input"
value={formData.projectId}
onChange={(e) => updateField("projectId", e.target.value)}
>
<option value="">Sélectionner...</option>
{projects.map((p) => (
<option key={p._id} value={p._id}>
{p.name}
</option>
))}
</select>
</div>

{/* ASSIGNED USERS */}
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
const exists = formData.assignedTo.includes(
m.user._id
);
updateField(
"assignedTo",
exists
? formData.assignedTo.filter(
(id) => id !== m.user._id
)
: [...formData.assignedTo, m.user._id]
);
}}
/>

<span>
{m.user.firstName} {m.user.lastName}
</span>
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
onChange={(e) => updateField("description", e.target.value)}
/>
</div>

{/* DUE DATE */}
<div>
<label className="block text-sm mb-2 font-medium">
Date limite
</label>
<input
type="date"
className="input"
value={formData.dueDate}
onChange={(e) => updateField("dueDate", e.target.value)}
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
onChange={(e) => updateField("priority", e.target.value)}
>
<option value="low">Basse</option>
<option value="medium">Moyenne</option>
<option value="high">Haute</option>
<option value="urgent">Urgente</option>
</select>
</div>

{/* STATUS */}
<div>
<label className="block text-sm font-medium mb-2">Statut</label>
<select
className="input"
value={formData.status}
onChange={(e) => updateField("status", e.target.value)}
>
<option value="not_started">Non commencée</option>
<option value="in_progress">En cours</option>
<option value="completed">Terminée</option>
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
onChange={(e) => updateField("tags", e.target.value)}
placeholder="frontend, urgent, design"
/>
</div>

{/* SUBTASKS */}
<div>
<label className="block text-sm font-medium mb-2">
Sous-tâches
</label>

<div className="space-y-2">
{formData.subtasks.map((st, index) => (
<div
key={index}
className="flex items-center gap-2 border rounded-lg p-2"
>
<input
type="text"
className="input flex-1"
value={st.title}
onChange={(e) =>
updateSubtask(index, "title", e.target.value)
}
placeholder={`Sous-tâche ${index + 1}`}
/>

<button
type="button"
className="p-2 text-red-500 hover:bg-red-100 rounded-lg"
onClick={() => removeSubtask(index)}
>
<Trash2 className="w-4 h-4" />
</button>
</div>
))}
</div>

<button
type="button"
onClick={addSubtask}
className="btn btn-light mt-3 flex items-center"
>
<Plus className="w-4 h-4 mr-2" /> Ajouter une sous-tâche
</button>
</div>

{/* ACTIONS */}
<div className="flex gap-4 pt-4">
<button type="submit" className="flex-1 btn btn-primary">
{isEdit ? "Mettre à jour" : "Créer la tâche"}
</button>

<button
type="button"
onClick={onClose}
className="flex-1 btn btn-secondary"
>
Annuler
</button>
</div>

</form>
</div>
</div>
);
};

export default TaskModal;
