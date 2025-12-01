const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: String, // User ID from identity service
            required: true,
        },
        sender: {
            type: String, // User ID from identity service
        },
        type: {
            type: String,
            enum: ["like", "comment", "follow", "reply", "comment-like", "blog-update", "custom"],
            required: true,
        },
        blog: {
            type: String, // Blog ID from post service
        },
        comment: {
            type: String, // Comment ID from comment service
        },
        message: {
            type: String,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        metadata: {
            blogTitle: String,
            senderName: String,
            senderUsername: String,
            senderProfilePic: String,
            commentPreview: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    },
    { timestamps: true }
);

// Indexes for better query performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ 'metadata.timestamp': -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;