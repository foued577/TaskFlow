import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import { Plus, Filter } from 'lucide-react';
import Loading from '../components/Loading';
import TaskModal from '../components/TaskModal';

const Kanban = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [draggedTask, setDraggedTask] = useState(null);

  const columns = [
    { id: 'not_started', title: 'Non démarrée', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'En cours', color: 'bg-blue-100' },
    { id: 'completed', title: 'Terminée', color: 'bg-green-100' },
  ];

  useEffect(() => {
    loadData();
  }, [selectedProject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        tasksAPI.getAll(),
        projectsAPI.getAll(),
      ]);

      let fetchedTasks = tasksRes.data.data || [];
      const fetchedProjects = projectsRes.data.data || [];

      // Filtrer par projet si sélectionné
      if (selectedProject) {
        fetchedTasks = fetchedTasks.filter(task => 
          task.project && (task.project._id === selectedProject || task.project === selectedProject)
        );
      }

      setTasks(fetchedTasks);
      setProjects(fetchedProjects);
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast.error(error.response?.data?.message || 'Erreur lors du chargement');
      setTasks([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const handleDragStart = (e, task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, newStatus) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      await tasksAPI.update(draggedTask._id, { status: newStatus });
      toast.success('Statut mis à jour');
      loadData();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    } finally {
      setDraggedTask(null);
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
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

  if (loading) return <Loading fullScreen={false} />;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tableau Kanban</h1>
        <button
          onClick={() => {
            setSelectedTask(null);
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" /> Nouvelle tâche
        </button>
      </div>

      {/* Project Filter */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            className="input"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
          >
            <option value="">Tous les projets</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const columnTasks = getTasksByStatus(column.id);
          
          return (
            <div
              key={column.id}
              className={`${column.color} rounded-lg p-4 min-h-[500px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg">{column.title}</h2>
                <span className="badge bg-white text-gray-700">
                  {columnTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">Aucune tâche</p>
                    <p className="text-xs mt-1">Glissez-déposez une tâche ici</p>
                  </div>
                ) : (
                  columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => handleTaskClick(task)}
                      className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        <span className={`badge ${getPriorityColor(task.priority)} text-xs`}>
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {task.project && (
                        <div className="flex items-center text-xs text-gray-500 mb-2">
                          <span
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: task.project.color }}
                          />
                          {task.project.name}
                        </div>
                      )}

                      {task.assignedTo && task.assignedTo.length > 0 && (
                        <div className="flex items-center gap-1">
                          {task.assignedTo.slice(0, 3).map((person, index) => (
                            <span
                              key={person._id || person || index}
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-800 text-xs font-semibold"
                              title={person.firstName && person.lastName ? `${person.firstName} ${person.lastName}` : ''}
                            >
                              {person.firstName ? person.firstName[0] : ''}
                              {person.lastName ? person.lastName[0] : ''}
                            </span>
                          ))}
                          {task.assignedTo.length > 3 && (
                            <span className="text-xs text-gray-500">+{task.assignedTo.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Modal */}
      {showModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => {
            setShowModal(false);
            setSelectedTask(null);
          }}
          onUpdate={loadData}
        />
      )}
    </div>
  );
};

export default Kanban;
