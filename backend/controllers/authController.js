const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

// ==============================
// REGISTER
// ==============================
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Déjà existant ?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // 👉 Tous les nouveaux inscrits sont "member"
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'member',
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
          bio: user.bio,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
    });
  }
};

// ==============================
// LOGIN
// ==============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // ⚠️ Bien récupérer le password (select: false dans le modèle)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Dernière connexion
    user.lastLogin = new Date();

    // Ancien utilisateur sans role → admin par défaut
    if (!user.role) {
      user.role = 'admin';
    }

    await user.save();

    const token = generateToken(user._id);

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
          role: user.role || 'admin',
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

// ==============================
// GET ME
// ==============================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      'teams',
      'name color'
    );

    if (!user.role) {
      user.role = 'admin';
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user',
    });
  }
};

// ==============================
// UPDATE PROFILE
// ==============================
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, bio, phone } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (bio !== undefined) user.bio = bio;
    if (phone !== undefined) user.phone = phone;

    // On ne touche PAS au rôle ici

    await user.save();

    if (!user.role) {
      user.role = 'admin';
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
    });
  }
};
