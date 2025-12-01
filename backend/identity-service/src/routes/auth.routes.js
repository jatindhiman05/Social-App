const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/google-auth', authController.googleAuth);
router.get('/verify-email/:verificationToken', authController.verifyEmail);

// Protected routes
router.patch('/change-password', authMiddleware.verifyToken, authController.changePassword);
router.post('/transfer-account', authMiddleware.verifyToken, authController.transferAccount);
router.get('/confirm-transfer/:action/:token', authController.confirmTransfer);

module.exports = router;