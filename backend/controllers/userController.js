const User = require('../models/User');
const Team = require('../models/Team');

// =============================================
// @desc    Search users (filtered)
// @route   GET /api/users/search
// @access  Private
// =============================================
exports.searchUsers = async (req, res) => {
  try {
    const { q, teamId } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    // Build search filter
    const searchFilter = {
      $or: [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    };

    // Exclude users already in the team (Teams.js requires this)
    if (teamId) {
      const team = await Team.findById(teamId).select('members.user');

      if (team) {
        const existingMembers = team.members.map((m) => m.user.toString());
        searchFilter._id = { $nin: existingMembers };
      }
    }

    const users = await User.find(searchFilter)
      .select('firstName lastName email avatar role');

    res.status(200).json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching users'
    });
  }
};

// =============================================
// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
// =============================================
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('teams', 'name color');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user'
    });
  }
};
