const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res) => {
  try {
    const { name, description, teams, startDate, endDate, priority, color, tags } = req.body;

    if (!name || !teams || teams.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project name and at least one team are required'
      });
    }

    // ✅ Vérifie que toutes les équipes existent
    const foundTeams = await Team.find({ _id: { $in: teams } });
    if (foundTeams.length !== teams.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more teams not found'
      });
    }

    // ✅ Vérifie que l’utilisateur est membre d’au moins une équipe
    const isMember = foundTeams.some(team =>
      team.members.some(m => m.user.toString() === req.user.id)
    );
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create a project for these teams'
      });
    }

    // ✅ Crée le projet
    const project = await Project.create({
      name,
      description,
      teams,
      startDate,
      endDate,
      priority: priority || 'medium',
      color: color || '#10B981',
      tags: tags || [],
      createdBy: req.user.id
    });

    // ✅ Historique
    await History.create({
      user: req.user.id,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      entityName: name,
      project: project._id
    });

    // ✅ Notifie les membres de chaque équipe
    for (const team of foundTeams) {
      const memberIds = team.members.map(m => m.user.toString()).filter(id => id !== req.user.id);
      for (const memberId of memberIds) {
        await Notification.create({
          recipient: memberId,
          sender: req.user.id,
          type: 'project_added',
          title: 'Nouveau projet créé',
          message: `${req.user.firstName} a créé le projet "${name}"`,
          relatedProject: project._id,
          relatedTeam: team._id
        });
      }
    }

    const populatedProject = await Project.findById(project._id)
      .populate('teams', 'name color')
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
      query.teams = teamId;
    } else {
      const teams = await Team.find({ 'members.user': req.user.id });
      const teamIds = teams.map(t => t._id);
      query.teams = { $in: teamIds };
    }

    if (status) query.status = status;

    const projects = await Project.find(query)
      .populate('teams', 'name color')
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
      .populate('teams')
      .populate('createdBy', 'firstName lastName');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // ✅ Vérifie si l’utilisateur est membre d’au moins une équipe liée
    const teams = await Team.find({ _id: { $in: project.teams } });
    const isMember = teams.some(team =>
      team.members.some(m => m.user.toString() === req.user.id)
    );
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
    const { name, description, startDate, endDate, status, priority, color, tags, teams } = req.body;

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    // ✅ Vérifie que l’utilisateur est membre d’au moins une équipe du projet
    const existingTeams = await Team.find({ _id: { $in: project.teams } });
    const isMember = existingTeams.some(team =>
      team.members.some(m => m.user.toString() === req.user.id)
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (status) project.status = status;
    if (priority) project.priority = priority;
    if (color) project.color = color;
    if (tags) project.tags = tags;
    if (teams && Array.isArray(teams)) project.teams = teams;

    await project.save();

    await History.create({
      user: req.user.id,
      action: 'updated',
      entityType: 'project',
      entityId: project._id,
      entityName: project.name,
      project: project._id
    });

    const updatedProject = await Project.findById(project._id)
      .populate('teams', 'name color')
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
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const teams = await Team.find({ _id: { $in: project.teams } });
    const isMember = teams.some(team =>
      team.members.some(m => m.user.toString() === req.user.id)
    );
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
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
