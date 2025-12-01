const notificationService = require('../services/notification.service');

class NotificationController {
    async getUserNotifications(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await notificationService.getUserNotifications(userId, page, limit);

            res.status(200).json({
                success: true,
                message: 'Notifications fetched successfully',
                ...result
            });
        } catch (error) {
            console.error('Get notifications error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch notifications'
            });
        }
    }

    async markAsRead(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { notificationId } = req.params;
            let result;

            if (notificationId) {
                // Mark single notification as read
                result = await notificationService.markAsRead(userId, notificationId);

                if (!result) {
                    return res.status(404).json({
                        success: false,
                        message: 'Notification not found'
                    });
                }

                res.status(200).json({
                    success: true,
                    message: 'Notification marked as read',
                    notification: result
                });
            } else {
                // Mark all notifications as read
                result = await notificationService.markAsRead(userId);

                res.status(200).json({
                    success: true,
                    message: 'All notifications marked as read',
                    ...result
                });
            }
        } catch (error) {
            console.error('Mark as read error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to mark as read'
            });
        }
    }

    async deleteNotification(req, res) {
        try {
            const userId = req.user?.id;
            const { notificationId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await notificationService.deleteNotification(userId, notificationId);

            if (!result) {
                return res.status(404).json({
                    success: false,
                    message: 'Notification not found'
                });
            }

            res.status(200).json({
                success: true,
                message: 'Notification deleted successfully'
            });
        } catch (error) {
            console.error('Delete notification error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete notification'
            });
        }
    }

    async deleteAllNotifications(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await notificationService.deleteAllNotifications(userId);

            res.status(200).json({
                success: true,
                message: 'All notifications deleted successfully',
                ...result
            });
        } catch (error) {
            console.error('Delete all notifications error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete notifications'
            });
        }
    }

    async getUnreadCount(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const count = await notificationService.getUnreadCount(userId);

            res.status(200).json({
                success: true,
                count
            });
        } catch (error) {
            console.error('Get unread count error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get unread count'
            });
        }
    }
}

module.exports = new NotificationController();