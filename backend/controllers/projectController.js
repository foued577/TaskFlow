const Project = require('../models/Project');
const Team = require('../models/Team');
const History = require('../models/History');
const Notification = require('../models/Notification');

// Helper pour normaliser les équipes d'un projet
const getProjectTeamIds = (project) => {
  if (project.teams && project.teams.length > 0) {
    return project.teams.map((t) => t.toString());
  }
  if (project.team) {
    return [project.team.toString()];
  }
  return [];
};

const isGlobalAdmin = (user) => !user.role || user.role === 'admin';

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (admin global uniquement)
exports.createProject = async (req, res) => {
  try {
    const {
      name,
      description,
      teamIds, // nouveau format tableau
      teamId, // compat
      startDate,
      endDate,
      priority,
      color,
      tags,
    } = req.body;

    if (!isGlobalAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create projects',
      });
    }

    let teamsArray = Array.isArray(teamIds)
      ? teamIds.filter(Boolean)
      : [];
    if (teamsArray.length === 0 && teamId) {
      teamsArray = [teamId];
    }

    if (!name || teamsArray.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Project name and at least one team are required',
      });
    }

    const foundTeams = await Team.find({ _id: { $in: teamsArray } });
    if (foundTeams.length !== teamsArray.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more teams not found',
      });
    }

    const isMember = foundTeams.some((team) =>
      team.members.some((m) => m.user.toString() === req.user.id)
    );
    if (!isMember && !isGlobalAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create a project for these teams',
      });
    }

    const project = await Project.create({
      name,
      description,
      team: teamsArray[0],
      teams: teamsArray,
      startDate,
      endDate,
      priority: priority || 'medium',
      color: color || '#10B981',
      tags: tags || [],
      createdBy: req.user.id,
    });

    await History.create({
      user: req.user.id,
      action: 'created',
      entityType: 'project',
      entityId: project._id,
      entityName: name,
      project: project._id,
    });

    for (const team of foundTeams) {
      const memberIds = team.members
        .map((m) => m.user.toString())
        .filter((id) => id !== req.user.id);

      for (const memberId of memberIds) {
        await Notification.create({
          recipient: memberId,
          sender: req.user.id,
          type: 'project_added',
          title: 'Nouveau projet créé',
          message: `${req.user.firstName} a créé le projet "${name}"`,
          relatedProject: project._id,
          relatedTeam: team._id,
        });
      }
    }

    const populatedProject = await Project.findById(project._id)
      .populate('teams', 'name color')
      .populate('team', 'name color')
      .populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      data: populatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message,
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
      query.$or = [{ team: teamId }, { teams: teamId }];
    } else {
      const teams = await Team.find({ 'members.user': req.user.id });
      const teamIds = teams.map((t) => t._id);

      query.$or = [
        { team: { $in: teamIds } },
        { teams: { $in: teamIds } },
      ];
    }

    if (status) {
      query.status = status;
    }

    const projects = await Project.find(query)
      .populate('teams', 'name color')
      .populate('team', 'name color')
      .populate('createdBy', 'firstName lastName')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message,
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
      .populate('team')
      .populate('createdBy', 'firstName lastName');

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const allTeamIds = getProjectTeamIds(project);
    const teams = await Team.find({ _id: { $in: allTeamIds } });

    const isMember = teams.some((team) =>
      team.members.some((m) => m.user.toString() === req.user.id)
    );

    if (!isMember && !isGlobalAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message,
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (admin global uniquement)
exports.updateProject = async (req, res) => {
  try {
    const {
      name,
      description,
      startDate,
      endDate,
      status,
      priority,
      color,
      tags,
      teamIds,
      teamId,
    } = req.body;

    if (!isGlobalAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can update projects',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const currentTeamIds = getProjectTeamIds(project);
    const currentTeams = await Team.find({ _id: { $in: currentTeamIds } });
    const isMember = currentTeams.some((team) =>
      team.members.some((m) => m.user.toString() === req.user.id)
    );
    if (!isMember && !isGlobalAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    let newTeamsArray = null;
    if (Array.isArray(teamIds) && teamIds.length > 0) {
      newTeamsArray = teamIds.filter(Boolean);
    } else if (teamId) {
      newTeamsArray = [teamId];
    }

    if (newTeamsArray) {
      const foundTeams = await Team.find({ _id: { $in: newTeamsArray } });
      if (foundTeams.length !== newTeamsArray.length) {
        return res.status(404).json({
          success: false,
          message: 'One or more teams not found',
        });
      }
      project.team = newTeamsArray[0];
      project.teams = newTeamsArray;
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

    await History.create({
      user: req.user.id,
      action: 'updated',
      entityType: 'project',
      entityId: project._id,
      entityName: project.name,
      project: project._id,
    });

    const updatedProject = await Project.findById(project._id)
      .populate('teams', 'name color')
      .populate('team', 'name color')
      .populate('createdBy', 'firstName lastName');

    res.status(200).json({
      success: true,
      data: updatedProject,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message,
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (admin global uniquement)
exports.deleteProject = async (req, res) => {
  try {
    if (!isGlobalAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete projects',
      });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    const allTeamIds = getProjectTeamIds(project);
    const teams = await Team.find({ _id: { $in: allTeamIds } });

    const isMember = teams.some((team) =>
      team.members.some((m) => m.user.toString() === req.user.id)
    );
    if (!isMember && !isGlobalAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message,
    });
  }
};
