const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
    {
        userId: {
            type: String, // Reference to user in identity service
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        username: {
            type: String,
            required: true,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        profilePic: {
            type: String,
            default: null,
        },
        profilePicId: {
            type: String,
            default: null,
        },
        bio: {
            type: String,
            default: '',
        },
        followers: [{
            type: String, // User IDs
        }],
        following: [{
            type: String, // User IDs
        }],
        blogs: [{
            type: String, // Blog IDs from post service
        }],
        saveBlogs: [{
            type: String, // Blog IDs from post service
        }],
        likeBlogs: [{
            type: String, // Blog IDs from post service
        }],
        showLikedBlogs: {
            type: Boolean,
            default: true,
        },
        showSavedBlogs: {
            type: Boolean,
            default: false,
        },
        googleAuth: {
            type: Boolean,
            default: false,
        },
        stats: {
            blogsCount: { type: Number, default: 0 },
            followersCount: { type: Number, default: 0 },
            followingCount: { type: Number, default: 0 },
            likesCount: { type: Number, default: 0 },
        },
        metadata: {
            joinedAt: { type: Date, default: Date.now },
            lastSeen: Date,
            location: String,
            website: String,
            socialLinks: {
                twitter: String,
                github: String,
                linkedin: String,
            }
        }
    },
    { timestamps: true }
);

// Indexes for better query performance
profileSchema.index({ userId: 1 });
profileSchema.index({ username: 1 }, { unique: true });
profileSchema.index({ email: 1 }, { unique: true });
profileSchema.index({ 'stats.blogsCount': -1 });
profileSchema.index({ 'stats.followersCount': -1 });

// Update stats before saving
profileSchema.pre('save', function (next) {
    this.stats = {
        blogsCount: this.blogs.length,
        followersCount: this.followers.length,
        followingCount: this.following.length,
        likesCount: this.likeBlogs.length
    };
    next();
});

const Profile = mongoose.model('Profile', profileSchema);

module.exports = Profile;