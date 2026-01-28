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
Archive, // ✅ AJOUT
RotateCcw, // ✅ AJOUT
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../components/Loading";
import TaskModal from "../components/TaskModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Tasks = () => {
const location = useLocation();
const { user } = useAuth();

// ROLE GLOBAL
const isAdmin = !user?.role || user.role === "admin";

// UI STATE
const [tasks, setTasks] = useState([]);
const [projects, setProjects] = useState([]);
const [loading, setLoading] = useState(true);

// ✅ ✅ ✅ AJOUT RECHERCHE
const [search, setSearch] = useState("");

// ✅ ✅ ✅ AJOUT MODE ARCHIVES
const [showArchived, setShowArchived] = useState(false);

// MODAL
const [showModal, setShowModal] = useState(false);
const [selectedTask, setSelectedTask] = useState(null);

// FILTERS
const [taskView, setTaskView] = useState("all");
const [filters, setFilters] = useState({
projectId: "",
status: "",
priority: "",
});

const [isOverdueMode, setIsOverdueMode] = useState(false);

// Detect parameters (?status=overdue)
useEffect(() => {
const params = new URLSearchParams(location.search);
const statusParam = params.get("status");

setIsOverdueMode(statusParam === "overdue");

setFilters({
projectId: "",
status: statusParam && statusParam !== "overdue" ? statusParam : "",
priority: "",
});

// ✅ si on est en mode overdue, on force pas les archives
if (statusParam === "overdue") {
setShowArchived(false);
}
}, [location.search]);

// Load data
useEffect(() => {
loadData();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [filters, isOverdueMode, taskView, location.search, showArchived]);

const loadData = async () => {
try {
setLoading(true);

let query = { ...filters };
Object.keys(query).forEach((key) => {
if (!query[key]) delete query[key];
});

// ⭐ Correction du filtre "en retard"
if (filters.status === "overdue") {
query.overdue = true;
delete query.status;
}

// Special filters
if (taskView === "assigned") query.filterType = "assignedToMe";
if (taskView === "created_not_assigned")
query.filterType = "createdByMeNotAssignedToMe";

// ✅ ✅ ✅ FIX IMPORTANT : n'envoyer "archived" QUE si on veut voir les archives
if (showArchived) {
query.archived = true; // ou "true" si tu veux forcer string
} else {
delete query.archived;
}

const tasksRes = await tasksAPI.getAll(query);
const projectsRes = await projectsAPI.getAll();

let fetchedTasks = tasksRes.data.data || [];

// ✅ ✅ ✅ Sécurité front : si jamais le backend renvoie tout, on filtre quand même
fetchedTasks = fetchedTasks.filter((t) =>
showArchived ? t.archived === true : t.archived !== true
);

// TRI IDENTIQUE
fetchedTasks = fetchedTasks.sort((a, b) => {
const dateA = a.dueDate ? new Date(a.dueDate) : null;
const dateB = b.dueDate ? new Date(b.dueDate) : null;

if (dateA && dateB) return dateA - dateB;
if (dateA && !dateB) return -1;
if (!dateA && dateB) return 1;

return a.title.localeCompare(b.title, "fr", {
sensitivity: "base",
});
});

setTasks(fetchedTasks);
setProjects(projectsRes.data.data);
} catch {
toast.error("Erreur lors du chargement des tâches");
} finally {
setLoading(false);
}
};

// ✅ ✅ ✅ FILTRAGE RECHERCHE TEMPS RÉEL
const filteredTasks = tasks.filter((task) =>
task.title.toLowerCase().includes(search.toLowerCase())
);

// CLICK ON TASK
const handleTaskClick = (task) => {
if (!isAdmin) return;
setSelectedTask(task);
setShowModal(true);
};

const handleTaskUpdate = async () => {
await loadData();
setShowModal(false);
setSelectedTask(null);
};

const updateTaskStatus = async (taskId, newStatus) => {
if (!isAdmin) {
toast.error("Vous n’avez pas les droits");
return;
}

try {
await tasksAPI.update(taskId, { status: newStatus });
toast.success("Statut mis à jour");
loadData();
} catch {
toast.error("Erreur lors du changement de statut");
}
};

// ✅ ✅ ✅ ARCHIVER / RESTAURER (corrigé => archived)
const archiveTask = async (taskId) => {
if (!isAdmin) {
toast.error("Vous n’avez pas les droits");
return;
}
try {
await tasksAPI.update(taskId, { archived: true });
toast.success("Tâche archivée");
loadData();
} catch {
toast.error("Erreur lors de l’archivage");
}
};

const restoreTask = async (taskId) => {
if (!isAdmin) {
toast.error("Vous n’avez pas les droits");
return;
}
try {
await tasksAPI.update(taskId, { archived: false });
toast.success("Tâche restaurée");
loadData();
} catch {
toast.error("Erreur lors de la restauration");
}
};

// COLORS
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
{isOverdueMode
? "Tâches en retard"
: showArchived
? "Archives — Tâches"
: "Tâches"}
</h1>

<div className="flex items-center gap-3">
{/* ✅ ✅ ✅ INPUT RECHERCHE */}
<input
type="text"
placeholder="Rechercher une tâche..."
className="input w-64"
value={search}
onChange={(e) => setSearch(e.target.value)}
/>

{/* ✅ ✅ ✅ TOGGLE ARCHIVES */}
{!isOverdueMode && (
<button
onClick={() => setShowArchived((v) => !v)}
className={`btn ${
showArchived ? "btn-primary" : "btn-light"
} flex items-center`}
title={showArchived ? "Voir tâches actives" : "Voir archives"}
>
<Archive className="w-5 h-5 mr-2" />
{showArchived ? "Actives" : "Archives"}
</button>
)}

{isAdmin && (
<button
onClick={() => {
setSelectedTask(null);
setShowModal(true);
}}
className="btn btn-primary flex items-center"
>
<Plus className="w-5 h-5 mr-2" /> Nouvelle tâche
</button>
)}
</div>
</div>

{/* FILTERS */}
{!isOverdueMode && !showArchived && (
<div className="card mb-6 p-4">
<div className="flex items-center mb-4">
<Filter className="w-5 h-5 mr-2 text-gray-600" />
<h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
</div>

<div className="flex gap-2 mb-4">
<button
className={`btn ${
taskView === "all" ? "btn-primary" : "btn-light"
}`}
onClick={() => setTaskView("all")}
>
Toutes les tâches
</button>

<button
className={`btn ${
taskView === "assigned" ? "btn-primary" : "btn-light"
}`}
onClick={() => setTaskView("assigned")}
>
Assignées à moi
</button>

<button
className={`btn ${
taskView === "created_not_assigned"
? "btn-primary"
: "btn-light"
}`}
onClick={() => setTaskView("created_not_assigned")}
>
Créées par moi non assignées
</button>
</div>

<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
<div>
<label className="block text-sm mb-2">Projet</label>
<select
value={filters.projectId}
onChange={(e) =>
setFilters({
...filters,
projectId: e.target.value,
})
}
className="input"
>
<option value="">Tous les projets</option>
{projects.map((p) => (
<option key={p._id} value={p._id}>
{p.name}
</option>
))}
</select>
</div>

<div>
<label className="block text-sm mb-2">Statut</label>
<select
value={filters.status}
onChange={(e) =>
setFilters({
...filters,
status: e.target.value,
})
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

<div>
<label className="block text-sm mb-2">Priorité</label>
<select
value={filters.priority}
onChange={(e) =>
setFilters({
...filters,
priority: e.target.value,
})
}
className="input"
>
<option value="">Toutes</option>
<option value="low">Basse</option>
<option value="medium">Moyenne</option>
<option value="high">Haute</option>
<option value="urgent">Urgente</option>
</select>
</div>
</div>
</div>
)}

{/* LIST */}
{filteredTasks.length === 0 ? (
<div className="card text-center py-12">
<CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
<h3 className="text-lg font-medium">Aucune tâche</h3>
</div>
) : (
<div className="space-y-4">
<AnimatePresence>
{filteredTasks.map((task) => {
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
className={`card hover:shadow-lg ${
isAdmin ? "cursor-pointer" : "cursor-default"
}`}
>
<div className="flex items-start justify-between">
<div className="flex-1">
<h3 className="text-lg font-bold">{task.title}</h3>
<p className="text-sm text-gray-600">
{task.project?.name}
</p>

{task.assignedTo?.length > 0 && (
<div className="flex items-center flex-wrap gap-2 mt-2">
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

{task.dueDate && (
<span
className={`badge flex items-center ${
isOverdue
? "bg-red-100 text-red-800"
: "bg-gray-100 text-gray-700"
}`}
>
<CalendarIcon className="w-3 h-3 mr-1" />
{format(new Date(task.dueDate), "dd MMM yyyy", {
locale: fr,
})}
{isOverdue && (
<AlertCircle className="w-3 h-3 ml-1" />
)}
</span>
)}
</div>
</div>

{isAdmin && (
<div className="flex items-center gap-2">
<select
value={task.status}
onChange={(e) =>
updateTaskStatus(task._id, e.target.value)
}
onClick={(e) => e.stopPropagation()}
className="text-sm border rounded-lg px-2 py-1"
disabled={task.archived}
title={
task.archived
? "Impossible de changer le statut d’une tâche archivée"
: ""
}
>
<option value="not_started">Non démarrée</option>
<option value="in_progress">En cours</option>
<option value="completed">Terminée</option>
</select>

{/* ✅ ✅ ✅ ARCHIVE / RESTORE BUTTON */}
{!task.archived ? (
<button
onClick={(e) => {
e.stopPropagation();
archiveTask(task._id);
}}
className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
title="Archiver"
>
<Archive className="w-5 h-5" />
</button>
) : (
<button
onClick={(e) => {
e.stopPropagation();
restoreTask(task._id);
}}
className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
title="Restaurer"
>
<RotateCcw className="w-5 h-5" />
</button>
)}
</div>
)}
</div>
</motion.div>
);
})}
</AnimatePresence>
</div>
)}

{/* MODAL */}
{showModal && isAdmin && (
<TaskModal
task={selectedTask}
projects={projects}
onClose={() => {
setShowModal(false);
setSelectedTask(null);
}}
onSave={handleTaskUpdate}
/>
)}
</div>
);
};

export default Tasks;
