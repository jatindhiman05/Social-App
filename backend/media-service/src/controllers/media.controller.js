const cloudinaryService = require('../services/cloudinary.service');
const multer = require('multer');
const streamifier = require('streamifier');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.'));
        }
    }
});

class MediaController {
    constructor() {
        this.uploadSingle = upload.single('image');
        this.uploadMultiple = upload.array('images', 10); // Max 10 images
    }

    uploadSingleImage(req, res, next) {
        this.uploadSingle(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No image provided'
                    });
                }

                // Validate image
                cloudinaryService.validateImage(req.file.buffer);

                // Upload to Cloudinary
                const result = await cloudinaryService.uploadImage(
                    req.file.buffer,
                    req.body.folder || 'blog-app',
                    {
                        transformation: cloudinaryService.getImageTransformation(req.file.mimetype)
                    }
                );

                res.status(200).json({
                    success: true,
                    message: 'Image uploaded successfully',
                    image: result
                });
            } catch (error) {
                console.error('Upload image error:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to upload image'
                });
            }
        });
    }

    async uploadMultipleImages(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No images provided'
                });
            }

            // Validate all images
            for (const file of req.files) {
                cloudinaryService.validateImage(file.buffer);
            }

            // Upload all images
            const results = await cloudinaryService.uploadMultipleImages(
                req.files,
                req.body.folder || 'blog-app'
            );

            res.status(200).json({
                success: true,
                message: 'Images uploaded successfully',
                images: results,
                count: results.length
            });
        } catch (error) {
            console.error('Upload multiple images error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload images'
            });
        }
    }

    async uploadFromBase64(req, res) {
        try {
            const { base64Image, folder } = req.body;

            if (!base64Image) {
                return res.status(400).json({
                    success: false,
                    message: 'Base64 image is required'
                });
            }

            // Validate base64 string
            if (!base64Image.startsWith('data:image/')) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid base64 image format'
                });
            }

            const result = await cloudinaryService.uploadImageFromBase64(
                base64Image,
                folder || 'blog-app'
            );

            res.status(200).json({
                success: true,
                message: 'Image uploaded successfully',
                image: result
            });
        } catch (error) {
            console.error('Upload from base64 error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload image'
            });
        }
    }

    async deleteImage(req, res) {
        try {
            const { imageId } = req.params;

            if (!imageId) {
                return res.status(400).json({
                    success: false,
                    message: 'Image ID is required'
                });
            }

            const result = await cloudinaryService.deleteImage(imageId);

            res.status(200).json(result);
        } catch (error) {
            console.error('Delete image error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete image'
            });
        }
    }

    async deleteMultipleImages(req, res) {
        try {
            const { imageIds } = req.body;

            if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Image IDs array is required'
                });
            }

            const result = await cloudinaryService.deleteMultipleImages(imageIds);

            res.status(200).json(result);
        } catch (error) {
            console.error('Delete multiple images error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to delete images'
            });
        }
    }

    async optimizeImage(req, res) {
        try {
            const { imageId } = req.params;
            const options = req.body.options || {};

            if (!imageId) {
                return res.status(400).json({
                    success: false,
                    message: 'Image ID is required'
                });
            }

            const optimizedUrl = await cloudinaryService.optimizeImage(imageId, options);

            res.status(200).json({
                success: true,
                optimizedUrl
            });
        } catch (error) {
            console.error('Optimize image error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to optimize image'
            });
        }
    }

    async generateSignedUrl(req, res) {
        try {
            const { imageId } = req.params;
            const options = req.body.options || {};

            if (!imageId) {
                return res.status(400).json({
                    success: false,
                    message: 'Image ID is required'
                });
            }

            const signedUrl = await cloudinaryService.generateSignedUrl(imageId, options);

            res.status(200).json({
                success: true,
                signedUrl
            });
        } catch (error) {
            console.error('Generate signed URL error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate signed URL'
            });
        }
    }

    async getImageInfo(req, res) {
        try {
            const { imageId } = req.params;

            if (!imageId) {
                return res.status(400).json({
                    success: false,
                    message: 'Image ID is required'
                });
            }

            // Using Cloudinary Admin API to get image info
            const cloudinary = require('cloudinary').v2;
            const result = await cloudinary.api.resource(imageId);

            res.status(200).json({
                success: true,
                imageInfo: {
                    url: result.secure_url,
                    publicId: result.public_id,
                    format: result.format,
                    width: result.width,
                    height: result.height,
                    bytes: result.bytes,
                    createdAt: result.created_at,
                    tags: result.tags || []
                }
            });
        } catch (error) {
            console.error('Get image info error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to get image info'
            });
        }
    }

    async uploadProfilePicture(req, res) {
        this.uploadSingle(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message
                });
            }

            try {
                if (!req.file) {
                    return res.status(400).json({
                        success: false,
                        message: 'No image provided'
                    });
                }

                const userId = req.user?.id;
                if (!userId) {
                    return res.status(401).json({
                        success: false,
                        message: 'Authentication required'
                    });
                }

                // Upload to Cloudinary with user-specific folder
                const result = await cloudinaryService.uploadImage(
                    req.file.buffer,
                    `blog-app/users/${userId}/profile`,
                    {
                        transformation: {
                            width: 300,
                            height: 300,
                            crop: 'fill',
                            gravity: 'face',
                            quality: 'auto:good',
                            fetch_format: 'auto'
                        }
                    }
                );

                res.status(200).json({
                    success: true,
                    message: 'Profile picture uploaded successfully',
                    image: result
                });
            } catch (error) {
                console.error('Upload profile picture error:', error);
                res.status(500).json({
                    success: false,
                    message: error.message || 'Failed to upload profile picture'
                });
            }
        });
    }

    async uploadBlogImages(req, res) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No images provided'
                });
            }

            const userId = req.user?.id;
            const blogId = req.body.blogId;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

            // Upload images to blog-specific folder
            const results = await cloudinaryService.uploadMultipleImages(
                req.files,
                `blog-app/users/${userId}/blogs/${blogId || 'temp'}`
            );

            res.status(200).json({
                success: true,
                message: 'Blog images uploaded successfully',
                images: results,
                count: results.length
            });
        } catch (error) {
            console.error('Upload blog images error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to upload blog images'
            });
        }
    }
}

module.exports = new MediaController();