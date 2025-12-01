const commentService = require('../services/comment.service');

class CommentController {
    async addComment(req, res) {
        try {
            const userId = req.user?.id;
            const { id: blogId } = req.params;
            const { comment } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const newComment = await commentService.addComment(blogId, userId, comment);

            res.status(200).json({
                success: true,
                message: 'Comment added successfully',
                comment: newComment
            });
        } catch (error) {
            console.error('Add comment error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add comment'
            });
        }
    }

    async deleteComment(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await commentService.deleteComment(id, userId);

            res.status(200).json(result);
        } catch (error) {
            console.error('Delete comment error:', error);
            res.status(error.message === 'Comment not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to delete comment'
            });
        }
    }

    async editComment(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;
            const { updatedCommentContent } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const updatedComment = await commentService.editComment(id, userId, updatedCommentContent);

            res.status(200).json({
                success: true,
                message: 'Comment updated successfully',
                comment: updatedComment
            });
        } catch (error) {
            console.error('Edit comment error:', error);
            res.status(error.message === 'Comment not found' ? 404 :
                error.message === 'Not authorized' ? 403 : 500).json({
                    success: false,
                    message: error.message || 'Failed to edit comment'
                });
        }
    }

    async likeComment(req, res) {
        try {
            const userId = req.user?.id;
            const { id: commentId } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await commentService.likeComment(commentId, userId);

            res.status(200).json({
                success: true,
                message: result.liked ? 'Comment liked successfully' : 'Comment unliked successfully',
                ...result
            });
        } catch (error) {
            console.error('Like comment error:', error);
            res.status(error.message === 'Comment not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to like comment'
            });
        }
    }

    async addReply(req, res) {
        try {
            const userId = req.user?.id;
            const { parentCommentId, id: blogId } = req.params;
            const { reply } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const newReply = await commentService.addReply(blogId, parentCommentId, userId, reply);

            res.status(200).json({
                success: true,
                message: 'Reply added successfully',
                reply: newReply
            });
        } catch (error) {
            console.error('Add reply error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to add reply'
            });
        }
    }

    async getComments(req, res) {
        try {
            const { blogId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await commentService.getCommentsByBlog(blogId, page, limit);

            res.status(200).json({
                success: true,
                message: 'Comments fetched successfully',
                ...result
            });
        } catch (error) {
            console.error('Get comments error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch comments'
            });
        }
    }

    async getComment(req, res) {
        try {
            const { commentId } = req.params;

            const comment = await commentService.getCommentById(commentId);

            res.status(200).json({
                success: true,
                message: 'Comment fetched successfully',
                comment
            });
        } catch (error) {
            console.error('Get comment error:', error);
            res.status(error.message === 'Comment not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to fetch comment'
            });
        }
    }
}

module.exports = new CommentController();