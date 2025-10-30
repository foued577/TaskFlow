const express = require('express');
const router = express.Router();
const { getProjectHistory, getUserHistory, getEntityHistory } = require('../controllers/historyController');
const { protect } = require('../middleware/auth');

router.get('/project/:projectId', protect, getProjectHistory);
router.get('/user', protect, getUserHistory);
router.get('/:entityType/:entityId', protect, getEntityHistory);

module.exports = router;
