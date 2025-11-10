import React, { useState, useEffect } from 'react';
import { commentsAPI } from '../utils/api';
import { MessageSquare, Send } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const TaskComments = ({ taskId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (!taskId) return;
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      const res = await commentsAPI.getForTask(taskId);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Erreur chargement commentaires:', err);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    try {
      await commentsAPI.create({ taskId, content: newComment.trim() });
      setNewComment('');
      await loadComments();
    } catch (err) {
      console.error('Erreur ajout commentaire:', err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addComment();
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center mb-3">
        <MessageSquare className="w-4 h-4 mr-2 text-gray-600" />
        <span className="font-medium text-gray-700">Commentaires</span>
      </div>

      {/* Liste des commentaires */}
      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
        {comments.map((c) => (
          <div key={c._id} className="p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center mb-1">
              <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-semibold mr-2">
                {c.user?.firstName?.charAt(0)}
                {c.user?.lastName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {c.user?.firstName} {c.user?.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {format(new Date(c.createdAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {c.content}
            </p>
          </div>
        ))}
      </div>

      {/* Champ ajout commentaire */}
      <div className="flex space-x-2">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyPress}
          className="input flex-1"
          placeholder="Écrire un commentaire... (Astuce : @Nom pour mentionner)"
        />
        <button
          type="button"
          onClick={addComment}
          className="btn btn-secondary flex items-center justify-center"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default TaskComments;
