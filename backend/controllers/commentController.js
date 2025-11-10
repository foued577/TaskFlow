const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');

// Ajouter un commentaire
router.post('/', protect, commentController.createComment);

// Récupérer les commentaires d’une tâche
router.get('/task/:taskId', protect, commentController.getComments);

// Modifier un commentaire
router.put('/:id', protect, commentController.updateComment);

// Supprimer un commentaire
router.delete('/:id', protect, commentController.deleteComment);

module.exports = router;
