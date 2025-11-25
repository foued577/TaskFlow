const express = require('express');
const router = express.Router();

const { searchUsers, getUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// =============================================
// Routes utilisateurs
// =============================================

// 🔍 Recherche d'utilisateurs
router.get('/search', protect, searchUsers);

// 📄 Récupérer un utilisateur par ID
router.get('/:id', protect, getUser);

module.exports = router;
