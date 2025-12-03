const Blog = require('../models/Blog.model');
const ShortUniqueId = require('short-unique-id');
const { randomUUID } = new ShortUniqueId({ length: 10 });
const rabbitmqService = require('./rabbitmq.service');
const imageService = require('./image.service');

class BlogService {
    async createBlog(creator, blogData, images) {
        try {
            console.log(blogData);
            const { title, description, content, tags, draft } = blogData;

            if (!title || !description || !content) {
                throw new Error('Title, description, and content are required.');
            }

            // Upload embedded images from content
            let imageIndex = 0;
            const contentObj = JSON.parse(content);

            if (contentObj.blocks) {
                for (let i = 0; i < contentObj.blocks.length; i++) {
                    const block = contentObj.blocks[i];
                    if (block.type === "image" && images && images[imageIndex]) {
                        const { secure_url, public_id } = await imageService.uploadImage(
                            `data:image/jpeg;base64,${images[imageIndex].buffer.toString("base64")}`
                        );

                        block.data.file = {
                            url: secure_url,
                            imageId: public_id,
                        };
                        imageIndex++;
                    }
                }
            }

            // Upload main blog image
            const mainImage = images && images[0];
            if (!mainImage) {
                throw new Error('Main image is required');
            }

            const { secure_url, public_id } = await imageService.uploadImage(
                `data:image/jpeg;base64,${mainImage.buffer.toString("base64")}`
            );

            const blogId = title.toLowerCase().split(" ").join("-") + "-" + randomUUID();

            const blog = await Blog.create({
                title,
                description,
                content: contentObj,
                draft: draft === "false" ? false : true,
                creator,
                image: secure_url,
                imageId: public_id,
                blogId,
                tags: JSON.parse(tags || '[]'),
            });

            // Publish blog created event
            if (!blog.draft) {
                rabbitmqService.publish('notification.events', {
                    type: 'BLOG_CREATED',
                    blogId: blog._id,
                    creatorId: creator,
                    title: blog.title,
                    timestamp: new Date().toISOString()
                });
            }

            // Publish event for user service to update user's blogs
            rabbitmqService.publish('blog.events', {
                type: 'BLOG_CREATED_FOR_USER',
                userId: creator,
                blogId: blog._id
            });

            return {
                blog,
                message: blog.draft
                    ? "Blog saved as draft. You can publish it from your profile."
                    : "Blog created successfully."
            };
        } catch (error) {
            console.error('Blog creation error:', error);
            throw error;
        }
    }

    async getBlogs(page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;

            const blogs = await Blog.find({ draft: false })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const totalBlogs = await Blog.countDocuments({ draft: false });

            return {
                blogs,
                hasMore: skip + limit < totalBlogs,
                total: totalBlogs,
                page,
                limit
            };
        } catch (error) {
            console.error('Get blogs error:', error);
            throw error;
        }
    }

    async getBlog(blogId) {
        try {
            const blog = await Blog.findOne({ blogId }).lean();

            if (!blog) {
                throw new Error('Blog not found');
            }

            // Get user info from user service via RabbitMQ (async)
            rabbitmqService.publish('user.events', {
                type: 'GET_USER_INFO',
                userId: blog.creator,
                blogId: blog._id
            });

            // Get comments from comment service (async)
            rabbitmqService.publish('comment.events', {
                type: 'GET_BLOG_COMMENTS',
                blogId: blog._id
            });

            return blog;
        } catch (error) {
            console.error('Get blog error:', error);
            throw error;
        }
    }

    async updateBlog(blogId, userId, updateData, images) {
        try {
            const blog = await Blog.findOne({ blogId: blogId });

            if (!blog) {
                throw new Error('Blog not found');
            }

            if (blog.creator !== userId) {
                throw new Error('You are not authorized to update this blog');
            }

            const { title, description, content, tags, draft, existingImages } = updateData;

            // Handle existing images (from your code)
            let imagesToDelete = [];
            if (existingImages) {
                const existingImagesArray = JSON.parse(existingImages);
                imagesToDelete = blog.content.blocks
                    .filter(block => block.type === "image")
                    .filter(block => !existingImagesArray.find(({ url }) => url === block.data.file.url))
                    .map(block => block.data.file.imageId);
            }

            // Upload new embedded images
            if (content && images) {
                let imageIndex = 0;
                const contentObj = JSON.parse(content);

                for (let i = 0; i < contentObj.blocks.length; i++) {
                    const block = contentObj.blocks[i];
                    if (block.type === "image" && block.data.file.image) {
                        const uploadResult = await imageService.uploadImage(
                            `data:image/jpeg;base64,${images[imageIndex].buffer.toString("base64")}`
                        );

                        block.data.file = {
                            url: uploadResult.secure_url,
                            imageId: uploadResult.public_id,
                        };
                        imageIndex++;
                    }
                }
                blog.content = contentObj;
            }

            // Update cover image if provided
            if (images && images.cover) {
                await imageService.deleteImage(blog.imageId);
                const uploadResult = await imageService.uploadImage(
                    `data:image/jpeg;base64,${images.cover.buffer.toString("base64")}`
                );
                blog.image = uploadResult.secure_url;
                blog.imageId = uploadResult.public_id;
            }

            // Delete removed images
            if (imagesToDelete.length > 0) {
                await imageService.deleteMultipleImages(imagesToDelete);
            }

            // Update other fields
            if (title) blog.title = title;
            if (description) blog.description = description;
            if (tags) blog.tags = JSON.parse(tags);
            if (draft !== undefined) blog.draft = draft === "false" ? false : true;

            await blog.save();

            // Publish update event
            if (!blog.draft) {
                rabbitmqService.publish('notification.events', {
                    type: 'BLOG_UPDATED',
                    blogId: blog._id,
                    creatorId: userId,
                    title: blog.title,
                    timestamp: new Date().toISOString()
                });
            }

            return blog;
        } catch (error) {
            console.error('Update blog error:', error);
            throw error;
        }
    }

    async deleteBlog(blogId, userId) {
        try {
            const blog = await Blog.findOne({ blogId: blogId });

            if (!blog) {
                throw new Error('Blog not found');
            }

            if (blog.creator !== userId) {
                throw new Error('Unauthorized to delete this blog');
            }

            // Delete images from cloudinary
            await imageService.deleteImage(blog.imageId);

            if (blog.content?.blocks) {
                const imageIds = blog.content.blocks
                    .filter(block => block.type === "image" && block.data?.file?.imageId)
                    .map(block => block.data.file.imageId);

                if (imageIds.length > 0) {
                    await imageService.deleteMultipleImages(imageIds);
                }
            }

            // Delete blog
            await Blog.deleteOne({ _id: blog._id });

            // Publish delete events
            rabbitmqService.publish('blog.events', {
                type: 'BLOG_DELETED',
                userId,
                blogId: blog._id
            });

            rabbitmqService.publish('comment.events', {
                type: 'BLOG_DELETED',
                blogId: blog._id
            });

            return {
                success: true,
                message: 'Blog and all associated images deleted'
            };
        } catch (error) {
            console.error('Delete blog error:', error);
            throw error;
        }
    }

    async likeBlog(blogId, userId) {
        try {
            const blog = await Blog.findById(blogId);

            if (!blog) {
                throw new Error('Blog not found');
            }

            const alreadyLiked = blog.likes.includes(userId);

            if (!alreadyLiked) {
                blog.likes.push(userId);
                await blog.save();

                // Publish like notification if not liking own blog
                if (blog.creator !== userId) {
                    rabbitmqService.publish('notification.events', {
                        type: 'BLOG_LIKED',
                        blogId: blog._id,
                        blogTitle: blog.title,
                        likerId: userId,
                        creatorId: blog.creator,
                        timestamp: new Date().toISOString()
                    });
                }

                // Publish event for user service
                rabbitmqService.publish('user.events', {
                    type: 'BLOG_LIKED',
                    userId,
                    blogId: blog._id
                });

                return { liked: true, likesCount: blog.likes.length };
            } else {
                blog.likes = blog.likes.filter(id => id !== userId);
                await blog.save();

                // Publish event for user service
                rabbitmqService.publish('user.events', {
                    type: 'BLOG_UNLIKED',
                    userId,
                    blogId: blog._id
                });

                return { liked: false, likesCount: blog.likes.length };
            }
        } catch (error) {
            console.error('Like blog error:', error);
            throw error;
        }
    }

    async saveBlog(blogId, userId) {
        try {
            const blog = await Blog.findById(blogId);

            if (!blog) {
                throw new Error('Blog not found');
            }

            const alreadySaved = blog.totalSaves.includes(userId);

            if (!alreadySaved) {
                blog.totalSaves.push(userId);
                await blog.save();

                // Publish event for user service
                rabbitmqService.publish('user.events', {
                    type: 'BLOG_SAVED',
                    userId,
                    blogId: blog._id
                });

                return { saved: true, savesCount: blog.totalSaves.length };
            } else {
                blog.totalSaves = blog.totalSaves.filter(id => id !== userId);
                await blog.save();

                // Publish event for user service
                rabbitmqService.publish('user.events', {
                    type: 'BLOG_UNSAVED',
                    userId,
                    blogId: blog._id
                });

                return { saved: false, savesCount: blog.totalSaves.length };
            }
        } catch (error) {
            console.error('Save blog error:', error);
            throw error;
        }
    }

    async searchBlogs(search, tag, page = 1, limit = 10) {
        try {
            const skip = (page - 1) * limit;
            let query = { draft: false };

            if (tag) {
                query.tags = tag;
            } else if (search) {
                query.$or = [
                    { title: { $regex: search, $options: "i" } },
                    { description: { $regex: search, $options: "i" } },
                ];
            }

            const blogs = await Blog.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean();

            const totalBlogs = await Blog.countDocuments(query);

            if (blogs.length === 0) {
                throw new Error('No blogs found with the given criteria');
            }

            return {
                blogs,
                hasMore: skip + limit < totalBlogs,
                total: totalBlogs,
                page,
                limit
            };
        } catch (error) {
            console.error('Search blogs error:', error);
            throw error;
        }
    }

    // Get blogs by user (for user profile)
    async getBlogsByUser(userId, includeDrafts = false) {
        try {
            const query = { creator: userId };
            if (!includeDrafts) {
                query.draft = false;
            }

            return await Blog.find(query)
                .sort({ createdAt: -1 })
                .lean();
        } catch (error) {
            console.error('Get blogs by user error:', error);
            throw error;
        }
    }
}

module.exports = new BlogService();