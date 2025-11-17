const Team = require('../models/Team');
const User = require('../models/User');
const History = require('../models/History');
const Notification = require('../models/Notification');
// @desc    Create new team
// @route   POST /api/teams
// @access  Private
exports.createTeam = async (req, res) => {
  try {
    const { name, description, color, memberIds } = req.body;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Team name is required'
      });
    }
    // Create team with creator as first member
    const team = await Team.create({
      name,
      description,
      color: color || '#3B82F6',
      createdBy: req.user.id,
      members: [{ user: req.user.id }]
    });
    // Add additional members if provided
    if (memberIds && Array.isArray(memberIds)) {
      for (const memberId of memberIds) {
        if (memberId !== req.user.id.toString()) {
          team.members.push({ user: memberId });
          // Update user's teams
          await User.findByIdAndUpdate(memberId, {
            $addToSet: { teams: team._id }
          });
          // Create notification
          await Notification.create({
            recipient: memberId,
            sender: req.user.id,
            type: 'team_added',
            title: 'Added to team',
            message: `You have been added to team "${name}"`,
            relatedTeam: team._id
          });
        }
      }
      await team.save();
    }
    // Update creator's teams
    await User.findByIdAndUpdate(req.user.id, {
      $addToSet: { teams: team._id }
    });
    // Create history entry
    await History.create({
      user: req.user.id,
      action: 'created',
      entityType: 'team',
      entityId: team._id,
      entityName: name
    });
    const populatedTeam = await Team.findById(team._id)
      .populate('members.user', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName');
    res.status(201).json({
      success: true,
      data: populatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating team',
      error: error.message
    });
  }
};
// @desc    Get all user's teams
// @route   GET /api/teams
// @access  Private
exports.getTeams = async (req, res) => {
  try {
    const teams = await Team.find({
      'members.user': req.user.id,
      isActive: true
    })
    .populate('members.user', 'firstName lastName email avatar')
    .populate('createdBy', 'firstName lastName')
    .sort('-createdAt');
    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching teams',
      error: error.message
    });
  }
};
// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Private
exports.getTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('members.user', 'firstName lastName email avatar bio phone')
      .populate('createdBy', 'firstName lastName');
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    // Check if user is member
    const isMember = team.members.some(m => m.user._id.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this team'
      });
    }
    res.status(200).json({
      success: true,
      data: team
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching team',
      error: error.message
    });
  }
};
// @desc    Update team
// @route   PUT /api/teams/:id
// @access  Private
exports.updateTeam = async (req, res) => {
  try {
    const { name, description, color } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    // Check if user is member
    const isMember = team.members.some(m => m.user.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }
    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (color) team.color = color;
    await team.save();
    // Create history entry
    await History.create({
      user: req.user.id,
      action: 'updated',
      entityType: 'team',
      entityId: team._id,
      entityName: team.name
    });
    const updatedTeam = await Team.findById(team._id)
      .populate('members.user', 'firstName lastName email avatar')
      .populate('createdBy', 'firstName lastName');
    res.status(200).json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating team',
      error: error.message
    });
  }
};
// @desc    Add member to team
// @route   POST /api/teams/:id/members
// @access  Private
exports.addMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    // Check if user already a member
    const alreadyMember = team.members.some(m => m.user.toString() === userId);
    if (alreadyMember) {
      return res.status(400).json({
        success: false,
        message: 'User is already a member'
      });
    }
    team.members.push({ user: userId });
    await team.save();
    // Update user's teams
    await User.findByIdAndUpdate(userId, {
      $addToSet: { teams: team._id }
    });
    // Create notification
    await Notification.create({
      recipient: userId,
      sender: req.user.id,
      type: 'team_added',
      title: 'Added to team',
      message: `You have been added to team "${team.name}"`,
      relatedTeam: team._id
    });
    const updatedTeam = await Team.findById(team._id)
      .populate('members.user', 'firstName lastName email avatar');
    res.status(200).json({
      success: true,
      data: updatedTeam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding member',
      error: error.message
    });
  }
};
// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({
        success: false,
        message: 'Team not found'
      });
    }
    team.members = team.members.filter(m => m.user.toString() !== req.params.userId);
    await team.save();
    // Update user's teams
    await User.findByIdAndUpdate(req.params.userId, {
      $pull: { teams: team._id }
    });
    res.status(200).json({
      success: true,
      message: 'Member removed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing member',
      error: error.message
    });
  }
};
