const User = require("../models/User");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ------------------------------------------------------
// 🔐 Génération du token JWT
// ------------------------------------------------------
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ------------------------------------------------------
// 🔐 LOGIN
// ------------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email et mot de passe requis" });

    const user = await User.findOne({ email }).select("+password");

    if (!user)
      return res.status(400).json({ message: "Informations incorrectes" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Informations incorrectes" });

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        user,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ------------------------------------------------------
// 👤 GET ME (profil utilisateur)
// ------------------------------------------------------
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ------------------------------------------------------
// ✏️ Update Profile (user peut modifier son propre profil)
// ------------------------------------------------------
exports.updateProfile = async (req, res) => {
  try {
    const allowedFields = ["firstName", "lastName", "phone", "bio"];
    const updates = {};

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// ------------------------------------------------------
// 👑 ADMIN - CRÉATION D'UN UTILISATEUR
// ------------------------------------------------------
exports.adminCreateUser = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res
        .status(400)
        .json({ message: "Tous les champs obligatoires doivent être remplis" });

    // Vérifier si email existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email déjà utilisé" });

    // Vérification du rôle
    if (!["admin", "member"].includes(role))
      return res.status(400).json({ message: "Rôle invalide" });

    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    console.error("Admin create user error:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
