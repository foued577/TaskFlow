// src/components/TaskModal.js
import React, { useState, useEffect, useRef } from 'react';
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
  // -------- Formulaire tâche --------
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assignedTo: [],          // tableau d'IDs
    priority: 'medium',
    status: 'not_started',
    estimatedHours: 0,
    startDate: '',
    dueDate: '',
    tags: '',
  });

  // On garde séparément les objets utilisateurs pour l'affichage des "chips"
  const [assignedUsers, setAssignedUsers] = useState([]); // tableau d'objets user

  // -------- Sous-tâches & commentaires --------
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');

  // -------- Commentaires / mentions --------
  const [newComment, setNewComment] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState([]); // suggestions dropdown
  const [showMentionBox, setShowMentionBox] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const commentInputRef = useRef(null);

  // -------- Recherche d'utilisateurs pour assignation --------
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [loading, setLoading] = useState(false);

  // ---------- Chargement initial si édition ----------
  useEffect(() => {
    if (!task) return;

    // Pré-remplissage
    setFormData({
      title: task.title,
      description: task.description || '',
      projectId: task.project?._id || task.project,
      assignedTo: (task.assignedTo || []).map(u => u._id || u),
      priority: task.priority || 'medium',
      status: task.status || 'not_started',
      estimatedHours: task.estimatedHours || 0,
      startDate: task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      tags: Array.isArray(task.tags) ? task.tags.join(', ') : (task.tags || ''),
    });

    // Objets utilisateurs pour l’affichage des chips
    const fullUsers = (task.assignedTo || []).map(u => (typeof u === 'object' ? u : null)).filter(Boolean);
    setAssignedUsers(fullUsers);

    // Sous-tâches & commentaires
    setSubtasks(task.subtasks || []);
    loadComments(task._id);
  }, [task]);

  // ---------- Charger commentaires ----------
  const loadComments = async (taskId) => {
    if (!taskId) return;
    try {
      const res = await commentsAPI.getForTask(taskId);
      setComments(res.data.data || []);
    } catch (e) {
      console.error('Failed to load comments:', e);
    }
  };

  // ---------- Sauvegarde tâche ----------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags
          ? formData.tags.split(',').map(t => t.trim()).filter(Boolean)
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
    } catch (error) {
      toast.error(error.response?.data?.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // ---------- Suppression tâche ----------
  const deleteTask = async () => {
    if (!task || !window.confirm('Voulez-vous vraiment supprimer cette tâche ?')) return;
    try {
      await tasksAPI.delete(task._id);
      toast.success('Tâche supprimée');
      onSave();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  // ---------- Sous-tâches ----------
  const addSubtask = async () => {
    if (!newSubtask.trim() || !task) return;
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

  // ---------- Mentions (@Nom) ----------
  // Affiche les suggestions lorsqu’on tape "@" + lettres
  const updateMentionSuggestions = async (value) => {
    // Récupère le dernier segment commençant par @ jusqu’à un espace/fin
    const caretPos = commentInputRef.current?.selectionStart ?? value.length;
    const beforeCaret = value.slice(0, caretPos);
    const match = beforeCaret.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,30})$/);

    if (!match) {
      setShowMentionBox(false);
      setMentionQuery('');
      setMentionSuggestions([]);
      return;
    }

    const q = match[1];
    setMentionQuery(q);
    try {
      const res = await usersAPI.search(q);
      const items = res?.data?.data || [];
      setMentionSuggestions(items.slice(0, 8));
      setShowMentionBox(items.length > 0);
    } catch {
      setMentionSuggestions([]);
      setShowMentionBox(false);
    }
  };

  const insertMention = (user) => {
    // Remplace le segment "@xxx" courant par "@Prénom"
    const input = commentInputRef.current;
    if (!input) return;

    const value = newComment;
    const caretPos = input.selectionStart ?? value.length;
    const beforeCaret = value.slice(0, caretPos);
    const afterCaret = value.slice(caretPos);

    const match = beforeCaret.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,30})$/);
    if (!match) return;

    const mentionStart = beforeCaret.lastIndexOf('@' + match[1]);
    const newValue =
      beforeCaret.slice(0, mentionStart) +
      '@' + (user.firstName || '') + // on insère @Prénom
      ' ' + // petit espace après pour fluidifier la saisie
      afterCaret;

    setNewComment(newValue);
    setShowMentionBox(false);
    setMentionSuggestions([]);
    // remet le curseur juste après l'insertion
    setTimeout(() => {
      const pos = (beforeCaret.slice(0, mentionStart) + '@' + (user.firstName || '') + ' ').length;
      input.setSelectionRange(pos, pos);
      input.focus();
    }, 0);
  };

  // Envoi du commentaire avec mentions résolues → IDs pour les notifications
  const addComment = async () => {
    if (!newComment.trim() || !task) return;

    try {
      // capture @token (lettres/chiffres/accents/_/-)
      const mentionMatches = newComment.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/g) || [];
      const unique = [...new Set(mentionMatches.map(m => m.substring(1)))];

      const mentionedUserIds = [];
      for (const token of unique) {
        try {
          const res = await usersAPI.search(token);
          const found = res?.data?.data || [];
          if (found.length > 0) {
            mentionedUserIds.push(found[0]._id);
          }
        } catch {
          /* ignore */
        }
      }

      await commentsAPI.create({
        taskId: task._id,
        content: newComment,
        mentions: mentionedUserIds, // utilisé par votre backend pour notifier
      });

      setNewComment('');
      await loadComments(task._id);
      toast.success('Commentaire ajouté');
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  // ---------- Recherche/Assignation ----------
  const searchUsers = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await usersAPI.search(query.trim());
      setSearchResults(res.data.data || []);
    } catch (e) {
      console.error('Search error:', e);
    }
  };

  const addAssignee = (user) => {
    const id = user._id;
    if (!formData.assignedTo.includes(id)) {
      setFormData(s => ({ ...s, assignedTo: [...s.assignedTo, id] }));
      setAssignedUsers(arr => [...arr, user]); // garder l’objet pour l’affichage
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeAssignee = (userId) => {
    setFormData(s => ({
      ...s,
      assignedTo: s.assignedTo.filter(id => id !== userId),
    }));
    setAssignedUsers(arr => arr.filter(u => u._id !== userId));
  };

  // ---------- Rendu ----------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <div className="flex items-center space-x-2">
            {task && (
              <button
                onClick={deleteTask}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                title="Supprimer"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600" title="Fermer">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Titre */}
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

            {/* Projet & Statut */}
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
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
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

            {/* Priorité & Estimation */}
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
                  min="0"
                  step="0.5"
                  value={formData.estimatedHours}
                  onChange={(e) =>
                    setFormData({ ...formData, estimatedHours: parseFloat(e.target.value || 0) })
                  }
                  className="input"
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

            {/* Assignation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-1" />
                Assigner à
              </label>

              {/* Recherche */}
              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const q = e.target.value;
                    setSearchQuery(q);
                    searchUsers(q);
                  }}
                  className="input"
                  placeholder="Rechercher un utilisateur..."
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((user) => (
                      <button
                        key={user._id}
                        type="button"
                        onClick={() => addAssignee(user)}
                        className="w-full flex items-center px-4 py-2 hover:bg-gray-100 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold mr-2">
                          {(user.firstName || '?')[0]}
                          {(user.lastName || '')[0]}
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

              {/* Chips des assignés (noms, pas d'IDs) */}
              {assignedUsers.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignedUsers.map((u) => (
                    <span
                      key={u._id}
                      className="inline-flex items-center px-2 py-1 rounded-full bg-purple-50 text-purple-700 text-xs border border-purple-200"
                    >
                      <span className="mr-1 font-semibold">
                        {(u.firstName || '?')[0]}
                        {(u.lastName || '')[0]}
                      </span>
                      {u.firstName} {u.lastName}
                      <button
                        type="button"
                        onClick={() => removeAssignee(u._id)}
                        className="ml-2 text-purple-500 hover:text-purple-700"
                        title="Retirer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">Aucun utilisateur assigné</p>
              )}
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

            {/* Sous-tâches */}
            {task && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sous-tâches</label>

                <div className="space-y-2 mb-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask._id}
                      className="flex items-center p-2 border border-gray-200 rounded-lg"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtask(subtask._id)}
                        className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center ${
                          subtask.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'
                        }`}
                        title={subtask.isCompleted ? 'Marquée terminée' : 'Marquer comme fait'}
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
                    onChange={(e) => setNewSub
