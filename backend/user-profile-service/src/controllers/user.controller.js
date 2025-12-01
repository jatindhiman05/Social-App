const userService = require('../services/user.service');

class UserController {
    async getProfile(req, res) {
        try {
            const { username } = req.params;

            const profile = await userService.getProfileByUsername(username);

            res.status(200).json({
                success: true,
                message: 'User profile fetched successfully',
                user: profile
            });
        } catch (error) {
            console.error('Get profile error:', error);
            res.status(error.message === 'User not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to fetch profile'
            });
        }
    }

    async getCurrentUserProfile(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const profile = await userService.getProfile(userId);

            res.status(200).json({
                success: true,
                message: 'Profile fetched successfully',
                user: profile
            });
        } catch (error) {
            console.error('Get current user profile error:', error);
            res.status(error.message === 'Profile not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to fetch profile'
            });
        }
    }

    async updateProfile(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            if (userId !== id) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only update your own profile'
                });
            }

            const updateData = {
                name: req.body.name,
                username: req.body.username,
                bio: req.body.bio,
                profilePic: req.body.profilePic,
                profilePicId: req.body.profilePicId
            };

            const profile = await userService.updateProfile(userId, updateData);

            res.status(200).json({
                success: true,
                message: 'Profile updated successfully',
                user: {
                    name: profile.name,
                    username: profile.username,
                    bio: profile.bio,
                    profilePic: profile.profilePic
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(error.message === 'Profile not found' ? 404 :
                error.message === 'Username already taken' ? 400 : 500).json({
                    success: false,
                    message: error.message || 'Failed to update profile'
                });
        }
    }

    async deleteProfile(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            if (userId !== id) {
                return res.status(403).json({
                    success: false,
                    message: 'You can only delete your own profile'
                });
            }

            const result = await userService.deleteProfile(userId);

            res.status(200).json({
                success: true,
                message: 'Profile deleted successfully',
                ...result
            });
        } catch (error) {
            console.error('Delete profile error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete profile'
            });
        }
    }

    async followUser(req, res) {
        try {
            const followerId = req.user?.id;
            const { id: userIdToFollow } = req.params;

            if (!followerId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await userService.followUser(followerId, userIdToFollow);

            res.status(200).json({
                success: true,
                message: result.following ? 'Followed successfully' : 'Unfollowed successfully',
                ...result
            });
        } catch (error) {
            console.error('Follow user error:', error);
            res.status(error.message === 'You cannot follow yourself' ? 400 :
                error.message === 'User not found' ? 404 : 500).json({
                    success: false,
                    message: error.message || 'Failed to follow user'
                });
        }
    }

    async updateVisibilitySettings(req, res) {
        try {
            const userId = req.user?.id;
            const { showLikedBlogs, showSavedBlogs } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const profile = await userService.updateVisibilitySettings(userId, {
                showLikedBlogs,
                showSavedBlogs
            });

            res.status(200).json({
                success: true,
                message: 'Visibility settings updated',
                settings: {
                    showLikedBlogs: profile.showLikedBlogs,
                    showSavedBlogs: profile.showSavedBlogs
                }
            });
        } catch (error) {
            console.error('Update visibility settings error:', error);
            res.status(error.message === 'Profile not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to update settings'
            });
        }
    }

    async getAllUsers(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await userService.getAllUsers(page, limit);

            res.status(200).json({
                success: true,
                message: 'Users fetched successfully',
                ...result
            });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch users'
            });
        }
    }

    async searchUsers(req, res) {
        try {
            const { query } = req.query;

            if (!query || query.trim() === '') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const users = await userService.searchUsers(query);

            res.status(200).json({
                success: true,
                message: 'Users found',
                users
            });
        } catch (error) {
            console.error('Search users error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to search users'
            });
        }
    }
}

module.exports = new UserController();