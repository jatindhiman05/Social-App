const express = require('express');
const blogController = require('../controllers/blog.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// ===== FIXED ROUTES =====
// Add this new route for the frontend fix
router.get('/all', blogController.getBlogs); // This will handle /api/all

// Existing routes
router.get('/search', blogController.searchBlogs);
router.get('/user/:userId', blogController.getBlogsByUser);
router.get('/:blogId', blogController.getBlog);

// Protected routes
router.post('/', authMiddleware.verifyToken, blogController.createBlog);
router.patch('/:id', authMiddleware.verifyToken, blogController.updateBlog);
router.delete('/:id', authMiddleware.verifyToken, blogController.deleteBlog);
router.post('/like/:id', authMiddleware.verifyToken, blogController.likeBlog);
router.patch('/save-blog/:id', authMiddleware.verifyToken, blogController.saveBlog);

module.exports = router;