const express = require('express');
const router = express.Router();

const {
getProjects,
getProject,
createProject,
updateProject,
deleteProject,
archiveProject, // ✅ AJOUT
unarchiveProject // ✅ AJOUT
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');

// ==================================================
// Toutes les routes projets → authentification requise
// ==================================================

// ✅ ✅ ✅ ARCHIVE / UNARCHIVE
router.put('/:id/archive', protect, archiveProject);
router.put('/:id/unarchive', protect, unarchiveProject);

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);

router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;
