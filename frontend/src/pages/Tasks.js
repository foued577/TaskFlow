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
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loading from "../components/Loading";
import TaskModal from "../components/TaskModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Tasks = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [taskView, setTaskView] = useState("all");

  const [filters, setFilters] = useState({
    projectId: "",
    status: "",
    priority: "",
  });

  const [isOverdueMode, setIsOverdueMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status");

    setIsOverdueMode(statusParam === "overdue");

    setFilters({
      projectId: "",
      status: statusParam && statusParam !== "overdue" ? statusParam : "",
      priority: "",
    });
  }, [location.search]);

  useEffect(() => {
    loadData();
  }, [filters, isOverdueMode, taskView, location.search]);

  const loadData = async () => {
    try {
      setLoading(true);

      const tasksRes = isOverdueMode
        ? await tasksAPI.getOverdue()
        : await tasksAPI.getAll();

      const projectsRes = await projectsAPI.getAll();

      let fetchedTasks = tasksRes.data.data || [];
      const fetchedProjects = projectsRes.data.data || [];

      // Filtrer côté client si nécessaire
      if (filters.projectId) {
        fetchedTasks = fetchedTasks.filter(t => t.project?._id === filters.projectId);
      }
      if (filters.status) {
        fetchedTasks = fetchedTasks.filter(t => t.status === filters.status);
      }
      if (filters.priority) {
        fetchedTasks = fetchedTasks.filter(t => t.priority === filters.priority);
      }

      // Filtrer pour les membres non-admin
      if (!isAdmin) {
        fetchedTasks = fetchedTasks.filter(task => {
          if (!task.assignedTo || task.assignedTo.length === 0) return true;
          return task.assignedTo.some(assignee => 
            assignee._id === user.id || assignee === user.id
          );
        });
      }

      // Trier
      fetchedTasks.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : null;
        const dateB = b.dueDate ? new Date(b.dueDate) : null;
        if (dateA && dateB) return dateA - dateB;
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
      });

      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Erreur lors du chargement des tâches:", error);
      toast.error(error.response?.data?.message || "Erreur lors du chargement des tâches");
      setTasks([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

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

  const updateTaskStatus = async (taskId, newStatus, task) => {
    if (!isAdmin && task.assignedTo && !task.assignedTo.some(a => a._id === user.id || a === user.id)) {
      toast.error("Vous n'êtes pas assigné à cette tâche");
      return;
    }

    try {
      await tasksAPI.update(taskId, { status: newStatus });
      toast.success("Statut mis à jour");
      loadData();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error(error.response?.data?.message || "Erreur lors de la mise à jour");
    }
  };

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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tâches</h1>
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

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <span className="font-medium">Filtres</span>
        </div>

        <div className="space-y-4">
          {/* Task View Toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => setTaskView("all")}
              className={`btn ${taskView === "all" ? "btn-primary" : "btn-secondary"}`}
            >
              Toutes les tâches
            </button>
            <button
              onClick={() => setTaskView("assigned")}
              className={`btn ${taskView === "assigned" ? "btn-primary" : "btn-secondary"}`}
            >
              Tâches où je suis assigné
            </button>
            {isAdmin && (
              <button
                onClick={() => setTaskView("created_not_assigned")}
                className={`btn ${taskView === "created_not_assigned" ? "btn-primary" : "btn-secondary"}`}
              >
                Créées par moi mais non assignées
              </button>
            )}
          </div>

          {/* Dropdown Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Projet</label>
              <select
                className="input"
                value={filters.projectId}
                onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              >
                <option value="">Tous les projets</option>
                {projects.map((project) => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Statut</label>
              <select
                className="input"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">Tous</option>
                <option value="not_started">Non démarrée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Priorité</label>
              <select
                className="input"
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
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
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="card text-center py-12">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h3>
          {isAdmin && (
            <button
              onClick={() => {
                setSelectedTask(null);
                setShowModal(true);
              }}
              className="btn btn-primary mt-3"
            >
              Créer une tâche
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{task.title}</h3>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {task.project && (
                        <div className="flex items-center">
                          <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: task.project.color }} />
                          {task.project.name}
                        </div>
                      )}

                      {task.dueDate && (
                        <div className="flex items-center">
                          <CalendarIcon className="w-4 h-4 mr-1" />
                          {format(new Date(task.dueDate), "dd MMM yyyy", { locale: fr })}
                        </div>
                      )}

                      {task.assignedTo && task.assignedTo.length > 0 && (
                        <div className="flex items-center">
                          {task.assignedTo.slice(0, 3).map((person, index) => (
                            <span
                              key={person._id || person || index}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold -ml-2 first:ml-0"
                              title={person.firstName && person.lastName ? `${person.firstName} ${person.lastName}` : ''}
                            >
                              {person.firstName ? person.firstName[0] : ''}
                              {person.lastName ? person.lastName[0] : ''}
                            </span>
                          ))}
                          {task.assignedTo.length > 3 && (
                            <span className="text-xs ml-1">+{task.assignedTo.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {!isAdmin && (
                    <div className="ml-4">
                      <select
                        className="input text-sm"
                        value={task.status}
                        onChange={(e) => updateTaskStatus(task._id, e.target.value, task)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="not_started">Non démarrée</option>
                        <option value="in_progress">En cours</option>
                        <option value="completed">Terminée</option>
                      </select>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowModal(false);
            setSelectedTask(null);
          }}
          onUpdate={handleTaskUpdate}
        />
      )}
    </div>
  );
};

export default Tasks;
