const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// REGISTER — nouvel utilisateur = MEMBER par défaut
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ message: 'Tous les champs sont obligatoires' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé' });

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'member' // 🔥 inscription libre = simple membre
    });

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      },
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.matchPassword(password)))
      return res.status(400).json({ message: 'Identifiants invalides' });

    user.lastLogin = new Date();
    await user.save();

    res.json({
      success: true,
      data: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        teams: user.teams,
      },
      token: generateToken(user._id)
    });
  } catch (err) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
};

// GET ME
exports.getMe = async (req, res) => {
  const user = await User.findById(req.user.id).populate('teams');
  res.json({ success: true, data: user });
};

// UPDATE PROFILE
exports.updateProfile = async (req, res) => {
  const allowed = ['firstName', 'lastName', 'bio', 'phone'];
  const updates = {};

  Object.keys(req.body).forEach((key) => {
    if (allowed.includes(key)) updates[key] = req.body[key];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
  });

  res.json({ success: true, data: user });
};
