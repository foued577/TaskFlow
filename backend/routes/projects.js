const express = require('express');
const router = express.Router();

const {
getProjects,
getProject,
createProject,
updateProject,
deleteProject,
archiveProject,
unarchiveProject
} = require('../controllers/ProjectController'); // ✅ ICI (majuscule)

const { protect } = require('../middleware/auth');

// ==================================================
// Toutes les routes projets → authentification requise
// ==================================================

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);

router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

// ✅ ✅ ✅ ARCHIVE / UNARCHIVE
router.put('/:id/archive', protect, archiveProject);
router.put('/:id/unarchive', protect, unarchiveProject);

module.exports = router;
