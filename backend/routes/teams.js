const express = require('express');
const router = express.Router();

const {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  addMember,
  removeMember
} = require('../controllers/teamController');

const { protect } = require('../middleware/auth');

// ====================================================
// Toutes les routes nécessitent d’être authentifié
// ====================================================

router.get('/', protect, getTeams);
router.get('/:id', protect, getTeam);

router.post('/', protect, createTeam);
router.put('/:id', protect, updateTeam);

router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
