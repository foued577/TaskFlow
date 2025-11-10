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

  const [assignedUsers, setAssignedUsers] = useState([]);

  const [subtasks, setSubtasks] = useState([]);
  const [comments, setComments] = useState([]);
  const [newSubtask, setNewSubtask] = useState("");

  const [newComment, setNewComment] = useState("");
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionBox, setShowMentionBox] = useState(false);
  const commentInputRef = useRef(null);

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
      startDate: task.startDate
        ? format(new Date(task.startDate), "yyyy-MM-dd")
        : "",
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
      setComments(res.data.data || []);
    } catch {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      tags: formData.tags
        ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };

    try {
      if (task) {
        await tasksAPI.update(task._id, payload);
        toast.success("Tâche mise à jour");
      } else {
        await tasksAPI.create(payload);
        toast.success("Tâche créée");
      }
      onSave();
    } catch (e) {
      toast.error("Erreur de sauvegarde");
    }

    setLoading(false);
  };

  const deleteTask = async () => {
    if (!task) return;
    if (!window.confirm("Supprimer la tâche ?")) return;
    try {
      await tasksAPI.delete(task._id);
      toast.success("Tâche supprimée");
      onSave();
    } catch {
      toast.error("Erreur suppression");
    }
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    await tasksAPI.addSubtask(task._id, newSubtask.trim());
    const refreshed = await tasksAPI.getOne(task._id);
    setSubtasks(refreshed.data.data.subtasks || []);
    setNewSubtask("");
  };

  const toggleSubtask = async (sid) => {
    await tasksAPI.toggleSubtask(task._id, sid);
    const refreshed = await tasksAPI.getOne(task._id);
    setSubtasks(refreshed.data.data.subtasks || []);
  };

  const updateMentionSuggestions = async (value) => {
    const caret = commentInputRef.current?.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const match = before.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,20})$/);
    if (!match) return setShowMentionBox(false);

    try {
      const res = await usersAPI.search(match[1]);
      setMentionSuggestions(res.data.data.slice(0, 6));
      setShowMentionBox(true);
    } catch {}
  };

  const insertMention = (user) => {
    const input = commentInputRef.current;
    const value = newComment;
    const caret = input.selectionStart ?? value.length;
    const before = value.slice(0, caret);
    const after = value.slice(caret);

    const match = before.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,20})$/);
    if (!match) return;

    const updated =
      before.replace(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]{1,20})$/, `@${user.firstName}`) +
      " " +
      after;

    setNewComment(updated);
    setShowMentionBox(false);
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    const tokens =
      newComment.match(/@([A-Za-zÀ-ÖØ-öø-ÿ0-9_-]+)/g)?.map((x) => x.slice(1)) ||
      [];

    const mentions = [];
    for (const t of [...new Set(tokens)]) {
      try {
        const r = await usersAPI.search(t);
        if (r.data.data.length) mentions.push(r.data.data[0]._id);
      } catch {}
    }

    await commentsAPI.create({
      taskId: task._id,
      content: newComment,
      mentions,
    });

    setNewComment("");
    loadComments(task._id);
  };

  const searchUsers = async (q) => {
    if (q.length < 2) return setSearchResults([]);
    try {
      const res = await usersAPI.search(q);
      setSearchResults(res.data.data);
    } catch {}
  };

  const addAssignee = (u) => {
    if (!formData.assignedTo.includes(u._id)) {
      setFormData((s) => ({ ...s, assignedTo: [...s.assignedTo, u._id] }));
      setAssignedUsers((s) => [...s, u]);
    }
    setSearchResults([]);
    setSearchQuery("");
  };

  const removeAssignee = (id) => {
    setFormData((s) => ({
      ...s,
      assignedTo: s.assignedTo.filter((x) => x !== id),
    }));
    setAssignedUsers((s) => s.filter((u) => u._id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">
            {task ? "Modifier la tâche" : "Nouvelle tâche"}
          </h2>
          <div className="flex items-center gap-2">
            {task && (
              <button onClick={deleteTask} className="text-red-600">
                <Trash2 />
              </button>
            )}
            <button onClick={onClose}>
              <X />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label>Titre</label>
              <input
                className="input"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label>Assigner à</label>
              <input
                className="input"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Rechercher..."
              />
              {searchResults.length > 0 && (
                <div className="border p-2 bg-white shadow rounded mt-1">
                  {searchResults.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => addAssignee(u)}
                      className="block w-full text-left px-2 py-1 hover:bg-gray-100"
                    >
                      {u.firstName} {u.lastName}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2 flex-wrap mt-2">
                {assignedUsers.map((u) => (
                  <span
                    key={u._id}
                    className="px-2 py-1 bg-purple-100 rounded-full text-sm flex items-center gap-2"
                  >
                    {u.firstName} {u.lastName}
                    <button onClick={() => removeAssignee(u._id)}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {task && (
              <>
                <label>Commentaires</label>
                <div className="max-h-52 overflow-y-auto space-y-2">
                  {comments.map((c) => (
                    <div key={c._id} className="border p-2 rounded">
                      <strong>
                        {c.user?.firstName} {c.user?.lastName}
                      </strong>
                      <p>
                        {c.content.split(/(@\w+)/g).map((part, i) =>
                          part.startsWith("@") ? (
                            <span key={i} className="text-blue-600 font-semibold">
                              {part}
                            </span>
                          ) : (
                            part
                          )
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <input
                    ref={commentInputRef}
                    className="input"
                    value={newComment}
                    onChange={(e) => {
                      setNewComment(e.target.value);
                      updateMentionSuggestions(e.target.value);
                    }}
                    placeholder="Écrire un commentaire (@Nom pour notifier)"
                  />

                  {showMentionBox && mentionSuggestions.length > 0 && (
                    <div className="absolute bg-white border shadow rounded w-full mt-1 z-20">
                      {mentionSuggestions.map((u) => (
                        <button
                          key={u._id}
                          className="block w-full text-left px-2 py-1 hover:bg-gray-100"
                          onClick={() => insertMention(u)}
                        >
                          {u.firstName} {u.lastName}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={addComment}
                  className="btn btn-secondary"
                >
                  Commenter
                </button>
              </>
            )}

            <button type="submit" className="btn btn-primary w-full">
              <Save className="w-4 h-4 mr-2" />
              {task ? "Mettre à jour" : "Créer la tâche"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
