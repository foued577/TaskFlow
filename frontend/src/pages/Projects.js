import React, { useState, useEffect } from "react";
import { projectsAPI, teamsAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
  FolderKanban,
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Users,
} from "lucide-react";
import Loading from "../components/Loading";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";

const Projects = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsRes, teamsRes] = await Promise.all([
        projectsAPI.getAll(),
        teamsAPI.getAll(),
      ]);

      const projects = projectsRes.data.data || [];
      const sortedProjects = projects.sort((a, b) =>
        a.name.localeCompare(b.name, "fr", { sensitivity: "base" })
      );

      setProjects(sortedProjects);
      setTeams(teamsRes.data.data || []);
    } catch (error) {
      console.error("Erreur détaillée:", error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "Erreur lors du chargement des projets";
      toast.error(errorMessage);
      
      // Si erreur d'authentification, rediriger vers login
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
      
      setProjects([]);
      setTeams([]);
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
    if (!isAdmin) return toast.error("Action limitée aux administrateurs");
    resetForm();
    setSelectedProject(null);
    setModalMode("create");
    setShowModal(true);
  };

  const openEditModal = (project) => {
    if (!isAdmin) return toast.error("Action limitée aux administrateurs");

    // Gérer team (ancien) ou teams (nouveau)
    const teamIds = project.teams && project.teams.length > 0
      ? project.teams.map((t) => t._id || t)
      : project.team
      ? [project.team._id || project.team]
      : [];

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
      tags: Array.isArray(project.tags) ? project.tags.join(", ") : "",
    });

    setSelectedProject(project);
    setModalMode("edit");
    setShowModal(true);
  };

  const toggleTeamSelection = (teamId) => {
    setFormData((prev) => {
      const exists = prev.teamIds.includes(teamId);
      return {
        ...prev,
        teamIds: exists
          ? prev.teamIds.filter((id) => id !== teamId)
          : [...prev.teamIds, teamId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return toast.error("Action limitée aux administrateurs");

    if (!formData.name.trim()) return toast.error("Nom obligatoire");
    if (formData.teamIds.length === 0)
      return toast.error("Sélectionnez au moins une équipe");

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
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (modalMode === "create") {
        await projectsAPI.create(data);
        toast.success("Projet créé");
      } else {
        await projectsAPI.update(selectedProject._id, data);
        toast.success("Projet modifié");
      }

      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast.error(error.response?.data?.message || "Erreur serveur");
    }
  };

  const deleteProject = async (id) => {
    if (!isAdmin) return toast.error("Action réservée aux administrateurs");
    if (!window.confirm("Supprimer ce projet ?")) return;

    try {
      await projectsAPI.delete(id);
      toast.success("Projet supprimé");
      loadData();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      toast.error(error.response?.data?.message || "Erreur lors de la suppression");
    }
  };

  const getPriorityColor = (priority) =>
    ({
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }[priority] || "bg-gray-100 text-gray-800");

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projets</h1>

        {isAdmin && (
          <button className="btn btn-primary flex items-center" onClick={openCreateModal}>
            <Plus className="w-5 h-5 mr-2" /> Nouveau projet
          </button>
        )}
      </div>

      {/* LISTE */}
      {projects.length === 0 ? (
        <div className="card text-center py-12">
          <FolderKanban className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium">Aucun projet</h3>

          {isAdmin && (
            <button className="btn btn-primary mt-4" onClick={openCreateModal}>
              Créer un projet
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            // Gérer team (ancien) ou teams (nouveau)
            const projectTeams =
              (project.teams && project.teams.length > 0
                ? project.teams
                : project.team
                ? [project.team]
                : []) || [];

            return (
              <div key={project._id} className="card hover:shadow-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-12 rounded-l-lg mr-3"
                      style={{ background: project.color || "#10B981" }}
                    />
                    <div>
                      <h3 className="text-lg font-bold">{project.name}</h3>

                      {/* Teams */}
                      {projectTeams.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1 mt-1">
                          <Users className="w-3 h-3 text-gray-400 mr-1" />
                          {projectTeams.slice(0, 2).map((team, index) => {
                            const teamName = team.name || (typeof team === 'string' ? team : '');
                            const teamId = team._id || team || index;
                            
                            return (
                              <span key={teamId} className="badge text-xs bg-gray-100">
                                {teamName}
                              </span>
                            );
                          })}
                          {projectTeams.length > 2 && (
                            <span className="badge bg-gray-50 text-gray-500 text-xs">
                              +{projectTeams.length - 2} autres
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {isAdmin && (
                    <div className="flex space-x-1">
                      <button
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                        onClick={() => openEditModal(project)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        onClick={() => deleteProject(project._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}
                {project.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                )}

                {/* PRIORITÉ */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge ${getPriorityColor(project.priority || "medium")}`}>
                    {project.priority || "medium"}
                  </span>
                  <span
                    className={`badge ${
                      project.status === "active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {project.status || "active"}
                  </span>
                </div>

                {/* DATES */}
                {(project.startDate || project.endDate) && (
                  <div className="border-t pt-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {project.startDate &&
                        format(new Date(project.startDate), "dd MMM", { locale: fr })}
                      {project.startDate && project.endDate && " - "}
                      {project.endDate &&
                        format(new Date(project.endDate), "dd MMM yyyy", { locale: fr })}
                    </div>
                  </div>
                )}

                {/* TAGS */}
                {project.tags && project.tags.length > 0 && (
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

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === "create" ? "Nouveau projet" : "Modifier le projet"}
              </h2>
              <button className="text-gray-500" onClick={() => setShowModal(false)}>
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* NAME */}
              <div>
                <label className="text-sm font-medium">Nom du projet</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* TEAMS */}
              <div>
                <label className="text-sm font-medium">Équipes</label>
                {teams.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2">
                    Aucune équipe disponible. Créez d'abord une équipe.
                  </p>
                ) : (
                  <div className="border border-gray-200 p-3 rounded-lg max-h-40 overflow-y-auto space-y-2">
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
                )}
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
              </div>

              {/* DATES */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Début</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Fin</label>
                  <input
                    type="date"
                    className="input"
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* PRIORITÉ & COULEUR */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priorité</label>
                  <select
                    className="input"
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value })
                    }
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium">Couleur</label>
                  <input
                    type="color"
                    className="w-full h-10 rounded-lg"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>
              </div>

              {/* TAGS */}
              <div>
                <label className="text-sm font-medium">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  className="input"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="frontend, urgent, bug"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full">
                {modalMode === "create" ? "Créer" : "Enregistrer"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
