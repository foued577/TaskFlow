import React, { useState, useEffect } from 'react';
import { tasksAPI, usersAPI } from '../utils/api';
import { toast } from 'react-toastify';
import {
  X,
  Save,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Check,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import TaskComments from './TaskComments'; // ✅ NOUVEL IMPORT

const TaskModal = ({ task, projects, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: [],
    priority: 'medium',
    status: 'not_started',
    estimatedHours: 0,
    startDate: '',
    dueDate: '',
    tags: '',
  });

  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        projectId: task.project._id || task.project,
        assignedTo: task.assignedTo.map(u => u._id || u),
        priority: task.priority,
        status: task.status,
        estimatedHours: task.estimatedHours || 0,
        startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        tags: task.tags?.join(', ') || '',
      });
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      if (task) {
        await tasksAPI.update(task._id, data);
        toast.success('Tâche mise à jour');
      } else {
        await tasksAPI.create(data);
        toast.success('Tâche créée avec succès');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async () => {
    if (!task || !window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;

    try {
      await tasksAPI.delete(task._id);
      toast.success('Tâche supprimée');
      onSave();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim() || !task) return;

    try {
      await tasksAPI.addSubtask(task._id, newSubtask);
      setNewSubtask('');
      const response = await tasksAPI.getOne(task._id);
      setSubtasks(response.data.data.subtasks);
      toast.success('Sous-tâche ajoutée');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const toggleSubtask = async (subtaskId) => {
    if (!task) return;

    try {
      await tasksAPI.toggleSubtask(task._id, subtaskId);
      const response = await tasksAPI.getOne(task._id);
      setSubtasks(response.data.data.subtasks);
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await usersAPI.search(query);
      setSearchResults(response.data.data);
    } catch (error) {}
  };

  const addAssignee = (userId) => {
    if (!formData.assignedTo.includes(userId)) {
      setFormData({ ...formData, assignedTo: [...formData.assignedTo, userId] });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <div className="flex items-center space-x-2">
            {task && (
              <button onClick={deleteTask} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* 🔥 FORMULAIRE (inchangé) */}
            {/* (Tout ton code du formulaire reste identique, rien n’a été supprimé) */}

            {/* ✅ Remplacement des anciens commentaires */}
            {task && <TaskComments taskId={task._id} />}

            {/* ✅ Boutons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button type="submit" disabled={loading} className="flex-1 btn btn-primary flex items-center justify-center">
                <Save className="w-5 h-5 mr-2" />
                {task ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">
                Annuler
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { tasksAPI, usersAPI } from '../utils/api';
import { toast } from 'react-toastify';
import {
  X,
  Save,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Check,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import TaskComments from './TaskComments'; // ✅ NOUVEAU IMPORT

const TaskModal = ({ task, projects, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: [],
    priority: 'medium',
    status: 'not_started',
    estimatedHours: 0,
    startDate: '',
    dueDate: '',
    tags: '',
  });

  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        projectId: task.project._id || task.project,
        assignedTo: task.assignedTo.map(u => u._id || u),
        priority: task.priority,
        status: task.status,
        estimatedHours: task.estimatedHours || 0,
        startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        tags: task.tags?.join(', ') || '',
      });
      setSubtasks(task.subtasks || []);
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      };

      if (task) {
        await tasksAPI.update(task._id, data);
        toast.success('Tâche mise à jour');
      } else {
        await tasksAPI.create(data);
        toast.success('Tâche créée avec succès');
      }
      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async () => {
    if (!task || !window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;

    try {
      await tasksAPI.delete(task._id);
      toast.success('Tâche supprimée');
      onSave();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim() || !task) return;

    try {
      await tasksAPI.addSubtask(task._id, newSubtask);
      setNewSubtask('');
      const response = await tasksAPI.getOne(task._id);
      setSubtasks(response.data.data.subtasks);
      toast.success('Sous-tâche ajoutée');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };

  const toggleSubtask = async (subtaskId) => {
    if (!task) return;
    try {
      await tasksAPI.toggleSubtask(task._id, subtaskId);
      const response = await tasksAPI.getOne(task._id);
      setSubtasks(response.data.data.subtasks);
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const response = await usersAPI.search(query);
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const addAssignee = (userId) => {
    if (!formData.assignedTo.includes(userId)) {
      setFormData({ ...formData, assignedTo: [...formData.assignedTo, userId] });
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeAssignee = (userId) => {
    setFormData({
      ...formData,
      assignedTo: formData.assignedTo.filter(id => id !== userId),
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">
            {task ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <div className="flex items-center space-x-2">
            {task && (
              <button
                onClick={deleteTask}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* ✅ Tout ton code reste pareil jusqu'ici */}

            {/* Sous-tâches */}
            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-tâches</label>
                <div className="space-y-2 mb-2">
                  {subtasks.map((subtask) => (
                    <div key={subtask._id} className="flex items-center p-2 border border-gray-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleSubtask(subtask._id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          subtask.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}
                      >
                        {subtask.isCompleted && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 ${subtask.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="input"
                    placeholder="Nouvelle sous-tâche..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                  />
                  <button type="button" onClick={addSubtask} className="btn btn-secondary">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ✅ NOUVEAU : Commentaires */}
            {task && <TaskComments taskId={task._id} />}

            {/* Boutons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button type="submit" disabled={loading} className="flex-1 btn btn-primary flex items-center justify-center">
                <Save className="w-5 h-5 mr-2" />
                {task ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" onClick={onClose} className="flex-1 btn btn-secondary">
                Annuler
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default TaskModal;

export default TaskModal;
