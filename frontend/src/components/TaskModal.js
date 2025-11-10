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

  // Charger la tâche/les commentaires
  useEffect(() => {
    if (!task) return;
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
      tags: (task.tags || []).join(', '),
    });
    setSubtasks(task.subtasks || []);
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task?._id]);

  const loadComments = async () => {
    if (!task) return;
    try {
      const res = await commentsAPI.getForTask(task._id);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Failed to load comments:', err);
    }
  };

  // Création / mise à jour
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
      };

      if (task) {
        await tasksAPI.update(task._id, payload);
        toast.success('Tâche mise à jour');
      } else {
        await tasksAPI.create(payload);
        toast.success('Tâche créée avec succès');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Suppression
  const deleteTask = async () => {
    if (!task) return;
    if (!window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;
    try {
      await tasksAPI.delete(task._id);
      toast.success('Tâche supprimée');
      onSave();
    } catch (err) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Sous-tâches
  const addSubtask = async () => {
    if (!task || !newSubtask.trim()) return;
    try {
      await tasksAPI.addSubtask(task._id, newSubtask.trim());
      setNewSubtask('');
      const refreshed = await tasksAPI.getOne(task._id);
      setSubtasks(refreshed.data.data.subtasks || []);
      toast.success('Sous-tâche ajoutée');
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const toggleSubtask = async (subtaskId) => {
    if (!task) return;
    try {
      await tasksAPI.toggleSubtask(task._id, subtaskId);
      const refreshed = await tasksAPI.getOne(task._id);
      setSubtasks(refreshed.data.data.subtasks || []);
    } catch {
      toast.error('Erreur');
    }
  };

  // Commentaires (+ détection simple des @mentions côté UI)
  const addComment = async () => {
    if (!task || !newComment.trim()) return;
    try {
      await commentsAPI.create({
        taskId: task._id,
        content: newComment.trim(),
      });
      setNewComment('');
      await loadComments();
      toast.success('Commentaire ajouté');
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  // Recherche d’utilisateurs
  const searchUsers = async (query) => {
    setSearchQuery(query);
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      // si besoin: usersAPI.search(query, teamId)
      const res = await usersAPI.search(query);
      setSearchResults(res.data.data || []);
    } catch (err) {
      console.error('Search error:', err);
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

  // Helpers UI
  const displayAssigned = () => {
    // Quand on édite, task.assignedTo contient déjà les objets utilisateurs
    // mais si c’est une création, on n’a que les ids; on affiche juste le compteur.
    const users =
      (task?.assignedTo || []).filter((u) => formData.assignedTo.includes(u._id));
    if (!users.length) {
      return (
        <div className="text-sm text-gray-500">
          {formData.assignedTo.length} utilisateur(s) assigné(s)
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {users.map((u) => (
          <span
            key={u._id}
            className="inline-flex items-center px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs font-medium"
          >
            {u.firstName} {u.lastName}
            <button
              type="button"
              onClick={() => removeAssignee(u._id)}
              className="ml-2 text-purple-700 hover:text-purple-900"
              title="Retirer"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    );
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
                type="button"
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} type="button" className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
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
                  placeholder="Rechercher un utilisateur…"
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((u) => (
                      <button
                        key={u._id}
                        type="button"
                        onClick={() => addAssignee(u._id)}
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold mr-2">
                          {u.firstName?.charAt(0)}
                          {u.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {displayAssigned()}
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
                  {subtasks.map((s) => (
                    <div key={s._id} className="flex items-center p-2 border border-gray-200 rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleSubtask(s._id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          s.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}
                        title={s.isCompleted ? 'Marquer non terminée' : 'Marquer terminée'}
                      >
                        {s.isCompleted && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 ${s.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {s.title}
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
                    placeholder="Nouvelle sous-tâche…"
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
                  {comments.map((c) => (
                    <div key={c._id} className="p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold mr-2">
                          {c.user?.firstName?.charAt(0)}
                          {c.user?.lastName?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {c.user?.firstName} {c.user?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(c.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{c.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="input"
                    placeholder="Ajouter un commentaire… (astuce : @Nom pour mentionner)"
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

            {/* Footer */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
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
