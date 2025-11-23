const express = require('express');
const router = express.Router();
const { searchUsers, getUser } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.get('/search', protect, searchUsers);
router.get('/:id', protect, getUser);

module.exports = router;
