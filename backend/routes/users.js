const express = require('express');
const router = express.Router();

const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser
} = require('../controllers/userController');

const { protect, adminOnly } = require('../middleware/auth');

// Toutes les routes nécessitent un token valide
router.use(protect);

// ADMIN SEULEMENT → peut gérer les utilisateurs
router.route('/')
  .get(adminOnly, getUsers)     // liste utilisateurs
  .post(adminOnly, createUser); // création d'utilisateur par admin

router.route('/:id')
  .get(adminOnly, getUser)      // récupérer user
  .put(adminOnly, updateUser)   // modifier user
  .delete(adminOnly, deleteUser); // supprimer user

module.exports = router;
