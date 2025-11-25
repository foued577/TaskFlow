const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// ======================================================
// REGISTER
// ======================================================
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // NEW USER → always member by default
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'member'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};


// ======================================================
// LOGIN
// ======================================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    // Normalize role (old users → admin)
    const safeRole = user.role || 'admin';

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          phone: user.phone,
          role: safeRole
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};


// ======================================================
// GET ME
// ======================================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('teams', 'name color');

    const safeRole = user.role || 'admin';

    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        role: safeRole
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting user',
      error: error.message
    });
  }
};


// ======================================================
// UPDATE PROFILE
// ======================================================
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    const safeRole = user.role || 'admin';

    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        role: safeRole
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};
