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
// 👤 Obtenir le profil utilisateur connecté
// ------------------------------------------------------
router.get("/me", protect, getMe);

// ------------------------------------------------------
// ✏️ Modifier son propre profil
// ------------------------------------------------------
router.put("/update-profile", protect, updateProfile);

// ------------------------------------------------------
// 👑 ADMIN : création d’un utilisateur (admin ou membre)
// ------------------------------------------------------
router.post("/create-user", protect, adminOnly, adminCreateUser);

module.exports = router;
