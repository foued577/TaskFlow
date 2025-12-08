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
  X,
} from "lucide-react";
import { motion } from "framer-motion";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // ✅ AJOUT ÉDITION
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
      const res = await usersAPI.search("", null); // get all
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
  // CREATE NEW USER
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
  // UPDATE USER ROLE
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
  // ✅ OPEN EDIT MODAL
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
  // ✅ UPDATE USER
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestion des utilisateurs
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary flex items-center"
        >
          <UserPlus className="w-5 h-5 mr-2" />
          Ajouter un utilisateur
        </button>
      </div>

      {/* ✅ EDIT MODAL */}
      {showEdit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
        >
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-xl">
            <div className="flex justify-between mb-4">
              <h2 className="text-lg font-bold">Modifier utilisateur</h2>
              <button onClick={() => setShowEdit(false)}>
                <X className="w-6 h-6" />
              </button>
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
                type="email"
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

      {/* ADD USER FORM */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 shadow rounded-xl p-6"
        >
          <h2 className="text-xl font-semibold mb-4">Nouvel utilisateur</h2>
          <form
            onSubmit={createUser}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <input
              className="input"
              placeholder="Prénom"
              required
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Nom"
              required
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
            <input
              className="input md:col-span-2"
              type="email"
              placeholder="Email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
            <input
              className="input md:col-span-2"
              type="password"
              placeholder="Mot de passe"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
            />
            <select
              className="input"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value })
              }
            >
              <option value="member">Membre</option>
              <option value="admin">Administrateur</option>
            </select>

            <div className="md:col-span-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn border border-gray-400 dark:border-gray-600"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={creating}
                className="btn btn-primary flex items-center"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" /> Création...
                  </>
                ) : (
                  "Créer"
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* USER LIST */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Rôle</th>
              <th className="px-6 py-3 text-right text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loadingUsers ? (
              <tr>
                <td colSpan="4" className="py-10 text-center">
                  <Loader2 className="animate-spin w-8 h-8 mx-auto" />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="4" className="py-10 text-center text-gray-500">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u._id}
                  className="border-t border-gray-200 dark:border-gray-700"
                >
                  <td className="px-6 py-4 font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-6 py-4">{u.email}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                        u.role === "admin"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex justify-end space-x-3">
                    <button
                      onClick={() => openEdit(u)}
                      className="btn bg-yellow-500 text-white hover:bg-yellow-600 flex items-center"
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Modifier
                    </button>

                    {u.role === "member" ? (
                      <button
                        onClick={() => changeRole(u._id, "admin")}
                        className="btn btn-primary flex items-center"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2" />
                        Rendre admin
                      </button>
                    ) : (
                      <button
                        onClick={() => changeRole(u._id, "member")}
                        className="btn border border-gray-400 dark:border-gray-600 flex items-center"
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Rendre membre
                      </button>
                    )}
                    <button
                      onClick={() => deleteUser(u._id)}
                      className="btn bg-red-600 text-white hover:bg-red-700 flex items-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;
