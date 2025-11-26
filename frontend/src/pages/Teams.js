import React, { useState, useEffect } from "react";
import { teamsAPI, usersAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
Users,
Plus,
Search,
UserPlus,
Trash2,
Edit2,
X,
} from "lucide-react";
import Loading from "../components/Loading";
import { useAuth } from "../context/AuthContext";

const Teams = () => {
const { user } = useAuth();

const [teams, setTeams] = useState([]);
const [loading, setLoading] = useState(true);

const [showModal, setShowModal] = useState(false);
const [modalMode, setModalMode] = useState("create");
const [selectedTeam, setSelectedTeam] = useState(null);

const [formData, setFormData] = useState({
name: "",
description: "",
color: "#3B82F6",
});

const [searchQuery, setSearchQuery] = useState("");
const [searchResults, setSearchResults] = useState([]);
const [showAddMember, setShowAddMember] = useState(false);

// ID cohérent
const currentUserId = user?.id || user?._id;

// Global admin (admin OU ancien user sans role)
const isGlobalAdmin = !user?.role || user.role === "admin";

// Vérifie si utilisateur = admin de l'équipe
const isTeamAdmin = (team) => {
if (isGlobalAdmin) return true;
if (!team || !currentUserId) return false;

const member = team.members?.find(
(m) =>
m.user?._id === currentUserId ||
m.user === currentUserId ||
m.user?._id?.toString() === currentUserId?.toString()
);

if (!member) return false;

return member.role === "admin" || !member.role;
};

// Charger les équipes
useEffect(() => {
loadTeams();
}, []);

const loadTeams = async () => {
try {
const res = await teamsAPI.getAll();
const allTeams = res.data.data;

// 🔥 Membres NON admins voient uniquement leurs équipes
const visibleTeams = isGlobalAdmin
? allTeams
: allTeams.filter((team) =>
team.members.some(
(m) =>
m.user?._id === currentUserId ||
m.user === currentUserId ||
m.user?._id?.toString() === currentUserId?.toString()
)
);

setTeams(visibleTeams);
} catch (error) {
toast.error("Erreur lors du chargement des équipes");
} finally {
setLoading(false);
}
};

// Créer ou modifier une équipe
const handleSubmit = async (e) => {
e.preventDefault();

if (!isGlobalAdmin) {
toast.error("Vous n’avez pas les droits pour modifier les équipes");
return;
}

try {
if (modalMode === "create") {
await teamsAPI.create(formData);
toast.success("Équipe créée");
} else {
await teamsAPI.update(selectedTeam._id, formData);
toast.success("Équipe mise à jour");
}

setShowModal(false);
setFormData({ name: "", description: "", color: "#3B82F6" });
loadTeams();
} catch (error) {
toast.error(error.response?.data?.message || "Erreur");
}
};

// Supprimer une équipe
const deleteTeam = async (team) => {
if (!isTeamAdmin(team)) {
toast.error("Vous n’avez pas les droits pour supprimer cette équipe");
return;
}

if (!window.confirm("Supprimer définitivement cette équipe ?")) return;

try {
await teamsAPI.delete(team._id);
toast.success("Équipe supprimée");
loadTeams();
} catch (error) {
toast.error("Erreur lors de la suppression");
}
};

// Open modal create
const openCreateModal = () => {
if (!isGlobalAdmin) {
toast.error("Vous n’avez pas les droits pour créer une équipe");
return;
}
setModalMode("create");
setFormData({ name: "", description: "", color: "#3B82F6" });
setShowModal(true);
};

// Open modal edit
const openEditModal = (team) => {
if (!isTeamAdmin(team)) {
toast.error("Vous n’avez pas les droits pour modifier cette équipe");
return;
}

setModalMode("edit");
setSelectedTeam(team);
setFormData({
name: team.name,
description: team.description,
color: team.color,
});
setShowModal(true);
};

// Search users
const searchUsers = async (query) => {
if (query.length < 2) {
setSearchResults([]);
return;
}
try {
const response = await usersAPI.search(query, selectedTeam?._id);
setSearchResults(response.data.data);
} catch (error) {
console.log("Search error:", error);
}
};

// Add member
const addMember = async (userId) => {
if (!isTeamAdmin(selectedTeam)) {
toast.error("Vous n’avez pas les droits pour ajouter un membre");
return;
}

try {
await teamsAPI.addMember(selectedTeam._id, userId);
toast.success("Membre ajouté");
loadTeams();
setSearchQuery("");
setSearchResults([]);
} catch (error) {
toast.error("Erreur lors de l'ajout du membre");
}
};

// Remove member
const removeMember = async (teamId, userId, team) => {
if (!isTeamAdmin(team)) {
toast.error("Vous n’avez pas les droits pour retirer un membre");
return;
}

if (!window.confirm("Retirer ce membre ?")) return;

try {
await teamsAPI.removeMember(teamId, userId);
toast.success("Membre retiré");
loadTeams();
} catch (error) {
toast.error("Erreur lors du retrait");
}
};

if (loading) return <Loading fullScreen={false} />;

return (
<div>
{/* HEADER */}
<div className="flex items-center justify-between mb-6">
<h1 className="text-2xl font-bold">Mes équipes</h1>

{isGlobalAdmin && (
<button
onClick={openCreateModal}
className="btn btn-primary flex items-center"
>
<Plus className="w-5 h-5 mr-2" />
Nouvelle équipe
</button>
)}
</div>

{/* LISTE DES ÉQUIPES */}
{teams.length === 0 ? (
<div className="card text-center py-12">
<Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
<h3 className="text-lg font-medium mb-2">Aucune équipe</h3>
<p className="text-gray-600 mb-4">Vous n'appartenez à aucune équipe.</p>

{isGlobalAdmin && (
<button onClick={openCreateModal} className="btn btn-primary">
Créer une équipe
</button>
)}
</div>
) : (
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{teams.map((team) => {
const userIsTeamAdmin = isTeamAdmin(team);

return (
<div key={team._id} className="card hover:shadow-lg transition-shadow">

{/* HEADER */}
<div className="flex items-start justify-between mb-4">
<div className="flex items-center">
<div
className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold mr-3"
style={{ backgroundColor: team.color }}
>
{team.name.charAt(0)}
</div>

<div>
<h3 className="text-lg font-bold">{team.name}</h3>
<p className="text-sm text-gray-500">
{team.members.length} membre
{team.members.length > 1 ? "s" : ""}
</p>
</div>
</div>

{userIsTeamAdmin && (
<div className="flex space-x-2">
<button
onClick={() => openEditModal(team)}
className="p-2 text-gray-400 hover:text-gray-600 rounded"
>
<Edit2 className="w-4 h-4" />
</button>

<button
onClick={() => deleteTeam(team)}
className="p-2 text-red-500 hover:bg-red-100 rounded"
>
<Trash2 className="w-4 h-4" />
</button>
</div>
)}
</div>

{team.description && (
<p className="text-sm text-gray-600 mb-4">{team.description}</p>
)}

{/* MEMBRES */}
<div className="border-t pt-4">
<div className="flex items-center justify-between mb-3">
<p className="text-sm font-medium">Membres</p>

{userIsTeamAdmin && (
<button
onClick={() => {
setSelectedTeam(team);
setShowAddMember(true);
}}
className="text-sm text-primary-600 flex items-center"
>
<UserPlus className="w-4 h-4 mr-1" />
Ajouter
</button>
)}
</div>

<div className="space-y-2 max-h-40 overflow-y-auto">
{team.members.map((member) => (
<div
key={member.user._id}
className="flex items-center justify-between"
>
<div className="flex items-center">
<div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center mr-2">
{member.user.firstName?.charAt(0)}
{member.user.lastName?.charAt(0)}
</div>

<div>
<p className="text-sm font-medium">
{member.user.firstName} {member.user.lastName}
</p>
<p className="text-xs text-gray-500">
{member.role === "admin" ? "Admin équipe" : "Membre"}
</p>
</div>
</div>

{userIsTeamAdmin && (
<button
onClick={() =>
removeMember(team._id, member.user._id, team)
}
className="p-1 text-red-600 hover:bg-red-50 rounded"
>
<Trash2 className="w-4 h-4" />
</button>
)}
</div>
))}
</div>
</div>

</div>
);
})}
</div>
)}

{/* MODALES */}
{/* CREATE / EDIT MODAL */}
{showModal && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-lg max-w-md w-full p-6">

<div className="flex items-center justify-between mb-4">
<h2 className="text-xl font-bold">
{modalMode === "create" ? "Nouvelle équipe" : "Modifier l'équipe"}
</h2>

<button
onClick={() => setShowModal(false)}
className="text-gray-400 hover:text-gray-600"
>
<X className="w-6 h-6" />
</button>
</div>

<form onSubmit={handleSubmit} className="space-y-4">

<div>
<label className="block text-sm font-medium mb-2">Nom</label>
<input
type="text"
value={formData.name}
onChange={(e) =>
setFormData({ ...formData, name: e.target.value })
}
className="input"
required
/>
</div>

<div>
<label className="block text-sm font-medium mb-2">Description</label>
<textarea
value={formData.description}
onChange={(e) =>
setFormData({ ...formData, description: e.target.value })
}
className="input"
rows={3}
/>
</div>

<div>
<label className="block text-sm font-medium mb-2">Couleur</label>
<input
type="color"
value={formData.color}
onChange={(e) =>
setFormData({ ...formData, color: e.target.value })
}
className="w-full h-10 rounded border"
/>
</div>

<div className="flex space-x-3 pt-3">
<button type="submit" className="btn btn-primary flex-1">
{modalMode === "create" ? "Créer" : "Sauvegarder"}
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

{/* ADD MEMBER MODAL */}
{showAddMember && selectedTeam && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
<div className="bg-white rounded-lg max-w-md w-full p-6">

<div className="flex items-center justify-between mb-4">
<h2 className="text-xl font-bold">Ajouter un membre</h2>

<button
onClick={() => {
setShowAddMember(false);
setSearchQuery("");
setSearchResults([]);
}}
className="text-gray-400 hover:text-gray-600"
>
<X className="w-6 h-6" />
</button>
</div>

{!isTeamAdmin(selectedTeam) ? (
<p className="text-sm text-gray-500">Accès refusé</p>
) : (
<>
<div className="relative mb-4">
<Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

<input
type="text"
value={searchQuery}
onChange={(e) => {
setSearchQuery(e.target.value);
searchUsers(e.target.value);
}}
className="input pl-10"
placeholder="Rechercher..."
/>
</div>

<div className="space-y-2 max-h-64 overflow-y-auto">
{searchResults.map((u) => (
<div
key={u._id}
className="flex items-center justify-between p-3 border rounded"
>
<div className="flex items-center">
<div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center mr-3">
{u.firstName.charAt(0)}
{u.lastName.charAt(0)}
</div>

<div>
<p className="font-medium">
{u.firstName} {u.lastName}
</p>
<p className="text-xs text-gray-500">{u.email}</p>
</div>
</div>

<button
onClick={() => addMember(u._id)}
className="btn btn-primary text-sm"
>
Ajouter
</button>
</div>
))}
</div>
</>
)}
</div>
</div>
)}
</div>
);
};

export default Teams;
