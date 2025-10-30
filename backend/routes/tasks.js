const express = require('express');
const router = express.Router();
const { 
  createTask, 
  getTasks, 
  getTask, 
  updateTask, 
  deleteTask,
  addSubtask,
  toggleSubtask,
  uploadAttachment,
  getOverdueTasks
} = require('../controllers/taskController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/overdue', protect, getOverdueTasks);

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .get(protect, getTask)
  .put(protect, updateTask)
  .delete(protect, deleteTask);

router.post('/:id/subtasks', protect, addSubtask);
router.put('/:id/subtasks/:subtaskId', protect, toggleSubtask);
router.post('/:id/attachments', protect, upload.single('file'), uploadAttachment);

module.exports = router;
