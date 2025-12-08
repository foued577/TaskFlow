import React, { useEffect, useState } from "react";
import { usersAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
  UserPlus,
  ShieldCheck,
  Trash2,
  Loader2,
  Shield,
  Pencil,
  X
} from "lucide-react";
import { motion } from "framer-motion";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // ✅ EDIT
  const [showEdit, setShowEdit] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editData, setEditData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "member",
  });

  // ------------------------------------------
  // LOAD ALL USERS
  // ------------------------------------------
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await usersAPI.search("", null);
      setUsers(res.data.data || []);
    } catch (err) {
      toast.error("Erreur de chargement des utilisateurs");
    }
    setLoadingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ------------------------------------------
  // CREATE USER
  // ------------------------------------------
  const createUser = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await usersAPI.create(formData);
      toast.success("Utilisateur ajouté !");
      setShowForm(false);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "member",
      });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Erreur création utilisateur");
    }
    setCreating(false);
  };

  // ------------------------------------------
  // UPDATE ROLE
  // ------------------------------------------
  const changeRole = async (id, role) => {
    try {
      await usersAPI.updateRole(id, { role });
      toast.success("Rôle mis à jour !");
      fetchUsers();
    } catch (err) {
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  // ------------------------------------------
  // DELETE USER
  // ------------------------------------------
  const deleteUser = async (id) => {
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await usersAPI.delete(id);
      toast.success("Utilisateur supprimé");
      fetchUsers();
    } catch (err) {
      toast.error("Erreur suppression utilisateur");
    }
  };

  // ------------------------------------------
  // OPEN EDIT MODAL
  // ------------------------------------------
  const openEdit = (u) => {
    setEditingUser(u);
    setEditData({
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      password: "",
    });
    setShowEdit(true);
  };

  // ------------------------------------------
  // UPDATE USER
  // ------------------------------------------
  const updateUser = async (e) => {
    e.preventDefault();
    try {
      await usersAPI.update(editingUser._id, editData);
      toast.success("Utilisateur modifié !");
      setShowEdit(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      toast.error("Erreur lors de la modification");
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>

        <button onClick={() => setShowForm(true)} className="btn btn-primary">
          <UserPlus className="w-5 h-5 mr-2" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* EDIT MODAL ✅ */}
      {showEdit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <div className="flex justify-between mb-4">
              <h2 className="text-xl font-bold">Modifier utilisateur</h2>
              <X onClick={() => setShowEdit(false)} className="cursor-pointer" />
            </div>

            <form onSubmit={updateUser} className="space-y-4">
              <input
                className="input w-full"
                placeholder="Prénom"
                value={editData.firstName}
                onChange={(e) =>
                  setEditData({ ...editData, firstName: e.target.value })
                }
              />
              <input
                className="input w-full"
                placeholder="Nom"
                value={editData.lastName}
                onChange={(e) =>
                  setEditData({ ...editData, lastName: e.target.value })
                }
              />
              <input
                className="input w-full"
                placeholder="Email"
                value={editData.email}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
                }
              />
              <input
                className="input w-full"
                type="password"
                placeholder="Nouveau mot de passe (optionnel)"
                onChange={(e) =>
                  setEditData({ ...editData, password: e.target.value })
                }
              />

              <button className="btn btn-primary w-full">Enregistrer</button>
            </form>
          </div>
        </motion.div>
      )}

      {/* USER LIST */}
      <div className="bg-white shadow rounded-xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left">Utilisateur</th>
              <th className="px-6 py-3 text-left">Email</th>
              <th className="px-6 py-3 text-left">Rôle</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t">
                <td className="px-6 py-4">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-6 py-4">{u.email}</td>
                <td className="px-6 py-4">{u.role}</td>
                <td className="px-6 py-4 flex justify-end gap-2">
                  <button
                    onClick={() => openEdit(u)}
                    className="btn bg-yellow-500 text-white"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Modifier
                  </button>

                  <button
                    onClick={() =>
                      changeRole(u._id, u.role === "admin" ? "member" : "admin")
                    }
                    className="btn border"
                  >
                    <Shield className="w-4 h-4 mr-1" />
                    Changer rôle
                  </button>

                  <button
                    onClick={() => deleteUser(u._id)}
                    className="btn bg-red-600 text-white"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
