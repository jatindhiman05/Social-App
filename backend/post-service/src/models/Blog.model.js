const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            trim: true,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        content: {
            type: Object,
            required: true,
        },
        blogId: {
            type: String,
            required: true,
            unique: true,
        },
        image: {
            type: String,
            required: true,
        },
        imageId: {
            type: String,
            required: true,
        },
        draft: {
            type: Boolean,
            default: false,
        },
        creator: {
            type: String, // Store user ID as string (from identity service)
            required: true,
        },
        likes: [{
            type: String, // User IDs
        }],
        comments: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Comment',
        }],
        totalSaves: [{
            type: String, // User IDs
        }],
        tags: {
            type: [String],
        },
    },
    { timestamps: true }
);

// Indexes for better query performance
blogSchema.index({ blogId: 1 });
blogSchema.index({ creator: 1 });
blogSchema.index({ draft: 1, createdAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ 'createdAt': -1 });

const Blog = mongoose.model('Blog', blogSchema);

module.exports = Blog;