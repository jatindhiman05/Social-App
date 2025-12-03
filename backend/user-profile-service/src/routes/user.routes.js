const express = require('express');
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', userController.getAllUsers);
router.get('/search', userController.searchUsers);
router.post('/sync-profile', userController.syncProfile);
router.get('/:username', userController.getProfile);

// Protected routes
router.get('/me/profile', authMiddleware.verifyToken, userController.getCurrentUserProfile);
router.patch('/:id', authMiddleware.verifyToken, userController.updateProfile);
router.delete('/:id', authMiddleware.verifyToken, userController.deleteProfile);
router.patch('/follow/:id', authMiddleware.verifyToken, userController.followUser);
router.patch('/settings/visibility', authMiddleware.verifyToken, userController.updateVisibilitySettings);

module.exports = router;