const History = require('../models/History');
const Project = require('../models/Project');
const Team = require('../models/Team');

// @desc    Get history for project
// @route   GET /api/history/project/:projectId
// @access  Private
exports.getProjectHistory = async (req, res) => {
  try {
    const { limit = 100 } = req.query;

    // Verify project access
    const project = await Project.findById(req.params.projectId).populate('team');
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const history = await History.find({ project: req.params.projectId })
      .populate('user', 'firstName lastName avatar')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: error.message
    });
  }
};

// @desc    Get user activity history
// @route   GET /api/history/user
// @access  Private
exports.getUserHistory = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const history = await History.find({ user: req.user.id })
      .populate('project', 'name color')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: error.message
    });
  }
};

// @desc    Get history for specific entity
// @route   GET /api/history/:entityType/:entityId
// @access  Private
exports.getEntityHistory = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50 } = req.query;

    const history = await History.find({
      entityType,
      entityId
    })
      .populate('user', 'firstName lastName avatar')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: error.message
    });
  }
};
