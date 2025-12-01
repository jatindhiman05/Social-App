const express = require('express');
const commentController = require('../controllers/comment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/blog/:blogId/comments', commentController.getComments);
router.get('/:commentId', commentController.getComment);

// Protected routes
router.post('/blog/:id/comment', authMiddleware.verifyToken, commentController.addComment);
router.delete('/:id', authMiddleware.verifyToken, commentController.deleteComment);
router.patch('/:id', authMiddleware.verifyToken, commentController.editComment);
router.post('/:id/like', authMiddleware.verifyToken, commentController.likeComment);
router.post('/:parentCommentId/blog/:id/reply', authMiddleware.verifyToken, commentController.addReply);

module.exports = router; 