import React, { useEffect, useState } from "react";
import { usersAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { Plus, Trash, Shield, User as UserIcon } from "lucide-react";
const UserManagement = () => {
 const { user } = useAuth();
 const [users, setUsers] = useState([]);
 const [loading, setLoading] = useState(true);
 // Modal states
 const [showAddModal, setShowAddModal] = useState(false);
 const [showRoleModal, setShowRoleModal] = useState(false);
 const [selectedUser, setSelectedUser] = useState(null);
 // Form for adding user
 const [newUser, setNewUser] = useState({
   firstName: "",
   lastName: "",
   email: "",
   password: "",
   role: "member",
 });
 // Load all users
 const loadUsers = async () => {
   try {
     setLoading(true);
     const res = await usersAPI.search("", null); // get all users
     setUsers(res.data.data);
   } catch (error) {
     toast.error("Erreur chargement utilisateurs");
   }
   setLoading(false);
 };
 useEffect(() => {
   loadUsers();
 }, []);
 // Create user
 const handleCreateUser = async (e) => {
   e.preventDefault();
   try {
     const res = await usersAPI.create(newUser);
     toast.success("Utilisateur créé !");
     setShowAddModal(false);
     loadUsers();
   } catch (err) {
     toast.error(err.response?.data?.message || "Erreur création");
   }
 };
 // Update role
 const handleRoleUpdate = async () => {
   try {
     await usersAPI.updateRole(selectedUser._id, selectedUser.role);
     toast.success("Rôle mis à jour");
     setShowRoleModal(false);
     loadUsers();
   } catch (err) {
     toast.error("Erreur mise à jour rôle");
   }
 };
 // Delete user
 const handleDelete = async (id) => {
   if (!window.confirm("Supprimer cet utilisateur ?")) return;
   try {
     await usersAPI.deleteUser(id);
     toast.success("Utilisateur supprimé");
     loadUsers();
   } catch (err) {
     toast.error("Erreur suppression");
   }
 };
 if (loading) return <p className="text-center mt-8">Chargement...</p>;
 return (
<div className="p-8">
<div className="flex justify-between items-center mb-8">
<h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
<button
         onClick={() => setShowAddModal(true)}
         className="btn btn-primary flex items-center gap-2"
>
<Plus size={18} />
         Ajouter un utilisateur
</button>
</div>
     {/* USERS TABLE */}
<div className="bg-white shadow-xl rounded-xl overflow-hidden">
<table className="w-full">
<thead className="bg-gray-100 text-left">
<tr>
<th className="p-3">Nom</th>
<th className="p-3">Email</th>
<th className="p-3">Rôle</th>
<th className="p-3 text-right">Actions</th>
</tr>
</thead>
<tbody>
           {users.map((u) => (
<tr key={u._id} className="border-t">
<td className="p-3">
                 {u.firstName} {u.lastName}
</td>
<td className="p-3">{u.email}</td>
<td className="p-3 capitalize">{u.role || "member"}</td>
<td className="p-3 text-right flex justify-end gap-2">
                 {/* Change role */}
<button
                   onClick={() => {
                     setSelectedUser({ ...u });
                     setShowRoleModal(true);
                   }}
                   className="btn btn-secondary flex items-center gap-1"
>
<Shield size={16} />
                   Rôle
</button>
                 {/* Delete */}
<button
                   onClick={() => handleDelete(u._id)}
                   className="btn btn-danger flex items-center gap-1"
>
<Trash size={16} />
                   Supprimer
</button>
</td>
</tr>
           ))}
</tbody>
</table>
</div>
     {/* ADD USER MODAL */}
     {showAddModal && (
<div className="modal">
<div className="modal-content p-6">
<h2 className="text-xl font-bold mb-4">Ajouter un utilisateur</h2>
<form onSubmit={handleCreateUser} className="space-y-4">
<input
               type="text"
               placeholder="Prénom"
               className="input"
               value={newUser.firstName}
               onChange={(e) =>
                 setNewUser({ ...newUser, firstName: e.target.value })
               }
               required
             />
<input
               type="text"
               placeholder="Nom"
               className="input"
               value={newUser.lastName}
               onChange={(e) =>
                 setNewUser({ ...newUser, lastName: e.target.value })
               }
               required
             />
<input
               type="email"
               placeholder="Email"
               className="input"
               value={newUser.email}
               onChange={(e) =>
                 setNewUser({ ...newUser, email: e.target.value })
               }
               required
             />
<input
               type="password"
               placeholder="Mot de passe"
               className="input"
               value={newUser.password}
               onChange={(e) =>
                 setNewUser({ ...newUser, password: e.target.value })
               }
               required
             />
<select
               className="input"
               value={newUser.role}
               onChange={(e) =>
                 setNewUser({ ...newUser, role: e.target.value })
               }
>
<option value="member">Membre</option>
<option value="admin">Admin</option>
</select>
<div className="flex justify-end gap-3 mt-4">
<button
                 type="button"
                 className="btn"
                 onClick={() => setShowAddModal(false)}
>
                 Annuler
</button>
<button type="submit" className="btn btn-primary">
                 Ajouter
</button>
</div>
</form>
</div>
</div>
     )}
     {/* ROLE MODAL */}
     {showRoleModal && (
<div className="modal">
<div className="modal-content p-6">
<h2 className="text-xl font-bold mb-4">
             Modifier le rôle de {selectedUser.firstName}
</h2>
<select
             className="input"
             value={selectedUser.role}
             onChange={(e) =>
               setSelectedUser({
                 ...selectedUser,
                 role: e.target.value,
               })
             }
>
<option value="member">Membre</option>
<option value="admin">Admin</option>
</select>
<div className="flex justify-end gap-3 mt-4">
<button
               className="btn"
               onClick={() => setShowRoleModal(false)}
>
               Annuler
</button>
<button className="btn btn-primary" onClick={handleRoleUpdate}>
               Mettre à jour
</button>
</div>
</div>
</div>
     )}
</div>
 );
};
export default UserManagement;
