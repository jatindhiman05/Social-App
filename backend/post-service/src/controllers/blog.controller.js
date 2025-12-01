const blogService = require('../services/blog.service');

class BlogController {
    async createBlog(req, res) {
        try {
            const creator = req.user?.id;
            if (!creator) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { title, description, content, tags, draft } = req.body;
            const files = req.files;

            const result = await blogService.createBlog(creator, {
                title,
                description,
                content,
                tags,
                draft
            }, files ? Object.values(files).flat() : null);

            res.status(200).json({
                success: true,
                message: result.message,
                blog: result.blog
            });
        } catch (error) {
            console.error('Create blog error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to create blog'
            });
        }
    }

    async getBlogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await blogService.getBlogs(page, limit);

            res.status(200).json({
                success: true,
                message: 'Blogs fetched successfully',
                ...result
            });
        } catch (error) {
            console.error('Get blogs error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch blogs'
            });
        }
    }

    async getBlog(req, res) {
        try {
            const { blogId } = req.params;

            const blog = await blogService.getBlog(blogId);

            res.status(200).json({
                success: true,
                message: 'Blog fetched successfully',
                blog
            });
        } catch (error) {
            console.error('Get blog error:', error);
            res.status(error.message === 'Blog not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to fetch blog'
            });
        }
    }

    async updateBlog(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const updateData = {
                title: req.body.title,
                description: req.body.description,
                content: req.body.content,
                tags: req.body.tags,
                draft: req.body.draft,
                existingImages: req.body.existingImages
            };

            const files = req.files;
            const images = files ? {
                cover: files.image?.[0],
                embedded: files.images || []
            } : null;

            const blog = await blogService.updateBlog(id, userId, updateData, images);

            res.status(200).json({
                success: true,
                message: blog.draft ? 'Blog saved as draft' : 'Blog updated successfully',
                blog
            });
        } catch (error) {
            console.error('Update blog error:', error);
            res.status(error.message === 'Blog not found' ? 404 :
                error.message === 'You are not authorized' ? 403 : 500).json({
                    success: false,
                    message: error.message || 'Failed to update blog'
                });
        }
    }

    async deleteBlog(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await blogService.deleteBlog(id, userId);

            res.status(200).json(result);
        } catch (error) {
            console.error('Delete blog error:', error);
            res.status(error.message === 'Blog not found' ? 404 :
                error.message === 'Unauthorized' ? 403 : 500).json({
                    success: false,
                    message: error.message || 'Failed to delete blog'
                });
        }
    }

    async likeBlog(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await blogService.likeBlog(id, userId);

            res.status(200).json({
                success: true,
                message: result.liked ? 'Blog liked successfully' : 'Blog unliked successfully',
                ...result
            });
        } catch (error) {
            console.error('Like blog error:', error);
            res.status(error.message === 'Blog not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to like blog'
            });
        }
    }

    async saveBlog(req, res) {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const result = await blogService.saveBlog(id, userId);

            res.status(200).json({
                success: true,
                message: result.saved ? 'Blog saved successfully' : 'Blog unsaved successfully',
                ...result
            });
        } catch (error) {
            console.error('Save blog error:', error);
            res.status(error.message === 'Blog not found' ? 404 : 500).json({
                success: false,
                message: error.message || 'Failed to save blog'
            });
        }
    }

    async searchBlogs(req, res) {
        try {
            const { search, tag } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!search && !tag) {
                return res.status(400).json({
                    success: false,
                    message: 'Search query or tag is required'
                });
            }

            const result = await blogService.searchBlogs(search, tag, page, limit);

            res.status(200).json({
                success: true,
                message: 'Blogs fetched successfully',
                ...result
            });
        } catch (error) {
            console.error('Search blogs error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to search blogs'
            });
        }
    }

    async getBlogsByUser(req, res) {
        try {
            const { userId } = req.params;
            const includeDrafts = req.query.includeDrafts === 'true';

            const blogs = await blogService.getBlogsByUser(userId, includeDrafts);

            res.status(200).json({
                success: true,
                message: 'User blogs fetched successfully',
                blogs
            });
        } catch (error) {
            console.error('Get user blogs error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch user blogs'
            });
        }
    }
}

module.exports = new BlogController();