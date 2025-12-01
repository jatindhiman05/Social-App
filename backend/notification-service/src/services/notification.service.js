const Notification = require('../models/Notification.model');
const websocketService = require('./websocket.service');

class NotificationService {
    async createNotification(notificationData) {
        try {
            const notification = await Notification.create(notificationData);

            // Send real-time notification via WebSocket
            await websocketService.sendNotification(notification.recipient, notification);

            // Update unread count
            await this.updateUnreadCount(notification.recipient);

            return notification;
        } catch (error) {
            console.error('Create notification error:', error);
            throw error;
        }
    }

    async handleBlogLiked(event) {
        const { blogId, blogTitle, likerId, creatorId } = event;

        // Don't send notification if user likes their own blog
        if (likerId === creatorId) return;

        const notification = await this.createNotification({
            recipient: creatorId,
            sender: likerId,
            type: 'like',
            blog: blogId,
            message: 'liked your blog',
            metadata: {
                blogTitle,
                timestamp: event.timestamp || new Date()
            }
        });

        return notification;
    }

    async handleCommentAdded(event) {
        const { commentId, blogId, userId } = event;

        // Get blog creator from post service via RabbitMQ (async)
        // For now, we'll assume we have creatorId in the event
        const creatorId = event.creatorId;

        // Don't send notification if user comments on their own blog
        if (userId === creatorId) return;

        const notification = await this.createNotification({
            recipient: creatorId,
            sender: userId,
            type: 'comment',
            blog: blogId,
            comment: commentId,
            message: 'commented on your blog',
            metadata: {
                commentPreview: event.comment?.substring(0, 100),
                timestamp: event.timestamp || new Date()
            }
        });

        return notification;
    }

    async handleCommentLiked(event) {
        const { commentId, blogId, likerId, commentOwnerId } = event;

        // Don't send notification if user likes their own comment
        if (likerId === commentOwnerId) return;

        const notification = await this.createNotification({
            recipient: commentOwnerId,
            sender: likerId,
            type: 'comment-like',
            blog: blogId,
            comment: commentId,
            message: 'liked your comment',
            metadata: {
                timestamp: event.timestamp || new Date()
            }
        });

        return notification;
    }

    async handleReplyAdded(event) {
        const { commentId, replyId, blogId, replierId, commentOwnerId } = event;

        // Don't send notification if user replies to their own comment
        if (replierId === commentOwnerId) return;

        const notification = await this.createNotification({
            recipient: commentOwnerId,
            sender: replierId,
            type: 'reply',
            blog: blogId,
            comment: commentId,
            message: 'replied to your comment',
            metadata: {
                timestamp: event.timestamp || new Date()
            }
        });

        return notification;
    }

    async handleUserFollowed(event) {
        const { followerId, followedUserId } = event;

        const notification = await this.createNotification({
            recipient: followedUserId,
            sender: followerId,
            type: 'follow',
            message: 'started following you',
            metadata: {
                timestamp: event.timestamp || new Date()
            }
        });

        return notification;
    }

    async handleBlogCreated(event) {
        const { blogId, creatorId, title } = event;

        // This would notify all followers of the creator
        // For now, we'll just log it
        console.log(`Blog created: ${title} by ${creatorId}`);

        // In a real implementation, we would:
        // 1. Get followers from user service
        // 2. Create notifications for each follower
        // 3. Send via WebSocket

        return null;
    }

    async handleBlogUpdated(event) {
        const { blogId, creatorId, title } = event;

        // Similar to handleBlogCreated but for updates
        console.log(`Blog updated: ${title} by ${creatorId}`);

        return null;
    }

    async getUserNotifications(userId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const notifications = await Notification.find({ recipient: userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const total = await Notification.countDocuments({ recipient: userId });

            return {
                notifications,
                hasMore: skip + limit < total,
                total,
                page,
                limit,
                unreadCount: await this.getUnreadCount(userId)
            };
        } catch (error) {
            console.error('Get user notifications error:', error);
            throw error;
        }
    }

    async markAsRead(userId, notificationId = null) {
        try {
            if (notificationId) {
                // Mark single notification as read
                const notification = await Notification.findOneAndUpdate(
                    { _id: notificationId, recipient: userId },
                    { isRead: true },
                    { new: true }
                );

                if (notification) {
                    await this.updateUnreadCount(userId);
                }

                return notification;
            } else {
                // Mark all notifications as read
                const result = await Notification.updateMany(
                    { recipient: userId, isRead: false },
                    { isRead: true }
                );

                await this.updateUnreadCount(userId);

                return { modifiedCount: result.modifiedCount };
            }
        } catch (error) {
            console.error('Mark as read error:', error);
            throw error;
        }
    }

    async deleteNotification(userId, notificationId) {
        try {
            const notification = await Notification.findOneAndDelete({
                _id: notificationId,
                recipient: userId
            });

            if (notification && !notification.isRead) {
                await this.updateUnreadCount(userId);
            }

            return notification;
        } catch (error) {
            console.error('Delete notification error:', error);
            throw error;
        }
    }

    async deleteAllNotifications(userId) {
        try {
            const result = await Notification.deleteMany({ recipient: userId });

            // Reset unread count to 0
            await websocketService.sendUnreadCount(userId, 0);

            return { deletedCount: result.deletedCount };
        } catch (error) {
            console.error('Delete all notifications error:', error);
            throw error;
        }
    }

    async getUnreadCount(userId) {
        try {
            const count = await Notification.countDocuments({
                recipient: userId,
                isRead: false
            });

            return count;
        } catch (error) {
            console.error('Get unread count error:', error);
            throw error;
        }
    }

    async updateUnreadCount(userId) {
        try {
            const count = await this.getUnreadCount(userId);
            await websocketService.sendUnreadCount(userId, count);
            return count;
        } catch (error) {
            console.error('Update unread count error:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();