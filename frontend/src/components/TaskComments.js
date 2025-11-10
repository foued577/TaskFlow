import React, { useState, useEffect } from "react";
import { commentsAPI } from "../utils/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const TaskComments = ({ taskId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");

  const loadComments = async () => {
    try {
      const res = await commentsAPI.getForTask(taskId);
      setComments(res.data.data);
    } catch {
      toast.error("Erreur lors du chargement des commentaires");
    }
  };

  const sendComment = async () => {
    if (!message.trim()) return;
    try {
      await commentsAPI.create({ taskId, content: message });
      setMessage("");
      loadComments();
    } catch {
      toast.error("Erreur lors de l'envoi du commentaire");
    }
  };

  useEffect(() => {
    loadComments();
  }, [taskId]);

  return (
    <div className="mt-6 border-t pt-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">Discussion</h3>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
        {comments.length === 0 && (
          <p className="text-gray-500 text-sm">Aucun commentaire pour le moment.</p>
        )}

        {comments.map((c) => (
          <div key={c._id} className="p-2 border rounded-lg bg-gray-50">
            <div className="text-sm font-semibold text-gray-800">
              {c.author?.firstName} {c.author?.lastName}
            </div>
            <div className="text-sm text-gray-900">{c.content}</div>
            <div className="text-xs text-gray-500 mt-1">
              {format(new Date(c.createdAt), "dd MMM yyyy - HH:mm", { locale: fr })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex mt-4 gap-2">
        <input
          className="input flex-1"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Écrire un commentaire..."
        />
        <button onClick={sendComment} className="btn btn-primary">Envoyer</button>
      </div>
    </div>
  );
};

export default TaskComments;

