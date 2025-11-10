import React, { useState, useEffect, useRef } from "react";
import { tasksAPI, usersAPI, commentsAPI } from "../utils/api";
import { toast } from "react-toastify";
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
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TaskModal = ({ task, projects, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: "",
    assignedTo: [],
    priority: "medium",
    status: "not_started",
    estimatedHours: 0,
    startDate: "",
    dueDate: "",
    tags: "",
  });

  const [assignedUsers, setAssignedUsers] = useState([]); // ✅ vraie liste affichable
  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");

  const [newComment, setNewComment] = useState("");
  const commentRef = useRef(null);

  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionBox, setShowMentionBox] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!task) return;

    setFormData({
      title: task.title,
      description: task.description || "",
      projectId: task.project?._id || task.project,
      assignedTo: (task.assignedTo || []).map((u) => u._id || u),
      priority: task.priority || "medium",
      status: task.status || "not_started",
      estimatedHours: task.estimatedHours || 0,
      startDate: task.startDate ? format(new Date(task.startDate), "yyyy-MM-dd") : "",
      dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "",
      tags: Array.isArray(task.tags) ? task.tags.join(", ") : task.tags || "",
    });

    setAssignedUsers(
      (task.assignedTo || []).filter((u) => typeof u === "object")
    );

    setSubtasks(task.subtasks || []);
    loadComments(task._id);
  }, [task]);

  const loadComments = async (taskId) => {
    try {
      const res = await commentsAPI.getForTask(taskId);
      setComments(res.data.data);
    } catch (_) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
      };

      if (task) {
        await tasksAPI.update(task._id, data);
        toast.success("Tâche mise à jour");
      } else {
        await tasksAPI.create(data);
        toast.success("Tâche créée");
      }

      onSave();
    } catch (error) {
      toast.error(error.response?.data?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async () => {
    if (!task || !window.confirm("Supprimer cette tâche ?")) return;
    try {
      await tasksAPI.delete(task._id);
      toast.success("Tâche supprimée");
      onSave();
    } catch {
      toast.error("Erreur suppression");
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim() || !task) return;
    try {
      await tasksAPI.addSubtask(task._id, newSubtask);
      setNewSubtask("");
      loadTask();
    } catch {
      toast.error("Erreur sous-tâche");
    }
  };

  const toggleSubtask = async (id) => {
    await tasksAPI.toggleSubtask(task._id, id);
    loadTask();
  };

  const loadTask = async () => {
    const res = await tasksAPI.getOne(task._id);
    setSubtasks(res.data.data.subtasks);
  };

  const updateMentionSuggestions = async (text) => {
    const match = text.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,20})$/);
    if (!match) return setShowMentionBox(false);

    const q = match[1];
    const res = await usersAPI.search(q);
    setMentionSuggestions(res.data.data.slice(0, 6));
    setShowMentionBox(res.data.data.length > 0);
  };

  const insertMention = (user) => {
    const input = commentRef.current;
    const val = newComment;
    const match = val.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,20})$/);
    if (!match) return;

    const newVal = val.replace(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,20})$/, `@${user.firstName} `);
    setNewComment(newVal);
    setShowMentionBox(false);

    setTimeout(() => input.setSelectionRange(newVal.length, newVal.length), 0);
  };

  const addComment = async () => {
    if (!newComment.trim() || !task) return;
    const matches = newComment.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/g) || [];

    const mentionedIds = [];
    for (const m of matches) {
      const q = m.substring(1);
      const res = await usersAPI.search(q);
      if (res.data.data[0]) mentionedIds.push(res.data.data[0]._id);
    }

    await commentsAPI.create({
      taskId: task._id,
      content: newComment,
      mentions: mentionedIds,
    });

    setNewComment("");
    loadComments(task._id);
  };

  const addAssignee = (user) => {
    if (!formData.assignedTo.includes(user._id)) {
      setFormData((f) => ({ ...f, assignedTo: [...f.assignedTo, user._id] }));
      setAssignedUsers((u) => [...u, user]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeAssignee = (id) => {
    setFormData((f) => ({ ...f, assignedTo: f.assignedTo.filter((x) => x !== id) }));
    setAssignedUsers((u) => u.filter((x) => x._id !== id));
  };

  const searchUsers = async (q) => {
    if (q.length < 2) return setSearchResults([]);
    const res = await usersAPI.search(q);
    setSearchResults(res.data.data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">

        {/* HEADER */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between">
          <h2 className="text-xl font-bold">{task ? "Modifier la tâche" : "Nouvelle tâche"}</h2>
          <div className="flex items-center space-x-2">
            {task && (
              <button onClick={deleteTask} className="text-red-600 hover:bg-red-50 p-2 rounded">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose}>
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* TITRE */}
            <input
              type="text"
              className="input text-lg font-semibold"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            {/* PROJET + STATUT */}
            <div className="grid grid-cols-2 gap-4">
              <select className="input" value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })} required>
                <option value="">Projet…</option>
                {projects.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>

              <select className="input" value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                <option value="not_started">Non démarrée</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
              </select>
            </div>

            {/* DESCRIPTION */}
            <textarea className="input" rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            {/* PRIORITÉ + ESTIMATION */}
            <div className="grid grid-cols-2 gap-4">
              <select className="input" value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}>
                <option value="low">Basse</option>
                <option value="medium">Moyenne</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>

              <input type="number" className="input" step="0.5"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: parseFloat(e.target.value || 0) })}
              />
            </div>

            {/* DATES */}
            <div className="grid grid-cols-2 gap-4">
              <input type="date" className="input"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <input type="date" className="input"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>

            {/* ASSIGNATION */}
            <div>
              <div className="relative">
                <input className="input" placeholder="Rechercher un utilisateur…"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                />
                {searchResults.length > 0 && (
                  <div className="absolute w-full bg-white border shadow rounded mt-1 max-h-48 overflow-y-auto z-10">
                    {searchResults.map((u) => (
                      <div key={u._id} className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
                        onClick={() => addAssignee(u)}>
                        <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center mr-2 text-xs">
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        {u.firstName} {u.lastName}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {assignedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {assignedUsers.map((u) => (
                    <span key={u._id} className="px-2 py-1 bg-purple-50 border text-purple-700 rounded-full text-xs flex items-center">
                      {u.firstName} {u.lastName}
                      <button className="ml-2" onClick={() => removeAssignee(u._id)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* TAGS */}
            <input className="input" placeholder="frontend, urgent, bug"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            />

            {/* COMMENTAIRES */}
            {task && (
              <div>
                <div className="max-h-60 overflow-y-auto space-y-2 mb-2">
                  {comments.map((c) => (
                    <div key={c._id} className="p-2 border rounded">
                      <strong>{c.user?.firstName} {c.user?.lastName}:</strong>
                      <div>
                        {c.content.split(/(@[A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/g).map((p, i) =>
                          p.startsWith("@") ? (
                            <span key={i} className="text-blue-600 font-semibold">{p}</span>
                          ) : p
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <input
                    ref={commentRef}
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      updateMentionSuggestions(e.target.value);
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addComment())}
                    className="input"
                    placeholder="Écrire un commentaire… (@Nom pour notifier)"
                  />

                  {showMentionBox && (
                    <div className="absolute w-full bg-white border rounded shadow max-h-40 overflow-y-auto mt-1 z-20">
                      {mentionSuggestions.map((u) => (
                        <div key={u._id}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => insertMention(u)}>
                          {u.firstName} {u.lastName}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTIONS */}
            <button type="submit" disabled={loading} className="btn btn-primary w-full flex justify-center">
              <Save className="w-5 h-5 mr-2" />
              {task ? "Mettre à jour" : "Créer"}
            </button>

            <button type="button" className="btn btn-secondary w-full" onClick={onClose}>
              Annuler
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
