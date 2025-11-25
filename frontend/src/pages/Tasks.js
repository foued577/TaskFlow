// 🚀 FILE: src/pages/Tasks.js (VERSION CORRIGÉE & COMPLÈTE)

import React, { useState, useEffect } from "react";
import {
  tasksAPI,
  projectsAPI,
  usersAPI,
  teamsAPI,
} from "../utils/api";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Trash2,
  X,
  Calendar as CalendarIcon,
  Users,
  CheckSquare,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import Loading from "../components/Loading";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const Tasks = () => {
  const { user } = useAuth();

  // === ROLE GLOBAL ===
  const isAdmin = !user?.role || user.role === "admin";

  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);

  const [projects, setProjects] = useState([]);
  const [teams, setTeams] = useState([]);

  // === MODAL ===
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [selectedTask, setSelectedTask] = useState(null);

  // === FILTERS ===
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  const filterStatus = urlParams.get("status");

  // === FORM DATA ===
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: [],
    dueDate: "",
    priority: "medium",
    status: "not_started",
    tags: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes, teamsRes] = await Promise.all([
        tasksAPI.getAll(filterStatus ? { status: filterStatus } : {}),
        projectsAPI.getAll(),
        teamsAPI.getAll(),
      ]);

      setTasks(tasksRes.data.data);
      setProjects(projectsRes.data.data);
      setTeams(teamsRes.data.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  };

  // === OPEN CREATE MODAL ===
  const openCreateModal = () => {
    if (!isAdmin) {
      toast.error("Vous n’avez pas les droits pour créer une tâche");
      return;
    }
    setModalMode("create");
    resetForm();
    setShowModal(true);
  };

  // === OPEN EDIT MODAL ===
  const openEditModal = (task) => {
    if (!isAdmin) {
      toast.error("Vous n’avez pas les droits pour modifier une tâche");
      return;
    }

    setModalMode("edit");
    setSelectedTask(task);

    setFormData({
      title: task.title,
      description: task.description || "",
      projectId: task.project?._id || "",
      assignedTo: task.assignedTo?.map((u) => u._id) || [],
      dueDate: task.dueDate
        ? format(new Date(task.dueDate), "yyyy-MM-dd")
        : "",
      priority: task.priority || "medium",
      status: task.status || "not_started",
      tags: Array.isArray(task.tags) ? task.tags.join(", ") : "",
    });

    setShowModal(true);
  };

  // === RESET FORM ===
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      projectId: "",
      assignedTo: [],
      dueDate: "",
      priority: "medium",
      status: "not_started",
      tags: "",
    });
  };

  // === HANDLE SUBMIT ===
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAdmin) {
      toast.error("Vous n'avez pas les droits");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Le titre est obligatoire");
      return;
    }

    try {
      const data = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (modalMode === "create") {
        await tasksAPI.create(data);
        toast.success("Tâche créée avec succès");
      } else {
        await tasksAPI.update(selectedTask._id, data);
        toast.success("Tâche mise à jour");
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error("Erreur lors de l’enregistrement");
    }
  };

  // === DELETE ===
  const deleteTask = async (id) => {
    if (!isAdmin) {
      toast.error("Vous n’avez pas les droits");
      return;
    }
    if (!window.confirm("Voulez-vous supprimer cette tâche ?")) return;

    try {
      await tasksAPI.delete(id);
      toast.success("Tâche supprimée");
      loadData();
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // === BADGES ===
  const getPriorityColor = (priority) => {
    const colors = {
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    };
    return colors[status] || colors.not_started;
  };

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tâches</h1>

        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="btn btn-primary flex items-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvelle tâche
          </button>
        )}
      </div>

      {/* LIST */}
      {tasks.length === 0 ? (
        <div className="card text-center py-10">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">Aucune tâche trouvée</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task._id}
              className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition"
            >
              {/* TOP */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {task.title}
                  </h3>

                  {task.project && (
                    <p className="text-sm text-gray-500">
                      Projet :{" "}
                      <span className="font-medium">{task.project.name}</span>
                    </p>
                  )}
                </div>

                {isAdmin && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => openEditModal(task)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => deleteTask(task._id)}
                      className="p-2 text-red-400 hover:text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* PRIORITY + STATUS */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>

                <span className={`badge ${getStatusColor(task.status)}`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>

              {/* ASSIGNED USERS */}
              {task.assignedTo?.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  {task.assignedTo.map((person) => (
                    <span
                      key={person._id}
                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold"
                      title={`${person.firstName} ${person.lastName}`}
                    >
                      {person.firstName?.charAt(0)}
                      {person.lastName?.charAt(0)}
                    </span>
                  ))}
                </div>
              )}

              {/* DUE DATE */}
              {task.dueDate && (
                <p className="text-sm text-gray-500 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {formatDistanceToNow(new Date(task.dueDate), {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* === MODAL === */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                {modalMode === "create" ? "Nouvelle tâche" : "Modifier la tâche"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* TITLE */}
              <div>
                <label className="block text-sm mb-2 font-medium">Titre</label>
                <input
                  type="text"
                  className="input"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  disabled={!isAdmin}
                />
              </div>

              {/* PROJECT */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Projet
                </label>
                <select
                  className="input"
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  disabled={!isAdmin}
                >
                  <option value="">Sélectionner...</option>
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ASSIGNED USERS */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Utilisateurs assignés
                </label>
                <div className="border p-3 rounded-lg max-h-40 overflow-y-auto space-y-1">
                  {teams.map((team) =>
                    team.members.map((m) => (
                      <label
                        key={m.user._id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="rounded border-gray-300"
                          checked={formData.assignedTo.includes(m.user._id)}
                          onChange={() => {
                            if (!isAdmin) return;

                            setFormData((prev) => {
                              const exists = prev.assignedTo.includes(
                                m.user._id
                              );
                              return {
                                ...prev,
                                assignedTo: exists
                                  ? prev.assignedTo.filter(
                                      (id) => id !== m.user._id
                                    )
                                  : [...prev.assignedTo, m.user._id],
                              };
                            });
                          }}
                          disabled={!isAdmin}
                        />
                        <span>
                          {m.user.firstName} {m.user.lastName}
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Description
                </label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={!isAdmin}
                />
              </div>

              {/* DUE DATE */}
              <div>
                <label className="block text-sm mb-2 font-medium">
                  Date limite
                </label>
                <input
                  type="date"
                  className="input"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  disabled={!isAdmin}
                />
              </div>

              {/* PRIORITY */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Priorité
                </label>
                <select
                  className="input"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  disabled={!isAdmin}
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              {/* STATUS */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Statut
                </label>
                <select
                  className="input"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  disabled={!isAdmin}
                >
                  <option value="not_started">Non commencée</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminée</option>
                </select>
              </div>

              {/* TAGS */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Tags (séparés par des virgules)
                </label>
                <input
                  type="text"
                  className="input"
                  value={formData.tags}
                  onChange={(e) =>
                    setFormData({ ...formData, tags: e.target.value })
                  }
                  disabled={!isAdmin}
                  placeholder="frontend, urgent, design"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn btn-primary disabled:opacity-50"
                  disabled={!isAdmin}
                >
                  {modalMode === "create"
                    ? "Créer la tâche"
                    : "Mettre à jour"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 btn btn-secondary"
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

export default Tasks;
