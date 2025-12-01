const express = require('express');
const blogController = require('../controllers/blog.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes
router.get('/', blogController.getBlogs);
router.get('/:blogId', blogController.getBlog);
router.get('/search', blogController.searchBlogs);
router.get('/user/:userId', blogController.getBlogsByUser);

// Protected routes (require authentication)
router.post('/', authMiddleware.verifyToken, blogController.createBlog);
router.patch('/:id', authMiddleware.verifyToken, blogController.updateBlog);
router.delete('/:id', authMiddleware.verifyToken, blogController.deleteBlog);
router.post('/like/:id', authMiddleware.verifyToken, blogController.likeBlog);
router.patch('/save-blog/:id', authMiddleware.verifyToken, blogController.saveBlog);

module.exports = router;