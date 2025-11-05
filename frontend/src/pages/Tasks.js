import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { tasksAPI, projectsAPI, usersAPI } from "../utils/api";
import { toast } from "react-toastify";
import {
  CheckSquare,
  Plus,
  Filter,
  Calendar as CalendarIcon,
  AlertCircle,
} from "lucide-react";
import Loading from "../components/Loading";
import TaskModal from "../components/TaskModal";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const Tasks = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user")); // ✅ utilisateur connecté

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]); // ✅ pour filtrer par utilisateur assigné
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    projectId: "",
    status: "",
    priority: "",
    assignedTo: "",
    createdBy: "",
    notAssignedToMe: "",
  });
  const [isOverdueMode, setIsOverdueMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status");
    setIsOverdueMode(statusParam === "overdue");
    if (statusParam && statusParam !== "overdue") {
      setFilters({ ...filters, status: statusParam });
    }
  }, [location]);

  useEffect(() => {
    loadData();
  }, [filters, isOverdueMode]);

  const loadData = async () => {
    try {
      let tasksRes = isOverdueMode
        ? await tasksAPI.getOverdue()
        : await tasksAPI.getAll(filters);

      const projectsRes = await projectsAPI.getAll();
      const usersRes = await usersAPI.getAll();

      let fetchedTasks = tasksRes.data.data;

      // ✅ Tri : date d’échéance → alphabétique
      fetchedTasks = fetchedTasks.sort((a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : null;
        const dateB = b.dueDate ? new Date(b.dueDate) : null;
        if (dateA && dateB) return dateA - dateB;
        if (dateA && !dateB) return -1;
        if (!dateA && dateB) return 1;
        return a.title.localeCompare(b.title, "fr", { sensitivity: "base" });
      });

      setTasks(fetchedTasks);
      setProjects(projectsRes.data.data);
      setUsers(usersRes.data.data);
    } catch (error) {
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleTaskUpdate = async () => {
    await loadData();
    setShowModal(false);
    setSelectedTask(null);
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await tasksAPI.update(taskId, { status: newStatus });
      toast.success("Statut mis à jour");
      loadData();
    } catch {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  const getPriorityColor = (priority) =>
    ({
      low: "bg-blue-100 text-blue-800",
      medium: "bg-yellow-100 text-yellow-800",
      high: "bg-orange-100 text-orange-800",
      urgent: "bg-red-100 text-red-800",
    }[priority] || "bg-yellow-100 text-yellow-800");

  const getStatusColor = (status) =>
    ({
      not_started: "bg-gray-100 text-gray-800",
      in_progress: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
    }[status] || "bg-gray-100 text-gray-800");

  const getStatusLabel = (status) =>
    ({
      not_started: "Non démarrée",
      in_progress: "En cours",
      completed: "Terminée",
    }[status] || status);

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {isOverdueMode ? "Tâches en retard" : "Tâches"}
        </h1>

        <button onClick={() => { setSelectedTask(null); setShowModal(true); }}
          className="btn btn-primary flex items-center">
          <Plus className="w-5 h-5 mr-2" /> Nouvelle tâche
        </button>
      </div>

      {/* ✅ Filtres */}
      {!isOverdueMode && (
        <div className="card mb-6 p-4">

          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Filter className="w-5 h-5 mr-2" /> Filtres
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

            {/* Projet */}
            <select className="input"
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}>
              <option value="">Tous les projets</option>
              {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>

            {/* Statut */}
            <select className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
              <option value="">Tous les statuts</option>
              <option value="not_started">Non démarrée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
            </select>

            {/* Priorité */}
            <select className="input"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">Toutes priorités</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>

            {/* ✅ Filtrer par utilisateur assigné */}
            <select className="input"
              value={filters.assignedTo}
              onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}>
              <option value="">Tous les assignés</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.firstName} {u.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Filtres intelligents */}
          <div className="flex gap-3 mt-4">
            <button className="btn btn-secondary"
              onClick={() => setFilters({ ...filters, assignedTo: user._id })}>
              Tâches où je suis assigné
            </button>

            <button className="btn btn-secondary"
              onClick={() => setFilters({ ...filters, createdBy: user._id })}>
              Tâches créées par moi
            </button>

            <button className="btn btn-secondary"
              onClick={() => setFilters({ ...filters, notAssignedToMe: "true" })}>
              Créées par moi mais non assignées à moi
            </button>
          </div>

        </div>
      )}

      {/* ✅ Liste tâches */}
      {tasks.length === 0 ? (
        <div className="card text-center py-12">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium">Aucune tâche</h3>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== "completed";

            return (
              <div key={task._id} onClick={() => handleTaskClick(task)} className="card hover:shadow-lg cursor-pointer">
                <div className="flex items-start justify-between">

                  <div className="flex-1">
                    <h3 className="text-lg font-bold">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.project?.name}</p>

                    {task.assignedTo.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {task.assignedTo.map((user) => (
                          <span key={user._id}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-purple-100 text-purple-800 text-xs font-semibold">
                            {user.firstName[0]}{user.lastName[0]}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>

                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}</span>

                      {task.dueDate && (
                        <span className={`badge flex items-center ${isOverdue ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-700"}`}>
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {format(new Date(task.dueDate), "dd MMM yyyy", { locale: fr })}
                          {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
                        </span>
                      )}
                    </div>
                  </div>

                  <select value={task.status}
                    onChange={(e) => updateTaskStatus(task._id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm border rounded-lg px-2 py-1">

                    <option value="not_started">Non démarrée</option>
                    <option value="in_progress">En cours</option>
                    <option value="completed">Terminée</option>
                  </select>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => { setShowModal(false); setSelectedTask(null); }}
          onSave={handleTaskUpdate}
        />
      )}
    </div>
  );
};

export default Tasks;
