const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
exportTasks,
exportProjects,
exportStatistics,
exportTeamReport,
exportHistory
} = require('../controllers/exportController');

// All routes are protected
router.use(protect);

// @route GET /api/export/tasks
// @desc Export tasks to Excel
// @access Private
router.get('/tasks', exportTasks);

// @route GET /api/export/projects
// @desc Export projects to Excel
// @access Private
router.get('/projects', exportProjects);

// @route GET /api/export/statistics
// @desc Export global statistics to Excel
// @access Private
router.get('/statistics', exportStatistics);

// @route GET /api/export/team/:teamId
// @desc Export team report to Excel
// @access Private
router.get('/team/:teamId', exportTeamReport);

// @route GET /api/export/history
// @desc Export history to Excel
// @access Private
router.get('/history', exportHistory);

module.exports = router;
