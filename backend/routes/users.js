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

// Toutes les routes nécessitent un token
router.use(protect);

// Seul l'admin peut gérer les utilisateurs
router.route('/')
  .get(adminOnly, getUsers)
  .post(adminOnly, createUser);

router.route('/:id')
  .get(adminOnly, getUser)
  .put(adminOnly, updateUser)
  .delete(adminOnly, deleteUser);

module.exports = router;
