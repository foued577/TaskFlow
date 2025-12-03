import React, { useState, useEffect } from "react";
import { usefulLinksAPI, usersAPI } from "../utils/api";
import { Plus, ExternalLink, Trash2, Users } from "lucide-react";
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
 const [formData, setFormData] = useState({
   title: "",
   url: "",
   assignedTo: [],
 });
 // LOAD
 useEffect(() => {
   loadData();
 }, []);
 const loadData = async () => {
   try {
     const [linksRes, usersRes] = await Promise.all([
       usefulLinksAPI.getAll(),
       usersAPI.getAll()
     ]);
     setLinks(linksRes.data.data);
     setUsers(usersRes.data.data);
   } catch (error) {
     toast.error("Erreur lors du chargement des liens");
   } finally {
     setLoading(false);
   }
 };
 const createLink = async (e) => {
   e.preventDefault();
   try {
     await usefulLinksAPI.create(formData);
     toast.success("Lien ajouté");
     setShowModal(false);
     loadData();
   } catch (error) {
     toast.error("Erreur lors de la création");
   }
 };
 const deleteLink = async (id) => {
   if (!window.confirm("Supprimer ce lien ?")) return;
   try {
     await usefulLinksAPI.delete(id);
     toast.success("Lien supprimé");
     loadData();
   } catch {
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
           onClick={() => setShowModal(true)}
           className="btn btn-primary flex items-center"
>
<Plus className="w-5 h-5 mr-2" /> Nouveau lien
</button>
       )}
</div>
     {/* LIST */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       {links.map((link) => (
<div key={link._id} className="card hover:shadow-md p-4 flex justify-between">
<div>
<h3 className="text-lg font-bold">{link.title}</h3>
<a
               href={link.url}
               target="_blank"
               rel="noopener noreferrer"
               className="text-primary-600 flex items-center mt-1"
>
               {link.url}
<ExternalLink className="w-4 h-4 ml-1" />
</a>
             {/* USERS */}
             {link.assignedTo.length > 0 && (
<div className="flex items-center gap-2 mt-2">
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
           {/* DELETE */}
           {isAdmin && (
<button
               onClick={() => deleteLink(link._id)}
               className="p-2 text-red-600 hover:bg-red-100 rounded-lg"
>
<Trash2 className="w-5 h-5" />
</button>
           )}
</div>
       ))}
</div>
     {/* MODAL */}
     {showModal && (
<div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
<div className="bg-white rounded-lg p-6 w-full max-w-lg">
<h2 className="text-xl font-bold mb-4">Ajouter un lien</h2>
<form onSubmit={createLink} className="space-y-4">
<div>
<label className="block text-sm mb-2 font-medium">Nom du lien</label>
<input
                 className="input"
                 value={formData.title}
                 onChange={(e) =>
                   setFormData({ ...formData, title: e.target.value })
                 }
               />
</div>
<div>
<label className="block text-sm mb-2 font-medium">URL</label>
<input
                 className="input"
                 value={formData.url}
                 onChange={(e) =>
                   setFormData({ ...formData, url: e.target.value })
                 }
               />
</div>
             {/* ASSIGNED USERS */}
<div>
<label className="block text-sm mb-2 font-medium">Assigné à</label>
<div className="border p-3 rounded-lg max-h-40 overflow-y-auto">
                 {users.map((u) => (
<label key={u._id} className="flex items-center gap-2 text-sm">
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
</div>
</div>
<div className="flex gap-3 pt-2">
<button type="submit" className="btn btn-primary flex-1">
                 Ajouter
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
export default UsefulLinks;
