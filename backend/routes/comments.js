const express = require('express');
const router = express.Router();
const { createComment, getComments, updateComment, deleteComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

// Route pour créer un commentaire
router.post('/', protect, createComment);

// Route pour obtenir les commentaires d'une tâche (compatible avec frontend)
// Supporte les deux formats : /comments/:taskId et /comments/task/:taskId
router.get('/task/:taskId', protect, getComments);
router.get('/:taskId', protect, getComments);

// Route pour mettre à jour un commentaire
router.put('/:id', protect, updateComment);

// Route pour supprimer un commentaire
router.delete('/:id', protect, deleteComment);

module.exports = router;
