import React, { useState, useEffect } from "react";
import { commentsAPI } from "../utils/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MessageSquare } from "lucide-react";
import { toast } from "react-toastify";

const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

  const loadComments = async () => {
    try {
      const res = await commentsAPI.getForTask(taskId);
      setComments(res.data.data);
    } catch (err) {
      console.error("Error loading comments", err);
    }
  };

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      await commentsAPI.create({ taskId, content: newComment });
      setNewComment("");
      loadComments();
    } catch (err) {
      toast.error("Erreur lors de l'ajout du commentaire");
    }
  };

  return (
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
                {comment.user?.firstName?.charAt(0)}
                {comment.user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {comment.user?.firstName} {comment.user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(comment.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700">{comment.content}</p>
          </div>
        ))}
      </div>

      <div className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="input"
          placeholder="Ajouter un commentaire..."
        />
        <button onClick={addComment} className="btn btn-secondary">
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TaskComments;
