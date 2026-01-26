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
getOverdueTasks,
archiveTask, // ✅ AJOUT
restoreTask // ✅ AJOUT
} = require('../controllers/taskController');

const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// =====================================
// 🔥 GET OVERDUE TASKS
// =====================================
router.get('/overdue', protect, getOverdueTasks);

// =====================================
// 🔥 GET ALL TASKS + CREATE
// =====================================
router.route('/')
.get(protect, getTasks)
.post(protect, createTask);

// =====================================
// 🔥 ARCHIVE / RESTORE TASK (AJOUT)
// =====================================
router.put('/:id/archive', protect, archiveTask);
router.put('/:id/restore', protect, restoreTask);

// =====================================
// 🔥 GET ONE / UPDATE / DELETE
// =====================================
router.route('/:id')
.get(protect, getTask)
.put(protect, updateTask)
.delete(protect, deleteTask);

// =====================================
// 🔥 SUBTASKS
// =====================================
router.post('/:id/subtasks', protect, addSubtask);
router.put('/:id/subtasks/:subtaskId', protect, toggleSubtask);

// =====================================
// 🔥 ATTACHMENT UPLOAD
// =====================================
router.post(
'/:id/attachments',
protect,
upload.single('file'),
uploadAttachment
);

module.exports = router;
