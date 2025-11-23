const express = require("express");
const router = express.Router();

const {
  login,
  getMe,
  updateProfile,
  adminCreateUser
} = require("../controllers/authController");

const { protect, adminOnly } = require("../middleware/auth");

// ------------------------------------------------------
// 🔐 Login (public)
// ------------------------------------------------------
router.post("/login", login);

// ------------------------------------------------------
// 📝 Register (public) - Création de compte
// ------------------------------------------------------
router.post("/register", async (req, res) => {
  try {
    const User = require("../models/User");
    const { firstName, lastName, email, password, role } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Tous les champs sont obligatoires" 
      });
    }

    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "Cet email est déjà utilisé" 
      });
    }

    // Seul un admin peut créer un autre admin (mais register est public, donc par défaut member)
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role || "member",
    });

    const jwt = require("jsonwebtoken");
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({
      success: true,
      data: {
        user: newUser,
        token,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ 
      success: false,
      message: "Erreur lors de la création du compte",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ------------------------------------------------------
// 👤 Obtenir le profil utilisateur connecté
// ------------------------------------------------------
router.get("/me", protect, getMe);

// ------------------------------------------------------
// ✏️ Modifier son propre profil
// ------------------------------------------------------
router.put("/update-profile", protect, updateProfile);

// ------------------------------------------------------
// 👑 ADMIN : création d'un utilisateur (admin ou membre)
// ------------------------------------------------------
router.post("/create-user", protect, adminOnly, adminCreateUser);

module.exports = router;
