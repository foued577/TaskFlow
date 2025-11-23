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
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Gérer team (ancien) ou teams (nouveau)
    const projectTeam = project.team || (project.teams && project.teams[0]);
    
    if (req.user.role !== "admin") {
      if (!projectTeam) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      const teamId = projectTeam._id || projectTeam;
      const team = await Team.findById(teamId);
      if (!team || !team.members) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }

      const isMember = team.members.some(m => 
        m.user && m.user.toString() === req.user.id
      );
      
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized'
        });
      }
    }

    const history = await History.find({ project: req.params.projectId })
      .populate('user', 'firstName lastName')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error("Erreur lors du chargement de l'historique:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
    console.error("Erreur lors du chargement de l'historique utilisateur:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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
      .populate('user', 'firstName lastName')
      .sort('-createdAt')
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (error) {
    console.error("Erreur lors du chargement de l'historique:", error);
    res.status(500).json({
      success: false,
      message: 'Error fetching history',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
