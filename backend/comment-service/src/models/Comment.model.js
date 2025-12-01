const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
    {
        comment: {
            type: String,
            required: true,
        },
        blog: {
            type: String, // Store blog ID as string (from post service)
            required: true,
        },
        user: {
            type: String, // Store user ID as string (from identity service)
            required: true,
        },
        likes: [{
            type: String, // User IDs
        }],
        replies: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        }],
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
            default: null,
        },
    },
    { timestamps: true }
);

// Indexes for better query performance
commentSchema.index({ blog: 1, createdAt: -1 });
commentSchema.index({ user: 1 });
commentSchema.index({ parentComment: 1 });
commentSchema.index({ 'createdAt': -1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;