voila mon code taskmodal.js corriger  et donner moi tous le code complet :
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
        assignedTo: task.assignedTo.map(u => u._id || u),
        priority: task.priority,
        status: task.status,
        estimatedHours: task.estimatedHours || 0,
        startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
        tags: task.tags?.join(', ') || '',
      });
      setSubtasks(task.subtasks || []);
      loadComments();
    }
  }, [task]);

  const loadComments = async () => {
    if (!task) return;
    try {
      const response = await commentsAPI.getForTask(task._id);
      setComments(response.data.data);
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
      toast.error("Erreur lors de l'ajout");
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

  // ✅ Mention system : convertir @Nom → ID des utilisateurs
  const addComment = async () => {
    if (!newComment.trim() || !task) return;

    try {
      const mentionMatches = newComment.match(/@(\w+)/g) || [];
      const mentionedUserIds = [];

      for (const mention of mentionMatches) {
        const username = mention.substring(1);
        const res = await usersAPI.search(username);
        if (res.data.data[0]) {
          mentionedUserIds.push(res.data.data[0]._id);
        }
      }

      await commentsAPI.create({
        taskId: task._id,
        content: newComment,
        mentions: mentionedUserIds
      });

      setNewComment('');
      loadComments();
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error("Erreur lors de l'ajout");
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
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

        {/* BODY */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Titre</label>
              <input type="text" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input text-lg font-semibold" required />
            </div>

            {/* Projet & Statut */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Projet</label>
                <select value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                  className="input" required>
                  <option value="">Sélectionner un projet</option>
                  {projects.map((p) => (<option key={p._id} value={p._id}>{p.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Statut</label>
                <select value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="input">
                  <option value="not_started">Non démarrée</option>
                  <option value="in_progress">En cours</option>
                  <option value="completed">Terminée</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input" rows={4} />
            </div>

            {/* Priorité & Estimation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Priorité</label>
                <select value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="input">
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" /> Estimation (heures)
                </label>
                <input type="number" min="0" step="0.5" value={formData.estimatedHours}
                  onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value) })}
                  className="input" />
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" /> Date de début
                </label>
                <input type="date" value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="input" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-1" /> Date d'échéance
                </label>
                <input type="date" value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input" />
              </div>
            </div>

            {/* Assignation */}
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1" /> Assigner à
              </label>

              <div className="relative mb-2">
                <input type="text" value={searchQuery} onChange={(e) => {
                  setSearchQuery(e.target.value); searchUsers(e.target.value);
                }} className="input" placeholder="Rechercher un utilisateur..." />

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button key={user._id} type="button"
                        onClick={() => addAssignee(user._id)}
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100 text-left">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-semibold mr-2">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500">
                {formData.assignedTo.length} utilisateur(s) assigné(s)
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags</label>
              <input type="text" value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="input" placeholder="frontend, urgent, bug" />
            </div>

            {/* Sous-tâches */}
            {task && (
              <div>
                <label className="block text-sm font-medium mb-2">Sous-tâches</label>

                <div className="space-y-2 mb-2">
                  {subtasks.map((subtask) => (
                    <div key={subtask._id} className="flex items-center p-2 border rounded-lg">
                      <button type="button" onClick={() => toggleSubtask(subtask._id)}
                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          subtask.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}>
                        {subtask.isCompleted && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className={`flex-1 ${subtask.isCompleted ? 'line-through text-gray-500' : ''}`}>
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input type="text" value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    className="input" placeholder="Nouvelle sous-tâche..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())} />
                  <button type="button" onClick={addSubtask} className="btn btn-secondary">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Commentaires */}
            {task && (
              <div>
                <label className="block text-sm font-medium mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-1" /> Commentaires ({comments.length})
                </label>

                <div className="space-y-3 mb-3 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment._id} className="p-3 border rounded-lg">

                      <div className="flex items-center mb-2">
                        <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-semibold mr-2">
                          {comment.user?.firstName?.charAt(0)}{comment.user?.lastName?.charAt(0)}
                        </div>

                        <div className="flex-1">
                          <p className="text-sm font-medium">{comment.user?.firstName} {comment.user?.lastName}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(comment.createdAt), 'dd MMM yyyy à HH:mm', { locale: fr })}
                          </p>
                        </div>
                      </div>

                      {/* ✅ Colorisation des mentions */}
                      <p className="text-sm text-gray-700">
                        {comment.content.split(/(@\w+)/g).map((part, i) =>
                          part.startsWith('@') ? (
                            <span key={i} className="text-blue-600 font-medium">{part}</span>
                          ) : (
                            part
                          )
                        )}
                      </p>

                    </div>
                  ))}
                </div>

                <div className="flex space-x-2">
                  <input type="text" value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="input" placeholder="Ajouter un commentaire..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addComment())} />
                  <button type="button" onClick={addComment} className="btn btn-secondary">
                    <MessageSquare className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button type="submit" disabled={loading}
                className="flex-1 btn btn-primary flex items-center justify-center">
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
