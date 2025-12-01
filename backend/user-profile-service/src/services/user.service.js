const Profile = require('../models/Profile.model');
const rabbitmqService = require('./rabbitmq.service');

class UserService {
    async createProfile(userId, userData) {
        try {
            const { name, email, username, googleAuth = false } = userData;

            // Check if profile already exists
            let profile = await Profile.findOne({ userId });

            if (profile) {
                throw new Error('Profile already exists');
            }

            profile = await Profile.create({
                userId,
                name,
                email,
                username,
                googleAuth
            });

            return profile;
        } catch (error) {
            console.error('Create profile error:', error);
            throw error;
        }
    }

    async createProfileFromEvent(event) {
        try {
            const { userId, name, email, username, googleAuth } = event;

            const profile = await Profile.create({
                userId,
                name,
                email,
                username,
                googleAuth: googleAuth || false
            });

            console.log(`Profile created for user ${userId}`);
            return profile;
        } catch (error) {
            console.error('Create profile from event error:', error);
        }
    }

    async getProfile(userId) {
        try {
            const profile = await Profile.findOne({ userId }).lean();

            if (!profile) {
                throw new Error('Profile not found');
            }

            // Get blog details from post service via RabbitMQ
            rabbitmqService.publish('blog.events', {
                type: 'GET_USER_BLOGS',
                userId,
                profileId: profile._id
            });

            // Get liked blogs if allowed
            if (profile.showLikedBlogs) {
                rabbitmqService.publish('blog.events', {
                    type: 'GET_LIKED_BLOGS',
                    userId,
                    blogIds: profile.likeBlogs
                });
            }

            // Get saved blogs if allowed
            if (profile.showSavedBlogs) {
                rabbitmqService.publish('blog.events', {
                    type: 'GET_SAVED_BLOGS',
                    userId,
                    blogIds: profile.saveBlogs
                });
            }

            return profile;
        } catch (error) {
            console.error('Get profile error:', error);
            throw error;
        }
    }

    async getProfileByUsername(username) {
        try {
            const profile = await Profile.findOne({ username }).lean();

            if (!profile) {
                throw new Error('User not found');
            }

            // Don't expose private data if settings don't allow
            const response = { ...profile };

            if (!profile.showLikedBlogs) {
                delete response.likeBlogs;
            }

            if (!profile.showSavedBlogs) {
                delete response.saveBlogs;
            }

            // Get user blogs
            rabbitmqService.publish('blog.events', {
                type: 'GET_USER_BLOGS_PUBLIC',
                userId: profile.userId,
                includeDrafts: false
            });

            return response;
        } catch (error) {
            console.error('Get profile by username error:', error);
            throw error;
        }
    }

    async updateProfile(userId, updateData) {
        try {
            const { name, username, bio, profilePic, profilePicId } = updateData;

            const profile = await Profile.findOne({ userId });

            if (!profile) {
                throw new Error('Profile not found');
            }

            // Check if username is taken
            if (username && username !== profile.username) {
                const existingUser = await Profile.findOne({ username, userId: { $ne: userId } });
                if (existingUser) {
                    throw new Error('Username already taken');
                }
                profile.username = username;
            }

            if (name) profile.name = name;
            if (bio !== undefined) profile.bio = bio;
            if (profilePic !== undefined) profile.profilePic = profilePic;
            if (profilePicId !== undefined) profile.profilePicId = profilePicId;

            await profile.save();

            return profile;
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    async followUser(followerId, userIdToFollow) {
        try {
            if (followerId === userIdToFollow) {
                throw new Error('You cannot follow yourself');
            }

            const followerProfile = await Profile.findOne({ userId: followerId });
            const userToFollowProfile = await Profile.findOne({ userId: userIdToFollow });

            if (!followerProfile || !userToFollowProfile) {
                throw new Error('User not found');
            }

            const isAlreadyFollowing = userToFollowProfile.followers.includes(followerId);

            if (!isAlreadyFollowing) {
                // Add to followers list
                userToFollowProfile.followers.push(followerId);
                await userToFollowProfile.save();

                // Add to following list
                followerProfile.following.push(userIdToFollow);
                await followerProfile.save();

                // Publish notification event
                rabbitmqService.publishNotification({
                    type: 'USER_FOLLOWED',
                    followerId,
                    followedUserId: userIdToFollow,
                    timestamp: new Date().toISOString()
                });

                return { following: true, followersCount: userToFollowProfile.followers.length };
            } else {
                // Remove from followers list
                userToFollowProfile.followers = userToFollowProfile.followers.filter(id => id !== followerId);
                await userToFollowProfile.save();

                // Remove from following list
                followerProfile.following = followerProfile.following.filter(id => id !== userIdToFollow);
                await followerProfile.save();

                return { following: false, followersCount: userToFollowProfile.followers.length };
            }
        } catch (error) {
            console.error('Follow user error:', error);
            throw error;
        }
    }

    async updateVisibilitySettings(userId, settings) {
        try {
            const { showLikedBlogs, showSavedBlogs } = settings;

            const profile = await Profile.findOne({ userId });

            if (!profile) {
                throw new Error('Profile not found');
            }

            if (showLikedBlogs !== undefined) profile.showLikedBlogs = showLikedBlogs;
            if (showSavedBlogs !== undefined) profile.showSavedBlogs = showSavedBlogs;

            await profile.save();

            return profile;
        } catch (error) {
            console.error('Update visibility settings error:', error);
            throw error;
        }
    }

    async deleteProfile(userId) {
        try {
            const result = await Profile.deleteOne({ userId });

            // Publish event for other services
            rabbitmqService.publish('user.events', {
                type: 'PROFILE_DELETED',
                userId
            });

            return { deletedCount: result.deletedCount };
        } catch (error) {
            console.error('Delete profile error:', error);
            throw error;
        }
    }

    // Event handlers for blog events
    async addBlogToUser(userId, blogId) {
        try {
            await Profile.updateOne(
                { userId },
                { $addToSet: { blogs: blogId } }
            );
        } catch (error) {
            console.error('Add blog to user error:', error);
        }
    }

    async removeBlogFromUser(userId, blogId) {
        try {
            await Profile.updateOne(
                { userId },
                { $pull: { blogs: blogId } }
            );
        } catch (error) {
            console.error('Remove blog from user error:', error);
        }
    }

    async addLikedBlog(userId, blogId) {
        try {
            await Profile.updateOne(
                { userId },
                { $addToSet: { likeBlogs: blogId } }
            );
        } catch (error) {
            console.error('Add liked blog error:', error);
        }
    }

    async removeLikedBlog(userId, blogId) {
        try {
            await Profile.updateOne(
                { userId },
                { $pull: { likeBlogs: blogId } }
            );
        } catch (error) {
            console.error('Remove liked blog error:', error);
        }
    }

    async addSavedBlog(userId, blogId) {
        try {
            await Profile.updateOne(
                { userId },
                { $addToSet: { saveBlogs: blogId } }
            );
        } catch (error) {
            console.error('Add saved blog error:', error);
        }
    }

    async removeSavedBlog(userId, blogId) {
        try {
            await Profile.updateOne(
                { userId },
                { $pull: { saveBlogs: blogId } }
            );
        } catch (error) {
            console.error('Remove saved blog error:', error);
        }
    }

    async getAllUsers(page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            const users = await Profile.find({})
                .sort({ 'stats.followersCount': -1 })
                .skip(skip)
                .limit(limit)
                .select('userId name username profilePic bio stats')
                .lean();

            const total = await Profile.countDocuments();

            return {
                users,
                hasMore: skip + limit < total,
                total,
                page,
                limit
            };
        } catch (error) {
            console.error('Get all users error:', error);
            throw error;
        }
    }

    async searchUsers(query) {
        try {
            const users = await Profile.find({
                $or: [
                    { name: { $regex: query, $options: 'i' } },
                    { username: { $regex: query, $options: 'i' } },
                    { bio: { $regex: query, $options: 'i' } }
                ]
            })
                .limit(10)
                .select('userId name username profilePic bio stats')
                .lean();

            return users;
        } catch (error) {
            console.error('Search users error:', error);
            throw error;
        }
    }

    async updateUserVerification(userId, isVerified) {
        try {
            // This would update verification status if needed
            // Currently just logging
            console.log(`User ${userId} verification status: ${isVerified}`);
        } catch (error) {
            console.error('Update user verification error:', error);
        }
    }
}

module.exports = new UserService();