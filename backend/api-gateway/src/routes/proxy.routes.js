const express = require('express');
const proxy = require('../services/proxy.service');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes (no auth required)
router.post('/auth/signup', proxy.createAuthProxy());
router.post('/auth/signin', proxy.createAuthProxy());
router.post('/auth/google-auth', proxy.createAuthProxy());
router.get('/auth/verify-email/:verificationToken', proxy.createAuthProxy());
router.get('/auth/confirm-transfer/:action/:token', proxy.createAuthProxy());

// Public blog routes
router.get('/blogs', proxy.createPostProxy());
router.get('/blogs/search', proxy.createPostProxy());
router.get('/blogs/:blogId', proxy.createPostProxy());

// Public user routes  
router.get('/users', proxy.createUserProxy());
router.get('/users/:username', proxy.createUserProxy());

// Protected routes (require auth)
router.patch('/auth/change-password', verifyToken, proxy.createAuthProxy());
router.post('/auth/transfer-account', verifyToken, proxy.createAuthProxy());

router.post('/blogs', verifyToken, proxy.createPostProxy());
router.patch('/blogs/:id', verifyToken, proxy.createPostProxy());
router.delete('/blogs/:id', verifyToken, proxy.createPostProxy());
router.post('/blogs/like/:id', verifyToken, proxy.createPostProxy());
router.patch('/blogs/save-blog/:id', verifyToken, proxy.createPostProxy());

router.patch('/users/:id', verifyToken, proxy.createUserProxy());
router.delete('/users/:id', verifyToken, proxy.createUserProxy());
router.patch('/users/follow/:id', verifyToken, proxy.createUserProxy());
router.patch('/users/change-saved-liked-blog-visibility', verifyToken, proxy.createUserProxy());

router.post('/blogs/comment/:id', verifyToken, proxy.createCommentProxy());
router.delete('/blogs/comment/:id', verifyToken, proxy.createCommentProxy());
router.patch('/blogs/edit-comment/:id', verifyToken, proxy.createCommentProxy());
router.patch('/blogs/like-comment/:id', verifyToken, proxy.createCommentProxy());
router.post('/comment/:parentCommentId/:id', verifyToken, proxy.createCommentProxy());

router.get('/notifications', verifyToken, proxy.createNotificationProxy());
router.patch('/notifications/mark-read', verifyToken, proxy.createNotificationProxy());
router.patch('/notifications/:id/read', verifyToken, proxy.createNotificationProxy());
router.delete('/notifications/:id', verifyToken, proxy.createNotificationProxy());
router.delete('/notifications', verifyToken, proxy.createNotificationProxy());

router.post('/media/upload', verifyToken, proxy.createMediaProxy());
router.delete('/media/:imageId', verifyToken, proxy.createMediaProxy());

module.exports = router;