const Blog = require('../models/Blog.model');
const ShortUniqueId = require('short-unique-id');
const { randomUUID } = new ShortUniqueId({ length: 10 });
const rabbitmqService = require('./rabbitmq.service');
const imageService = require('./image.service');

class BlogService {
    async createBlog(creator, blogData, images) {
        try {
            console.log("=== BLOG SERVICE ===");
            console.log("Blog data received:", {
                title: blogData.title,
                description: blogData.description,
                tags: blogData.tags,
                draft: blogData.draft
            });
            console.log("Number of images received:", images.length);

            const { title, description, content, tags, draft } = blogData;

            // Parse content and tags if they are strings
            let parsedContent;
            try {
                parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
                console.log("Content parsed successfully");
            } catch (error) {
                console.error('Error parsing content:', error);
                throw new Error('Invalid content format');
            }

            let parsedTags = [];
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
                console.log("Tags parsed:", parsedTags);
            } catch (error) {
                console.error('Error parsing tags:', error);
                parsedTags = [];
            }

            // Validate required fields
            if (!title || !description || !parsedContent) {
                throw new Error('Title, description, and content are required');
            }

            // Upload main blog image (first image)
            let secure_url = '';
            let public_id = '';

            if (images && images.length > 0) {
                console.log("Uploading main image...");
                const mainImage = images[0];
                const uploadResult = await imageService.uploadImage(
                    `data:${mainImage.mimetype};base64,${mainImage.buffer.toString("base64")}`
                );
                secure_url = uploadResult.url;
                public_id = uploadResult.publicId;
                console.log("Main image uploaded:", { secure_url, public_id });
            } else {
                console.log("No main image found!");
                throw new Error('Main image is required');
            }

            // Upload embedded images from content
            let imageIndex = 1; // Start from 1 because main image is at index 0
            const contentObj = parsedContent;

            if (contentObj.blocks) {
                console.log("Processing content blocks...");
                for (let i = 0; i < contentObj.blocks.length; i++) {
                    const block = contentObj.blocks[i];
                    if (block.type === "image" && images && images[imageIndex]) {
                        console.log(`Uploading embedded image ${imageIndex}...`);
                        try {
                            const embedImage = images[imageIndex];
                            const { url: embedUrl, publicId: embedId } = await imageService.uploadImage(
                                `data:${embedImage.mimetype};base64,${embedImage.buffer.toString("base64")}`
                            );

                            block.data.file = {
                                url: embedUrl,
                                imageId: embedId,
                            };
                            console.log(`Embedded image uploaded: ${embedUrl}`);
                            imageIndex++;
                        } catch (error) {
                            console.error('Error uploading embedded image:', error);
                            imageIndex++;
                        }
                    }
                }
            }

            const blogId = title.toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                + "-" + randomUUID();

            const blog = await Blog.create({
                title,
                description,
                content: contentObj,
                draft: draft === true || draft === 'true',
                creator,
                image: secure_url,
                imageId: public_id,
                blogId,
                tags: Array.isArray(parsedTags) ? parsedTags : [],
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

    async updateBlog(blogId, userId, updateData, images) {
        try {
            console.log("Updating blog:", blogId);
            console.log("Update data:", updateData);
            console.log("Images:", images);

            const blog = await Blog.findOne({ blogId: blogId });

            if (!blog) {
                throw new Error('Blog not found');
            }

            if (blog.creator !== userId) {
                throw new Error('You are not authorized to update this blog');
            }

            const { title, description, content, tags, draft, existingImages } = updateData;

            // Handle existing images
            let imagesToDelete = [];
            if (existingImages && Array.isArray(existingImages)) {
                imagesToDelete = blog.content.blocks
                    .filter(block => block.type === "image")
                    .filter(block => {
                        const blockUrl = block.data?.file?.url;
                        return blockUrl && !existingImages.find(img => img.url === blockUrl);
                    })
                    .map(block => block.data.file.imageId)
                    .filter(id => id); // Filter out undefined
            }

            // Upload new embedded images
            if (content && content.blocks && images && images.embedded) {
                let embeddedImageIndex = 0;
                const contentObj = content;

                for (let i = 0; i < contentObj.blocks.length; i++) {
                    const block = contentObj.blocks[i];
                    if (block.type === "image") {
                        // Check if this image needs to be replaced with a new upload
                        const hasNewImage = images.embedded[embeddedImageIndex];
                        if (hasNewImage && block.data.file && block.data.file.image) {
                            try {
                                const { secure_url, public_id } = await imageService.uploadImage(
                                    `data:image/jpeg;base64,${images.embedded[embeddedImageIndex].buffer.toString("base64")}`
                                );

                                block.data.file = {
                                    url: secure_url,
                                    imageId: public_id,
                                };
                                embeddedImageIndex++;
                            } catch (error) {
                                console.error('Error uploading new embedded image:', error);
                                embeddedImageIndex++;
                            }
                        }
                    }
                }
                blog.content = contentObj;
            }

            // Update cover image if provided
            if (images && images.cover) {
                try {
                    // Delete old image
                    if (blog.imageId) {
                        await imageService.deleteImage(blog.imageId);
                    }

                    const { secure_url, public_id } = await imageService.uploadImage(
                        `data:image/jpeg;base64,${images.cover.buffer.toString("base64")}`
                    );
                    blog.image = secure_url;
                    blog.imageId = public_id;
                } catch (error) {
                    console.error('Error updating cover image:', error);
                }
            }

            // Delete removed images
            if (imagesToDelete.length > 0) {
                try {
                    await imageService.deleteMultipleImages(imagesToDelete);
                } catch (error) {
                    console.error('Error deleting images:', error);
                }
            }

            // Update other fields
            if (title !== undefined) blog.title = title;
            if (description !== undefined) blog.description = description;
            if (tags !== undefined) blog.tags = Array.isArray(tags) ? tags : [];
            if (draft !== undefined) blog.draft = draft;

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