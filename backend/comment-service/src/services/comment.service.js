const Comment = require('../models/Comment.model');
const rabbitmqService = require('./rabbitmq.service');

class CommentService {
    async addComment(blogId, userId, commentText) {
        try {
            if (!commentText || commentText.trim() === '') {
                throw new Error('Please enter a comment');
            }

            // Create the comment
            const comment = await Comment.create({
                comment: commentText,
                blog: blogId,
                user: userId
            });

            // Get blog info from post service via RabbitMQ
            rabbitmqService.publish('blog.events', {
                type: 'GET_BLOG_INFO',
                blogId,
                commentId: comment._id
            });

            // Publish notification event
            rabbitmqService.publishNotification({
                type: 'COMMENT_ADDED',
                commentId: comment._id,
                blogId,
                userId,
                comment: commentText,
                timestamp: new Date().toISOString()
            });

            // Publish event to update blog's comment count
            rabbitmqService.publish('blog.events', {
                type: 'COMMENT_ADDED_TO_BLOG',
                blogId,
                commentId: comment._id
            });

            return comment;
        } catch (error) {
            console.error('Add comment error:', error);
            throw error;
        }
    }

    async deleteComment(commentId, userId) {
        try {
            const comment = await Comment.findById(commentId);

            if (!comment) {
                throw new Error('Comment not found');
            }

            // Get blog info from post service to check if user is blog owner
            rabbitmqService.publish('blog.events', {
                type: 'CHECK_BLOG_OWNER',
                blogId: comment.blog,
                commentId,
                userId
            });

            // Recursively delete comment and its replies
            await this.deleteCommentAndReplies(commentId);

            // Publish event to update blog's comment count
            rabbitmqService.publish('blog.events', {
                type: 'COMMENT_DELETED_FROM_BLOG',
                blogId: comment.blog,
                commentId
            });

            return {
                success: true,
                message: 'Comment deleted successfully'
            };
        } catch (error) {
            console.error('Delete comment error:', error);
            throw error;
        }
    }

    async deleteCommentAndReplies(commentId) {
        const comment = await Comment.findById(commentId);

        if (!comment) return;

        // Recursively delete all replies
        for (const replyId of comment.replies) {
            await this.deleteCommentAndReplies(replyId);
        }

        // Remove from parent comment's replies array
        if (comment.parentComment) {
            await Comment.findByIdAndUpdate(comment.parentComment, {
                $pull: { replies: commentId }
            });
        }

        // Delete the comment
        await Comment.findByIdAndDelete(commentId);
    }

    async editComment(commentId, userId, updatedCommentContent) {
        try {
            const comment = await Comment.findById(commentId);

            if (!comment) {
                throw new Error('Comment not found');
            }

            if (comment.user !== userId) {
                throw new Error('You are not authorized to edit this comment');
            }

            comment.comment = updatedCommentContent;
            await comment.save();

            return comment;
        } catch (error) {
            console.error('Edit comment error:', error);
            throw error;
        }
    }

    async likeComment(commentId, userId) {
        try {
            const comment = await Comment.findById(commentId);

            if (!comment) {
                throw new Error('Comment not found');
            }

            const alreadyLiked = comment.likes.includes(userId);

            if (!alreadyLiked) {
                comment.likes.push(userId);
                await comment.save();

                // Publish notification if not liking own comment
                if (comment.user !== userId) {
                    rabbitmqService.publishNotification({
                        type: 'COMMENT_LIKED',
                        commentId,
                        blogId: comment.blog,
                        likerId: userId,
                        commentOwnerId: comment.user,
                        timestamp: new Date().toISOString()
                    });
                }

                return { liked: true, likesCount: comment.likes.length };
            } else {
                comment.likes = comment.likes.filter(id => id !== userId);
                await comment.save();

                return { liked: false, likesCount: comment.likes.length };
            }
        } catch (error) {
            console.error('Like comment error:', error);
            throw error;
        }
    }

    async addReply(blogId, parentCommentId, userId, replyText) {
        try {
            if (!replyText || replyText.trim() === '') {
                throw new Error('Reply cannot be empty');
            }

            const parentComment = await Comment.findById(parentCommentId);

            if (!parentComment) {
                throw new Error('Parent comment not found');
            }

            // Create the reply
            const reply = await Comment.create({
                comment: replyText,
                blog: blogId,
                user: userId,
                parentComment: parentCommentId
            });

            // Add reply to parent comment
            parentComment.replies.push(reply._id);
            await parentComment.save();

            // Publish notification to parent comment owner
            if (parentComment.user !== userId) {
                rabbitmqService.publishNotification({
                    type: 'REPLY_ADDED',
                    commentId: parentCommentId,
                    replyId: reply._id,
                    blogId,
                    replierId: userId,
                    commentOwnerId: parentComment.user,
                    timestamp: new Date().toISOString()
                });
            }

            // Publish event to update blog's comment count
            rabbitmqService.publish('blog.events', {
                type: 'COMMENT_ADDED_TO_BLOG',
                blogId,
                commentId: reply._id
            });

            return reply;
        } catch (error) {
            console.error('Add reply error:', error);
            throw error;
        }
    }

    async getCommentsByBlog(blogId, page = 1, limit = 20) {
        try {
            const skip = (page - 1) * limit;

            // Get top-level comments (no parent)
            const comments = await Comment.find({
                blog: blogId,
                parentComment: null
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            // Populate replies recursively
            const populatedComments = await Promise.all(
                comments.map(async comment => {
                    return await this.populateCommentWithReplies(comment);
                })
            );

            const totalComments = await Comment.countDocuments({
                blog: blogId,
                parentComment: null
            });

            return {
                comments: populatedComments,
                hasMore: skip + limit < totalComments,
                total: totalComments,
                page,
                limit
            };
        } catch (error) {
            console.error('Get comments error:', error);
            throw error;
        }
    }

    async populateCommentWithReplies(comment) {
        if (!comment.replies || comment.replies.length === 0) {
            return comment;
        }

        // Get user info for comment
        rabbitmqService.publish('user.events', {
            type: 'GET_USER_INFO',
            userId: comment.user
        });

        // Populate replies recursively
        const populatedReplies = await Promise.all(
            comment.replies.map(async replyId => {
                const reply = await Comment.findById(replyId).lean();
                if (reply) {
                    return await this.populateCommentWithReplies(reply);
                }
                return null;
            })
        );

        comment.replies = populatedReplies.filter(reply => reply !== null);
        return comment;
    }

    async getCommentById(commentId) {
        try {
            const comment = await Comment.findById(commentId).lean();

            if (!comment) {
                throw new Error('Comment not found');
            }

            // Get user info
            rabbitmqService.publish('user.events', {
                type: 'GET_USER_INFO',
                userId: comment.user
            });

            return comment;
        } catch (error) {
            console.error('Get comment error:', error);
            throw error;
        }
    }

    async deleteCommentsByBlog(blogId) {
        try {
            await Comment.deleteMany({ blog: blogId });
            console.log(`Deleted all comments for blog: ${blogId}`);
        } catch (error) {
            console.error('Delete comments by blog error:', error);
        }
    }

    async deleteCommentsByUser(userId) {
        try {
            await Comment.deleteMany({ user: userId });
            console.log(`Deleted all comments by user: ${userId}`);
        } catch (error) {
            console.error('Delete comments by user error:', error);
        }
    }
}

module.exports = new CommentService();