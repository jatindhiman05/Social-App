const express = require('express');
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Protected routes
router.get('/', authMiddleware.verifyToken, notificationController.getUserNotifications);
router.get('/unread-count', authMiddleware.verifyToken, notificationController.getUnreadCount);
router.patch('/mark-read', authMiddleware.verifyToken, notificationController.markAsRead);
router.patch('/:notificationId/read', authMiddleware.verifyToken, notificationController.markAsRead);
router.delete('/:notificationId', authMiddleware.verifyToken, notificationController.deleteNotification);
router.delete('/', authMiddleware.verifyToken, notificationController.deleteAllNotifications);

module.exports = router;