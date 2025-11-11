const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');
const { emitNotification } = require('../utils/socketHelper');

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { name, description, teamId, startDate, endDate, priority, color, tags } = req.body;

    if (!name || !teamId) {
      return res.status(400).json({
        success: false,
        message: 'Project name and team are required'
      });
    }

    // Verify team exists and user is member
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }

    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create project for this team'
      });
    }

    const project = await Project.create({
      name,
      description,
      team: teamId,
      startDate,
      endDate,
      priority: priority || 'medium',
      color: color || '#10B981',
      tags: tags || [],
      createdBy: req.user.id
    });

    // Create history entry
    await History.create({
      user: req.user.id,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      entityName: name,
      project: project._id
    });

    // Notify team members
    const io = req.app.get('io');
    const memberIds = team.members.map(m => m.user.toString()).filter(id => id !== req.user.id);
    for (const memberId of memberIds) {
      const notification = await Notification.create({
        recipient: memberId,
        sender: req.user.id,
        type: 'project_added',
        title: 'New project created',
        message: `${req.user.firstName} created project "${name}"`,
        relatedProject: project._id,
        relatedTeam: teamId
      });
      // 🔔 Émettre la notification via Socket.io
      emitNotification(io, notification);
    }

    const populatedProject = await Project.findById(project._id)
      .populate('team', 'name color')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// @desc    Get all projects for user's teams
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
  try {
    const { teamId, status } = req.query;

    let query = {};

    if (teamId) {
      query.team = teamId;
    } else {
      // Get all teams user is member of
      const teams = await Team.find({ 'members.user': req.user.id });
      const teamIds = teams.map(t => t._id);
      query.team = { $in: teamIds };
    }

    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('team', 'name color')
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team')
      .populate('createdBy', 'firstName lastName');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is team member
    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    res.status(200).json({
      success: true,
      data: project
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res) => {
  try {
    const { name, description, startDate, endDate, status, priority, color, tags } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (color) project.color = color;
    if (tags) project.tags = tags;

    await project.save();

    // Create history entry
    await History.create({
      user: req.user.id,
      action: 'updated',
      entityType: 'project',
      entityId: project._id,
      entityName: project.name,
      project: project._id
    });

    const updatedProject = await Project.findById(project._id)
      .populate('team', 'name color')
      .populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check authorization
    const team = await Team.findById(project.team);
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};
