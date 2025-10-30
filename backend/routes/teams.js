const express = require('express');
const router = express.Router();
const { createTeam, getTeams, getTeam, updateTeam, addMember, removeMember } = require('../controllers/teamController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getTeams)
  .post(protect, createTeam);

router.route('/:id')
  .get(protect, getTeam)
  .put(protect, updateTeam);

router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);

module.exports = router;
