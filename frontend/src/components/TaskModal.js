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
    assignedTo: [],
    priority: 'medium',
    status: 'not_started',
    estimatedHours: 0,
    startDate: '',
    dueDate: '',
    tags: '',
  });

  const [assignedUsers, setAssignedUsers] = useState([]);

  // Sous-tâches
  const [subtasks, setSubtasks] = useState([]);

  // Commentaires
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const commentInputRef = useRef(null);

  // Mentions
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionBox, setShowMentionBox] = useState(false);

  // Recherche Users Assignation
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const [loading, setLoading] = useState(false);

  // Chargement de la tâche
  useEffect(() => {
    if (!task) return;

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
      tags: (task.tags || []).join(', '),
    });

    const initialUsers =
      task.assignedTo?.filter(u => typeof u === 'object') || [];
    setAssignedUsers(initialUsers);

    setSubtasks(task.subtasks || []);
    loadComments(task._id);
  }, [task]);

  // Charger commentaires
  const loadComments = async (taskId) => {
    try {
      const res = await commentsAPI.getForTask(taskId);
      setComments(res.data.data || []);
    } catch {}
  };

  // Sauvegarde tâche
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      if (task) {
        await tasksAPI.update(task._id, payload);
        toast.success('Tâche mise à jour');
      } else {
        await tasksAPI.create(payload);
        toast.success('Tâche créée avec succès');
      }

      onSave();
    } catch {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  // Suppression tâche
  const deleteTask = async () => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    await tasksAPI.delete(task._id);
    toast.success('Tâche supprimée');
    onSave();
  };

  // Toggle sous-tâche
  const toggleSubtask = async (id) => {
    await tasksAPI.toggleSubtask(task._id, id);
    const res = await tasksAPI.getOne(task._id);
    setSubtasks(res.data.data.subtasks);
  };

  // Mentions @
  const handleCommentTyping = async (value) => {
    setNewComment(value);

    const caret = commentInputRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const match = before.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,30})$/);

    if (!match) {
      setShowMentionBox(false);
      return;
    }

    const q = match[1];
    const res = await usersAPI.search(q);
    const list = res?.data?.data || [];
    setMentionSuggestions(list.slice(0, 6));
    setShowMentionBox(list.length > 0);
  };

  const insertMention = (user) => {
    const input = commentInputRef.current;
    const value = newComment;
    const caret = input.selectionStart;
    const before = value.slice(0, caret);
    const after = value.slice(caret);
    const match = before.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,30})$/);

    if (!match) return;

    const start = before.lastIndexOf('@' + match[1]);
    const newValue =
      before.slice(0, start) + '@' + user.firstName + ' ' + after;

    setNewComment(newValue);
    setShowMentionBox(false);

    setTimeout(() => {
      const pos =
        before.slice(0, start).length + ('@' + user.firstName + ' ').length;
      input.setSelectionRange(pos, pos);
      input.focus();
    }, 0);
  };

  // Envoi commentaire + notifications
  const sendComment = async () => {
    if (!newComment.trim()) return;

    const matches = newComment.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/g) || [];
    const tokens = [...new Set(matches.map(m => m.substring(1)))];

    const mentionedIds = [];

    for (const t of tokens) {
      const res = await usersAPI.search(t);
      const found = res?.data?.data || [];
      if (found.length > 0) mentionedIds.push(found[0]._id);
    }

    await commentsAPI.create({
      taskId: task._id,
      content: newComment,
      mentions: mentionedIds,
    });

    setNewComment('');
    loadComments(task._id);
    toast.success('Commentaire ajouté');
  };

  // Recherche assignation
  const searchUsers = async (q) => {
    if (q.length < 2) return setSearchResults([]);
    const res = await usersAPI.search(q);
    setSearchResults(res.data.data);
  };

  const addAssignee = (user) => {
    if (!formData.assignedTo.includes(user._id)) {
      setFormData(s => ({ ...s, assignedTo: [...s.assignedTo, user._id] }));
      setAssignedUsers(s => [...s, user]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const removeAssignee = (id) => {
    setFormData(s => ({ ...s, assignedTo: s.assignedTo.filter(x => x !== id) }));
    setAssignedUsers(s => s.filter(u => u._id !== id));
  };

  // ---------------- UI -----------------
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center border-b p-4">
          <h2 className="text-lg font-semibold">{task ? 'Modifier la tâche' : 'Nouvelle tâche'}</h2>
          <div className="flex gap-2">
            {task && <Trash2 onClick={deleteTask} className="text-red-600 cursor-pointer" />}
            <X onClick={onClose} className="cursor-pointer" />
          </div>
        </div>

        {/* FORM */}
        <div className="p-6 space-y-5">

          {/* Title */}
          <input className="input" placeholder="Titre" value={formData.title}
            onChange={(e)=>setFormData({...formData,title:e.target.value})} />

          {/* Assignés */}
          <label className="text-sm font-medium flex items-center gap-1"><Users size={16}/>Assignée à</label>

          <input className="input" placeholder="Rechercher utilisateur..."
            value={searchQuery}
            onChange={(e)=>{setSearchQuery(e.target.value); searchUsers(e.target.value);}} />

          {searchResults.length>0&&(
            <div className="border rounded p-1 bg-white shadow">
              {searchResults.map(u=>(
                <div key={u._id} className="cursor-pointer p-2 hover:bg-gray-100"
                  onClick={()=>addAssignee(u)}>{u.firstName} {u.lastName}</div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {assignedUsers.map(u=>(
              <span key={u._id} className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex items-center gap-1">
                {u.firstName} {u.lastName}
                <X size={12} className="cursor-pointer" onClick={()=>removeAssignee(u._id)}/>
              </span>
            ))}
          </div>

          {/* Commentaires */}
          <label className="flex items-center gap-1 text-sm font-medium"><MessageSquare size={16}/>Commentaires</label>

          <div className="border rounded p-2 max-h-64 overflow-y-auto space-y-2">
            {comments.map(c=>(
              <div key={c._id} className="border-b pb-1">
                <strong>{c.user.firstName} {c.user.lastName}</strong><br/>
                {c.content}
              </div>
            ))}
          </div>

          <div className="relative">
            <input
              ref={commentInputRef}
              className="input"
              placeholder="Écrire un commentaire... (@Nom)"
              value={newComment}
              onChange={(e)=>handleCommentTyping(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&& (e.preventDefault(), sendComment())}
            />

            {showMentionBox && (
              <div className="absolute bg-white border rounded shadow w-full mt-1 p-1">
                {mentionSuggestions.map(u=>(
                  <div key={u._id}
                    className="p-2 hover:bg-gray-100 cursor-pointer"
                    onClick={()=>insertMention(u)}>
                    @{u.firstName} {u.lastName}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button onClick={sendComment} className="btn btn-primary w-full flex items-center justify-center">
            <MessageSquare className="mr-2" /> Envoyer
          </button>

          {/* Save */}
          <button onClick={handleSubmit} className="btn btn-primary w-full flex items-center justify-center">
            <Save className="mr-2" /> {task ? 'Mettre à jour' : 'Créer'}
          </button>

        </div>
      </div>
    </div>
  );
};

export default TaskModal;
