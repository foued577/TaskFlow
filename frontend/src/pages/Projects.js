import React, { useState, useEffect } from 'react';
import { projectsAPI, teamsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import {
FolderKanban,
Plus,
Edit2,
Trash2,
X,
Calendar as CalendarIcon,
Users,
} from 'lucide-react';
import Loading from '../components/Loading';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
const { user } = useAuth();

// Admin backend = admin global
const isAdmin = !user?.role || user.role === "admin";

const [projects, setProjects] = useState([]);
const [teams, setTeams] = useState([]);
const [loading, setLoading] = useState(true);

// ✅ ✅ ✅ AJOUT RECHERCHE
const [search, setSearch] = useState("");

const [showModal, setShowModal] = useState(false);
const [modalMode, setModalMode] = useState("create");
const [selectedProject, setSelectedProject] = useState(null);

const [formData, setFormData] = useState({
name: "",
description: "",
teamIds: [],
startDate: "",
endDate: "",
priority: "medium",
color: "#10B981",
tags: "",
});

useEffect(() => {
loadData();
}, []);

// Charger projets + teams visibles selon backend
const loadData = async () => {
try {
const [projectsRes, teamsRes] = await Promise.all([
projectsAPI.getAll(),
teamsAPI.getAll(),
]);

setProjects(projectsRes.data.data);
setTeams(teamsRes.data.data);
} catch (error) {
toast.error("Erreur lors du chargement");
} finally {
setLoading(false);
}
};

const resetForm = () => {
setFormData({
name: "",
description: "",
teamIds: [],
startDate: "",
endDate: "",
priority: "medium",
color: "#10B981",
tags: "",
});
};

const openCreateModal = () => {
if (!isAdmin) {
toast.error("Vous n’avez pas les droits pour créer un projet");
return;
}
setModalMode("create");
resetForm();
setShowModal(true);
};

const openEditModal = (project) => {
if (!isAdmin) {
toast.error("Vous n’avez pas les droits pour modifier un projet");
return;
}

setModalMode("edit");
setSelectedProject(project);

const teamIds = project.teams?.map(t => t._id || t) || [];

setFormData({
name: project.name,
description: project.description || "",
teamIds,
startDate: project.startDate
? format(new Date(project.startDate), "yyyy-MM-dd")
: "",
endDate: project.endDate
? format(new Date(project.endDate), "yyyy-MM-dd")
: "",
priority: project.priority || "medium",
color: project.color || "#10B981",
tags: Array.isArray(project.tags)
? project.tags.join(", ")
: "",
});

setShowModal(true);
};

// Toggle team selection
const toggleTeamSelection = (teamId) => {
setFormData((prev) => ({
...prev,
teamIds: prev.teamIds.includes(teamId)
? prev.teamIds.filter(id => id !== teamId)
: [...prev.teamIds, teamId]
}));
};

// Create / update project
const handleSubmit = async (e) => {
e.preventDefault();

if (!isAdmin) {
toast.error("Vous n’avez pas les droits");
return;
}

if (!formData.name.trim()) {
toast.error("Le nom est obligatoire");
return;
}

if (formData.teamIds.length === 0) {
toast.error("Sélectionnez au moins une équipe");
return;
}

try {
const data = {
name: formData.name,
description: formData.description,
teamIds: formData.teamIds,
startDate: formData.startDate || null,
endDate: formData.endDate || null,
priority: formData.priority,
color: formData.color,
tags: formData.tags
? formData.tags.split(",").map(t => t.trim())
: [],
};

if (modalMode === "create") {
await projectsAPI.create(data);
toast.success("Projet créé");
} else {
await projectsAPI.update(selectedProject._id, data);
toast.success("Projet mis à jour");
}

setShowModal(false);
resetForm();
loadData();
} catch (error) {
toast.error(error.response?.data?.message || "Erreur serveur");
}
};

// Delete project
const deleteProject = async (id) => {
if (!isAdmin) {
toast.error("Vous n’avez pas les droits");
return;
}

if (!window.confirm("Supprimer ce projet ?")) return;

try {
await projectsAPI.delete(id);
toast.success("Projet supprimé");
loadData();
} catch (error) {
toast.error("Erreur lors de la suppression");
}
};

const getPriorityColor = (priority) => {
const colors = {
low: "bg-blue-100 text-blue-800",
medium: "bg-yellow-100 text-yellow-800",
high: "bg-orange-100 text-orange-800",
urgent: "bg-red-100 text-red-800",
};
return colors[priority] || colors.medium;
};

// ✅ ✅ ✅ FILTRAGE TEMPS RÉEL PAR NOM
const filteredProjects = projects.filter(project =>
project.name.toLowerCase().includes(search.toLowerCase())
);

if (loading) return <Loading fullScreen={false} />;

return (
<div>
{/* HEADER */}
<div className="flex items-center justify-between mb-6">
<h1 className="text-2xl font-bold">Projets</h1>

<div className="flex items-center gap-3">
{/* ✅ ✅ ✅ INPUT RECHERCHE */}
<input
type="text"
placeholder="Rechercher un projet..."
className="input w-64"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>

{isAdmin && (
<button onClick={openCreateModal} className="btn btn-primary flex items-center">
<Plus className="w-5 h-5 mr-2" />
Nouveau projet
</button>
)}
</div>
</div>

{/* LISTE DES PROJETS */}
{filteredProjects.length === 0 ? (
<div className="card text-center py-12">
<FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300" />
<h3 className="text-lg font-medium">Aucun projet</h3>
</div>
) : (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{filteredProjects.map((project) => {
const projectTeams = project.teams || [];

return (
<div key={project._id} className="card hover:shadow-lg transition-shadow">

{/* HEADER */}
<div className="flex items-start justify-between mb-3">
<div className="flex items-center">
<div
className="w-3 h-12 rounded-l-lg mr-3"
style={{ backgroundColor: project.color }}
/>
<div>
<h3 className="text-lg font-bold">{project.name}</h3>

{/* TEAMS */}
{projectTeams.length > 0 && (
<div className="flex items-center flex-wrap gap-1 mt-1">
<Users className="w-3 h-3 text-gray-400 mr-1" />
{projectTeams.slice(0, 2).map((team) => (
<span key={team._id} className="badge bg-gray-100 text-gray-700 text-xs">
{team.name}
</span>
))}
{projectTeams.length > 2 && (
<span className="badge bg-gray-100 text-gray-500 text-xs">
+{projectTeams.length - 2}
</span>
)}
</div>
)}
</div>
</div>

{isAdmin && (
<div className="flex space-x-1">
<button
onClick={() => openEditModal(project)}
className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
>
<Edit2 className="w-4 h-4" />
</button>

<button
onClick={() => deleteProject(project._id)}
className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-50"
>
<Trash2 className="w-4 h-4" />
</button>
</div>
)}
</div>

{/* DESCRIPTION */}
{project.description && (
<p className="text-sm text-gray-600 mb-4 line-clamp-2">
{project.description}
</p>
)}

{/* PRIORITÉ */}
<span className={`badge ${getPriorityColor(project.priority)} mb-3`}>
{project.priority}
</span>

{/* DATES */}
{(project.startDate || project.endDate) && (
<div className="border-t pt-3 text-sm text-gray-600 flex items-center">
<CalendarIcon className="w-4 h-4 mr-2" />
{project.startDate &&
format(new Date(project.startDate), "dd MMM", { locale: fr })}
{project.startDate && project.endDate && " - "}
{project.endDate &&
format(new Date(project.endDate), "dd MMM yyyy", { locale: fr })}
</div>
)}

{/* TAGS */}
{project.tags?.length > 0 && (
<div className="flex flex-wrap gap-1 mt-3">
{project.tags.map((tag, i) => (
<span key={i} className="badge bg-gray-100 text-gray-700 text-xs">
{tag}
</span>
))}
</div>
)}
</div>
);
})}
</div>
)}

{/* 🔵 MODAL CREATE / EDIT */}
{showModal && (
<div className="fixed inset-0 bg-black bg-opacity-50 z-50 p-4 flex items-center justify-center">
<div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto">

{/* HEADER */}
<div className="flex items-center justify-between mb-4">
<h2 className="text-xl font-bold">
{modalMode === "create" ? "Nouveau projet" : "Modifier le projet"}
</h2>
<button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
<X className="w-6 h-6" />
</button>
</div>

{/* FORM */}
<form onSubmit={handleSubmit} className="space-y-4">

{/* NAME */}
<div>
<label className="block text-sm font-medium mb-2">Nom</label>
<input
type="text"
value={formData.name}
onChange={(e) => setFormData({ ...formData, name: e.target.value })}
className="input"
required
/>
</div>

{/* TEAMS */}
<div>
<label className="block text-sm font-medium mb-2">Équipes</label>

<div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
{teams.map((team) => (
<label key={team._id} className="flex items-center space-x-2 text-sm">
<input
type="checkbox"
checked={formData.teamIds.includes(team._id)}
onChange={() => toggleTeamSelection(team._id)}
/>
<span>{team.name}</span>
</label>
))}
</div>
</div>

{/* DESCRIPTION */}
<div>
<label className="block text-sm font-medium mb-2">Description</label>
<textarea
value={formData.description}
onChange={(e) => setFormData({ ...formData, description: e.target.value })}
className="input"
rows={3}
/>
</div>

{/* DATES */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label className="block text-sm font-medium mb-2">Début</label>
<input
type="date"
value={formData.startDate}
onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
className="input"
/>
</div>

<div>
<label className="block text-sm font-medium mb-2">Fin</label>
<input
type="date"
value={formData.endDate}
onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
className="input"
/>
</div>
</div>

{/* PRIORITY + COLOR */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label className="block text-sm font-medium mb-2">Priorité</label>
<select
value={formData.priority}
onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
className="input"
>
<option value="low">Basse</option>
<option value="medium">Moyenne</option>
<option value="high">Haute</option>
<option value="urgent">Urgente</option>
</select>
</div>

<div>
<label className="block text-sm font-medium mb-2">Couleur</label>
<input
type="color"
value={formData.color}
onChange={(e) => setFormData({ ...formData, color: e.target.value })}
className="h-10 w-full rounded"
/>
</div>
</div>

{/* TAGS */}
<div>
<label className="block text-sm font-medium mb-2">Tags</label>
<input
type="text"
placeholder="frontend, backend..."
value={formData.tags}
onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
className="input"
/>
</div>

{/* ACTIONS */}
<div className="flex space-x-3 pt-4">
<button type="submit" className="btn btn-primary flex-1">
{modalMode === "create" ? "Créer" : "Mettre à jour"}
</button>
<button
type="button"
onClick={() => setShowModal(false)}
className="btn btn-secondary flex-1"
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

export default Projects;
