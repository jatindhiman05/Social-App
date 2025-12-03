const blogService = require('../services/blog.service');

class BlogController {
    async createBlog(req, res) {
        try {
            console.log("=== CREATE BLOG REQUEST ===");
            console.log("Request body fields:", Object.keys(req.body));
            console.log("Request files keys:", Object.keys(req.files || {}));

            // Log all fields
            Object.keys(req.body).forEach(key => {
                console.log(`Field ${key}:`, typeof req.body[key], req.body[key]);
            });

            // Log all files
            Object.keys(req.files || {}).forEach(key => {
                console.log(`File ${key}:`, req.files[key].map(f => ({
                    originalname: f.originalname,
                    mimetype: f.mimetype,
                    size: f.size
                })));
            });

            const creator = req.user?.id;
            if (!creator) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            const { title, description, content, tags, draft } = req.body;

            // Validate required fields
            if (!title || !description || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Title, description, and content are required'
                });
            }

            // Handle files - combine all files into one array
            const allFiles = [];
            if (req.files) {
                Object.values(req.files).forEach(fileArray => {
                    if (Array.isArray(fileArray)) {
                        allFiles.push(...fileArray);
                    }
                });
            }

            console.log("Total files to process:", allFiles.length);

            const result = await blogService.createBlog(creator, {
                title,
                description,
                content,
                tags,
                draft
            }, allFiles);

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

            console.log("Update blog request body:", req.body);
            console.log("Update blog files:", req.files);

            // Parse fields
            let parsedTags = [];
            let parsedContent;
            let parsedExistingImages = [];

            try {
                parsedContent = typeof req.body.content === 'string' ?
                    JSON.parse(req.body.content) : req.body.content;
            } catch (error) {
                console.error('Content parse error:', error);
                return res.status(400).json({
                    success: false,
                    message: 'Invalid content format'
                });
            }

            try {
                parsedTags = typeof req.body.tags === 'string' ?
                    JSON.parse(req.body.tags) : (req.body.tags || []);
            } catch (error) {
                console.error('Tags parse error:', error);
                parsedTags = [];
            }

            try {
                parsedExistingImages = typeof req.body.existingImages === 'string' ?
                    JSON.parse(req.body.existingImages) : (req.body.existingImages || []);
            } catch (error) {
                console.error('Existing images parse error:', error);
                parsedExistingImages = [];
            }

            const updateData = {
                title: req.body.title,
                description: req.body.description,
                content: parsedContent,
                tags: parsedTags,
                draft: req.body.draft === 'true' || req.body.draft === true,
                existingImages: parsedExistingImages
            };

            // Handle files
            const files = req.files || {};
            const images = {
                cover: files.image?.[0] || null,
                embedded: files.images || []
            };

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