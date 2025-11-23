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

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const response = await teamsAPI.getAll();
      setTeams(response.data.data || []);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Erreur lors du chargement des équipes";
      toast.error(errorMessage);
      
      // Si erreur d'authentification, rediriger vers login
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      
      setTeams([]); // Initialiser avec un tableau vide
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits pour créer une équipe");
      return;
    }
    setModalMode("create");
    setFormData({ name: "", description: "", color: "#3B82F6" });
    setShowModal(true);
  };

  const openEditModal = (team) => {
    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits pour modifier une équipe");
      return;
    }
    setModalMode("edit");
    setSelectedTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      color: team.color || "#3B82F6",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("Action non autorisée");
      return;
    }

    try {
      if (modalMode === "create") {
        await teamsAPI.create(formData);
        toast.success("Équipe créée avec succès");
      } else {
        await teamsAPI.update(selectedTeam._id, formData);
        toast.success("Équipe mise à jour");
      }
      setShowModal(false);
      loadTeams();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error(error.response?.data?.message || "Erreur serveur");
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await usersAPI.search(query);
      setSearchResults(res.data.data || []);
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setSearchResults([]);
    }
  };

  const addMember = async (userId) => {
    if (!isAdmin) {
      toast.error("Action non autorisée");
      return;
    }
    try {
      await teamsAPI.addMember(selectedTeam._id, userId);
      toast.success("Membre ajouté");
      loadTeams();
      setSearchQuery("");
      setSearchResults([]);
      setShowAddMember(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout du membre:", error);
      toast.error(error.response?.data?.message || "Erreur lors de l'ajout du membre");
    }
  };

  const removeMember = async (teamId, userId) => {
    if (!isAdmin) {
      toast.error("Action non autorisée");
      return;
    }
    if (!window.confirm("Retirer ce membre ?")) return;

    try {
      await teamsAPI.removeMember(teamId, userId);
      toast.success("Membre retiré");
      loadTeams();
    } catch (error) {
      console.error("Erreur lors du retrait du membre:", error);
      toast.error(error.response?.data?.message || "Erreur lors du retrait du membre");
    }
  };

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Équipes</h1>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" /> Nouvelle équipe
          </button>
        )}
      </div>

      {/* List */}
      {teams.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Aucune équipe
          </h3>
          {isAdmin && (
            <button onClick={openCreateModal} className="btn btn-primary mt-3">
              Créer une équipe
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <div
              key={team._id}
              className="card hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl mr-3"
                    style={{ backgroundColor: team.color || "#3B82F6" }}
                  >
                    {team.name ? team.name.charAt(0) : "T"}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold">{team.name}</h3>
                    <p className="text-sm text-gray-500">
                      {team.members ? team.members.length : 0} membre
                      {(team.members ? team.members.length : 0) > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <button
                    onClick={() => openEditModal(team)}
                    className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Members */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Membres</p>

                  {isAdmin && (
                    <button
                      className="text-sm text-primary-600 flex items-center"
                      onClick={() => {
                        setSelectedTeam(team);
                        setShowAddMember(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Ajouter
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto">
                  {team.members && team.members.length > 0 ? (
                    team.members.map((m, index) => {
                      const memberUser = m.user || m;
                      const userId = memberUser._id || memberUser;
                      const firstName = memberUser.firstName || "";
                      const lastName = memberUser.lastName || "";
                      
                      return (
                        <div
                          key={userId || index}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold mr-2">
                              {firstName ? firstName[0] : ""}
                              {lastName ? lastName[0] : ""}
                            </div>
                            <p className="text-sm">
                              {firstName} {lastName}
                            </p>
                          </div>

                          {isAdmin && (
                            <button
                              onClick={() => removeMember(team._id, userId)}
                              className="text-red-600 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-2">
                      Aucun membre
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === "create"
                  ? "Nouvelle équipe"
                  : "Modifier l'équipe"}
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
                <label className="text-sm font-medium">
                  Nom de l'équipe
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  rows={3}
                  className="input"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                ></textarea>
              </div>

              <div>
                <label className="text-sm font-medium">Couleur</label>
                <input
                  type="color"
                  className="w-full h-10 rounded-lg border"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData({ ...formData, color: e.target.value })
                  }
                />
              </div>

              <button className="btn btn-primary w-full">
                {modalMode === "create" ? "Créer" : "Mettre à jour"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && selectedTeam && (
        <div className="modal-overlay">
          <div className="modal-box max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl">Ajouter un membre</h2>
              <button
                onClick={() => {
                  setShowAddMember(false);
                  setSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
              />
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {searchResults.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  {searchQuery.length < 2 
                    ? "Tapez au moins 2 caractères pour rechercher"
                    : "Aucun résultat"}
                </p>
              ) : (
                searchResults.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{u.email}</p>
                    </div>

                    <button
                      onClick={() => addMember(u._id)}
                      className="btn btn-primary text-sm"
                    >
                      Ajouter
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Teams;
