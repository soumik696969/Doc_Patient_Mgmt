const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Get user profile
router.get('/profile', authController.getProfile);

// Update user profile
router.put('/profile', authController.updateProfile);

// Get user by ID (internal)
router.get('/:id', authController.getUserById);

module.exports = router;
