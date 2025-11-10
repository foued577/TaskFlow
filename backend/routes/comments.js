const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  createComment,
  getComments,
  updateComment,
  deleteComment
} = require('../controllers/commentController');

// Create comment
router.post('/', protect, createComment);

// Get all comments for a task
router.get('/task/:taskId', protect, getComments);

// Update comment
router.put('/:id', protect, updateComment);

// Delete comment
router.delete('/:id', protect, deleteComment);

module.exports = router;
