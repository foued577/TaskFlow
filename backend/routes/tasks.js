// backend/routes/tasks.js
const express = require("express");
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
unarchiveTask, // ✅ AJOUT
getDuplicateDraft, // ✅ AJOUT
} = require("../controllers/taskController");

const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");

// =====================================
// 🔥 GET OVERDUE TASKS
// =====================================
router.get("/overdue", protect, getOverdueTasks);

// =====================================
// ✅ ARCHIVE / UNARCHIVE (AJOUT)
// =====================================
router.put("/:id/archive", protect, archiveTask);
router.put("/:id/unarchive", protect, unarchiveTask);

// =====================================
// 🔥 DUPLICATE TASK (DRAFT)
// =====================================
router.get("/:id/duplicate-draft", protect, getDuplicateDraft);

// =====================================
// 🔥 GET ALL TASKS + CREATE
// =====================================
router
.route("/")
.get(protect, getTasks)
.post(protect, createTask);

// =====================================
// 🔥 GET ONE / UPDATE / DELETE
// =====================================
router
.route("/:id")
.get(protect, getTask)
.put(protect, updateTask)
.delete(protect, deleteTask);

// =====================================
// 🔥 SUBTASKS
// =====================================
router.post("/:id/subtasks", protect, addSubtask);
router.put("/:id/subtasks/:subtaskId", protect, toggleSubtask);

// =====================================
// 🔥 ATTACHMENT UPLOAD
// =====================================
router.post(
"/:id/attachments",
protect,
upload.single("file"),
uploadAttachment
);

module.exports = router;
