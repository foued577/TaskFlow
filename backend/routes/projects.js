const express = require('express');
const router = express.Router();

const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject
} = require('../controllers/projectController');

const { protect } = require('../middleware/auth');

// ==================================================
// Toutes les routes projets → authentification requise
// ==================================================

router.get('/', protect, getProjects);
router.get('/:id', protect, getProject);

router.post('/', protect, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

module.exports = router;
