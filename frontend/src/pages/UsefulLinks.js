// 🚀 FILE: src/pages/UsefulLinks.js

import React, { useState, useEffect } from "react";
import { usefulLinksAPI, usersAPI } from "../utils/api";
import { Plus, ExternalLink, Trash2, Users, Edit2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Loading from "../components/Loading";
import { toast } from "react-toastify";

const UsefulLinks = () => {
const { user } = useAuth();
const isAdmin = !user?.role || user.role === "admin";

const [links, setLinks] = useState([]);
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(true);

const [showModal, setShowModal] = useState(false);
const [modalMode, setModalMode] = useState("create"); // "create" | "edit"
const [editingLinkId, setEditingLinkId] = useState(null);

const [formData, setFormData] = useState({
title: "",
url: "",
assignedTo: [],
});

// === LOAD DATA ===
useEffect(() => {
loadData();
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const loadData = async () => {
try {
setLoading(true);

// 👇 On utilise l'endpoint qui existe déjà : /users/search
const [linksRes, usersRes] = await Promise.all([
usefulLinksAPI.getAll(),
usersAPI.search("", null), // récupère tous les utilisateurs
]);

setLinks(linksRes.data.data || []);
setUsers(usersRes.data.data || []);
} catch (error) {
console.error("Erreur loadData UsefulLinks:", error?.response || error);
toast.error("Erreur lors du chargement des liens");
} finally {
setLoading(false);
}
};

// === OPEN MODAL (CREATE) ===
const openCreateModal = () => {
setModalMode("create");
setEditingLinkId(null);
setFormData({ title: "", url: "", assignedTo: [] });
setShowModal(true);
};

// === OPEN MODAL (EDIT) ===
const openEditModal = (link) => {
if (!isAdmin) return;
setModalMode("edit");
setEditingLinkId(link._id);
setFormData({
title: link.title || "",
url: link.url || "",
assignedTo: (link.assignedTo || []).map((u) => u._id),
});
setShowModal(true);
};

// === SUBMIT (CREATE / EDIT) ===
const handleSubmit = async (e) => {
e.preventDefault();

try {
if (modalMode === "create") {
await usefulLinksAPI.create(formData);
toast.success("Lien ajouté");
} else {
await usefulLinksAPI.update(editingLinkId, formData);
toast.success("Lien mis à jour");
}

setShowModal(false);
setFormData({ title: "", url: "", assignedTo: [] });
setEditingLinkId(null);
setModalMode("create");
loadData();
} catch (error) {
console.error("Erreur handleSubmit UsefulLinks:", error?.response || error);
toast.error(
modalMode === "create"
? "Erreur lors de la création"
: "Erreur lors de la mise à jour"
);
}
};

// === DELETE LINK ===
const deleteLink = async (id) => {
if (!window.confirm("Supprimer ce lien ?")) return;
try {
await usefulLinksAPI.delete(id);
toast.success("Lien supprimé");
loadData();
} catch (error) {
console.error("Erreur deleteLink:", error?.response || error);
toast.error("Erreur lors de la suppression");
}
};

if (loading) return <Loading />;

return (
<div className="space-y-6">
{/* HEADER */}
<div className="flex items-center justify-between">
<h1 className="text-2xl font-bold">Liens utiles</h1>

{isAdmin && (
<button
onClick={openCreateModal}
className="btn btn-primary flex items-center"
>
<Plus className="w-5 h-5 mr-2" /> Nouveau lien
</button>
)}
</div>

{/* LISTE DES LIENS */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
{links.length === 0 ? (
<div className="col-span-full card p-6 text-gray-500">
Aucun lien pour le moment.
</div>
) : (
links.map((link) => (
<div
key={link._id}
className="card hover:shadow-md p-4 flex justify-between"
>
<div>
<h3 className="text-lg font-bold">{link.title}</h3>

<a
href={link.url}
target="_blank"
rel="noopener noreferrer"
className="text-primary-600 flex items-center mt-1 break-all"
>
{link.url}
<ExternalLink className="w-4 h-4 ml-1" />
</a>

{/* UTILISATEURS ASSIGNÉS */}
{link.assignedTo && link.assignedTo.length > 0 && (
<div className="flex items-center gap-2 mt-2 flex-wrap">
<Users className="w-4 h-4 text-gray-500" />
{link.assignedTo.map((u) => (
<span
key={u._id}
className="badge bg-purple-100 text-purple-800"
>
{u.firstName} {u.lastName}
</span>
))}
</div>
)}
</div>

{/* ACTIONS (ADMIN) */}
{isAdmin && (
<div className="flex flex-col items-end gap-2 ml-3">
<button
onClick={() => openEditModal(link)}
className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
title="Modifier"
>
<Edit2 className="w-5 h-5" />
</button>
<button
onClick={() => deleteLink(link._id)}
className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
title="Supprimer"
>
<Trash2 className="w-5 h-5" />
</button>
</div>
)}
</div>
))
)}
</div>

{/* MODAL AJOUT / MODIFICATION LIEN */}
{showModal && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
<div className="bg-white rounded-lg p-6 w-full max-w-lg">
<h2 className="text-xl font-bold mb-4">
{modalMode === "create" ? "Ajouter un lien" : "Modifier le lien"}
</h2>

<form onSubmit={handleSubmit} className="space-y-4">
{/* TITRE */}
<div>
<label className="block text-sm mb-2 font-medium">
Nom du lien
</label>
<input
className="input"
value={formData.title}
onChange={(e) =>
setFormData({ ...formData, title: e.target.value })
}
required
/>
</div>

{/* URL */}
<div>
<label className="block text-sm mb-2 font-medium">URL</label>
<input
className="input"
value={formData.url}
onChange={(e) =>
setFormData({ ...formData, url: e.target.value })
}
type="url"
required
/>
</div>

{/* UTILISATEURS ASSIGNÉS */}
<div>
<label className="block text-sm mb-2 font-medium">
Assigné à
</label>
<div className="border p-3 rounded-lg max-h-40 overflow-y-auto space-y-1">
{users.map((u) => (
<label
key={u._id}
className="flex items-center gap-2 text-sm"
>
<input
type="checkbox"
checked={formData.assignedTo.includes(u._id)}
onChange={() => {
setFormData((prev) => ({
...prev,
assignedTo: prev.assignedTo.includes(u._id)
? prev.assignedTo.filter((id) => id !== u._id)
: [...prev.assignedTo, u._id],
}));
}}
/>
{u.firstName} {u.lastName}
</label>
))}
{users.length === 0 && (
<p className="text-xs text-gray-400">
Aucun utilisateur trouvé.
</p>
)}
</div>
</div>

{/* BOUTONS */}
<div className="flex gap-3 pt-2">
<button type="submit" className="btn btn-primary flex-1">
{modalMode === "create" ? "Ajouter" : "Mettre à jour"}
</button>
<button
type="button"
onClick={() => {
setShowModal(false);
setEditingLinkId(null);
setModalMode("create");
}}
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

export default UsefulLinks;
