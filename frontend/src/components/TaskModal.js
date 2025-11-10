import React, { useState, useEffect } from 'react';
import { tasksAPI, usersAPI, commentsAPI } from '../utils/api';
import { toast } from 'react-toastify';
import {
  X,
  Save,
  Trash2,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Users,
  MessageSquare,
  Check,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const [comments, setComments] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newComment, setNewComment] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        projectId: task.project._id || task.project,
        assignedTo: (task.assignedTo || []).map((u) => u._id || u),
        priority: task.priority || 'medium',
        status: task.status || 'not_started',
        estimatedHours: task.estimatedHours || 0,
        startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        tags: task.tags?.join(', ') || '',
      });
      setSubtasks(task.subtasks || []);
      loadComments(task._id);
    } else {
      // reset pour création
      setFormData((prev) => ({
        ...prev,
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
      }));
      setSubtasks([]);
      setComments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  const loadComments = async (taskId) => {
    try {
      const response = await commentsAPI.getForTask(taskId);
      setComments(response.data.data || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
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
      toast.error(error?.response?.data?.message || 'Une erreur est survenue');
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
      await tasksAPI.addSubtask(task._id, newSubtask.trim());
      setNewSubtask('');
      const response = await tasksAPI.getOne(task._id);
      setSubtasks(response.data.data.subtasks || []);
      toast.success('Sous-tâche ajoutée');
    } catch (error) {
      toast.error("Erreur lors de l'ajout de la sous-tâche");
    }
  };

  const toggleSubtask = async (subtaskId) => {
    if (!task) return;

    try {
      await tasksAPI.toggleSubtask(task._id, subtaskId);
      const response = await tasksAPI.getOne(task._id);
      setSubtasks(response.data.data.subtasks || []);
    } catch (error) {
      toast.error('Erreur lors du changement de statut de la sous-tâche');
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !task) return;

    try {
      await commentsAPI.create({ taskId: task._id, content: newComment.trim() });
      setNewComment('');
      await loadComments(task._id);
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  const searchUsers = async (query) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await usersAPI.search(query.trim());
      setSearchResults(res.data.data || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const addAssignee = (userId) => {
    if (!formData.assignedTo.includes(userId)) {
      setFormData((prev) => ({ ...prev, assignedTo: [...prev.assignedTo, userId] }));
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeAssignee = (userId) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo.filter((id) => id !== userId),
    }));
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
                type="button"
                onClick={deleteTask}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                aria-label="Supprimer la tâche"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Fermer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input text-lg font-semibold"
                required
              />
            </div>

            {/* Project and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Projet</label>
                <select
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Sélectionner un projet</option>
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
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input"
                >
                  <option value="not_started">Non démarrée</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminée</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={4}
              />
            </div>

            {/* Priority and Estimated Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priorité</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  Estimation (heures)
                </label>
                <input
                  type="number"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedHours: parseFloat(e.target.value || 0) })
                  }
                  className="input"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Date de début
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  Date d'échéance
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input"
                />
              </div>
            </div>

            {/* Assigned Users */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Assigner à
              </label>

              {/* Search Users */}
              <div className="relative mb-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => searchUsers(e.target.value)}
                  className="input"
                  placeholder="Rechercher un utilisateur..."
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => addAssignee(user._id)}
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold mr-2">
                          {(user.firstName || '').charAt(0)}
                          {(user.lastName || '').charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Assigned Users List */}
              <div className="flex flex-wrap gap-2">
                {formData.assignedTo.length === 0 ? (
                  <span className="text-sm text-gray-500">Aucun utilisateur assigné</span>
                ) : (
                  formData.assignedTo.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-full text-sm"
                    >
                      <span className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs">
                        {/* Affichage minimal des initiales (id tronqué si pas d'objets complets) */}
                        {String(id).slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-gray-700">{String(id)}</span>
                      <button
                        type="button"
                        className="text-gray-500 hover:text-red-600"
                        onClick={() => removeAssignee(id)}
                        aria-label="Retirer l'utilisateur"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (séparés par des virgules)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input"
                placeholder="frontend, urgent, bug"
              />
            </div>

            {/* Subtasks */}
            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-tâches
                </label>
                <div className="space-y-2 mb-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask._id}
                      className="flex items-center p-2 border border-gray-200 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtask(subtask._id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          subtask.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}
                        aria-label="Changer le statut de la sous-tâche"
                      >
                        {subtask.isCompleted && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span
                        className={`flex-1 ${
                          subtask.isCompleted ? 'line-through text-gray-500' : ''
                        }`}
                      >
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSubtask();
                      }
                    }}
                  />
                  <button type="button" onClick={addSubtask} className="btn btn-secondary">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Comments */}
            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1" />
                  Commentaires ({comments.length})
                </label>

                <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment._id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold mr-2">
                          {(comment.user?.firstName || '').charAt(0)}
                          {(comment.user?.lastName || '').charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {comment.user?.firstName} {comment.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'dd MMM yyyy à HH:mm', {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="input"
                    placeholder="Ajouter un commentaire... (Entrée pour envoyer)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addComment();
                      }
                    }}
                  />
                  <button type="button" onClick={addComment} className="btn btn-secondary">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex space-x-3 pt-4 border-top border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn btn-primary flex items-center justify-center"
              >
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
