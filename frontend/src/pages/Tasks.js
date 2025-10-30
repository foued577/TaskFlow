import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { CheckSquare, Plus, Filter, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import Loading from '../components/Loading';
import TaskModal from '../components/TaskModal';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    projectId: '',
    status: '',
    priority: '',
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        tasksAPI.getAll(filters),
        projectsAPI.getAll(),
      ]);
      setTasks(tasksRes.data.data);
      setProjects(projectsRes.data.data);
    } catch (error) {
      toast.error('Erreur lors du chargement');
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
      toast.success('Statut mis à jour');
      loadData();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority] || colors.medium;
  };

  const getStatusColor = (status) => {
    const colors = {
      not_started: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
    };
    return colors[status] || colors.not_started;
  };

  const getStatusLabel = (status) => {
    const labels = {
      not_started: 'Non démarrée',
      in_progress: 'En cours',
      completed: 'Terminée',
    };
    return labels[status] || status;
  };

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tâches</h1>
        <button
          onClick={() => {
            setSelectedTask(null);
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nouvelle tâche
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center mb-4">
          <Filter className="w-5 h-5 mr-2 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filtres</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
            <select
              value={filters.projectId}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value })}
              className="input"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input"
            >
              <option value="">Tous les statuts</option>
              <option value="not_started">Non démarrée</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminée</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="input"
            >
              <option value="">Toutes les priorités</option>
              <option value="low">Basse</option>
              <option value="medium">Moyenne</option>
              <option value="high">Haute</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {tasks.length === 0 ? (
        <div className="card text-center py-12">
          <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune tâche</h3>
          <p className="text-gray-600 mb-4">Créez votre première tâche</p>
          <button
            onClick={() => {
              setSelectedTask(null);
              setShowModal(true);
            }}
            className="btn btn-primary"
          >
            Créer une tâche
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {tasks.map((task) => {
            const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
            
            return (
              <div
                key={task._id}
                onClick={() => handleTaskClick(task)}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <div
                        className="w-1 h-16 rounded-l-lg mr-4"
                        style={{ backgroundColor: task.project?.color || '#3B82F6' }}
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{task.title}</h3>
                        <p className="text-sm text-gray-600">{task.project?.name}</p>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 ml-5">
                        {task.description}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2 ml-5">
                      <span className={`badge ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      <span className={`badge ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>

                      {task.dueDate && (
                        <span className={`badge flex items-center ${
                          isOverdue ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          <CalendarIcon className="w-3 h-3 mr-1" />
                          {format(new Date(task.dueDate), 'dd MMM yyyy', { locale: fr })}
                          {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
                        </span>
                      )}

                      {task.estimatedHours > 0 && (
                        <span className="badge bg-purple-100 text-purple-800">
                          {task.estimatedHours}h estimées
                        </span>
                      )}

                      {task.subtasks && task.subtasks.length > 0 && (
                        <span className="badge bg-indigo-100 text-indigo-800">
                          {task.subtasks.filter(st => st.isCompleted).length}/{task.subtasks.length} sous-tâches
                        </span>
                      )}
                    </div>

                    {task.assignedTo && task.assignedTo.length > 0 && (
                      <div className="flex items-center mt-3 ml-5">
                        <div className="flex -space-x-2">
                          {task.assignedTo.slice(0, 3).map((user) => (
                            <div
                              key={user._id}
                              className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white"
                              title={`${user.firstName} ${user.lastName}`}
                            >
                              {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                            </div>
                          ))}
                          {task.assignedTo.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 text-xs font-semibold border-2 border-white">
                              +{task.assignedTo.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quick Status Update */}
                  <div className="ml-4">
                    <select
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        updateTaskStatus(task._id, e.target.value);
                      }}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="not_started">Non démarrée</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminée</option>
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          projects={projects}
          onClose={() => {
            setShowModal(false);
            setSelectedTask(null);
          }}
          onSave={handleTaskUpdate}
        />
      )}
    </div>
  );
};

export default Tasks;
