const express = require('express');
const router = express.Router();

const {
getProjects,
getProject,
createProject,
updateProject,
deleteProject,
archiveProject, // ✅ AJOUT
restoreProject // ✅ AJOUT
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');

// ==================================================
// Toutes les routes projets → authentification requise
// ==================================================

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);

router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);

// ✅ AJOUT: ARCHIVE / RESTORE
router.put('/:id/archive', protect, archiveProject);
router.put('/:id/restore', protect, restoreProject);

router.delete('/:id', protect, deleteProject);

module.exports = router;
