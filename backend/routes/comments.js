const express = require('express');

2

const router = express. Router();

teamController.js

const { createComment, getComments, updateComment, deleteComment } = require(' .. /controllers/commentController');

userController.js

const { protect } = require(' .. /middleware/auth');
router.post('/', protect, createComment);
router .get('/task/:taskId', protect, getComments);
router.put('/:id', protect, updateComment);
router.delete('/: id', protect, deleteComment);
module.exports = router;
