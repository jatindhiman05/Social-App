const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class CloudinaryService {
    async uploadImage(buffer, folder = 'blog-app', options = {}) {
        return new Promise((resolve, reject) => {
            const uploadOptions = {
                folder,
                resource_type: 'auto',
                ...options
            };

            const uploadStream = cloudinary.uploader.upload_stream(
                uploadOptions,
                (error, result) => {
                    if (error) {
                        console.error('Cloudinary upload error:', error);
                        reject(new Error('Failed to upload image'));
                    } else {
                        resolve({
                            url: result.secure_url,
                            publicId: result.public_id,
                            format: result.format,
                            width: result.width,
                            height: result.height,
                            bytes: result.bytes
                        });
                    }
                }
            );

            streamifier.createReadStream(buffer).pipe(uploadStream);
        });
    }

    async uploadImageFromBase64(base64String, folder = 'blog-app', options = {}) {
        try {
            const uploadOptions = {
                folder,
                resource_type: 'auto',
                ...options
            };

            const result = await cloudinary.uploader.upload(base64String, uploadOptions);

            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
                bytes: result.bytes
            };
        } catch (error) {
            console.error('Cloudinary upload from base64 error:', error);
            throw new Error('Failed to upload image');
        }
    }

    async deleteImage(publicId) {
        try {
            const result = await cloudinary.uploader.destroy(publicId);

            if (result.result === 'ok') {
                return { success: true, message: 'Image deleted successfully' };
            } else {
                throw new Error('Failed to delete image');
            }
        } catch (error) {
            console.error('Cloudinary delete error:', error);
            throw new Error('Failed to delete image');
        }
    }

    async deleteMultipleImages(publicIds) {
        try {
            const deletePromises = publicIds.map(publicId =>
                cloudinary.uploader.destroy(publicId).catch(err => {
                    console.error(`Failed to delete image ${publicId}:`, err);
                    return null;
                })
            );

            const results = await Promise.all(deletePromises);

            const successful = results.filter(result => result && result.result === 'ok').length;
            const failed = results.length - successful;

            return {
                success: true,
                message: `Deleted ${successful} images, ${failed} failed`,
                deletedCount: successful,
                failedCount: failed
            };
        } catch (error) {
            console.error('Cloudinary delete multiple error:', error);
            throw new Error('Failed to delete images');
        }
    }

    async uploadMultipleImages(images, folder = 'blog-app') {
        try {
            const uploadPromises = images.map(image =>
                this.uploadImage(image.buffer, folder, {
                    transformation: this.getImageTransformation(image.mimetype)
                })
            );

            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            console.error('Cloudinary upload multiple error:', error);
            throw new Error('Failed to upload images');
        }
    }

    async optimizeImage(publicId, options = {}) {
        try {
            const optimizationOptions = {
                quality: 'auto:good',
                fetch_format: 'auto',
                ...options
            };

            const url = cloudinary.url(publicId, optimizationOptions);
            return url;
        } catch (error) {
            console.error('Cloudinary optimize error:', error);
            throw new Error('Failed to optimize image');
        }
    }

    getImageTransformation(mimeType) {
        const transformations = {
            quality: 'auto:good',
            fetch_format: 'auto'
        };

        // Add specific transformations based on image type
        if (mimeType === 'image/webp') {
            transformations.format = 'webp';
        } else if (mimeType === 'image/png') {
            transformations.format = 'png';
        } else if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
            transformations.format = 'jpg';
            transformations.quality = 80;
        }

        return transformations;
    }

    validateImage(buffer, options = {}) {
        const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] } = options;

        // Check size
        if (buffer.length > maxSize) {
            throw new Error(`Image size too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
        }

        // For actual file type validation, you'd need the file object with mimetype
        // This is a simplified version
        return true;
    }

    async generateSignedUrl(publicId, options = {}) {
        try {
            const url = cloudinary.url(publicId, {
                secure: true,
                sign_url: true,
                ...options
            });
            return url;
        } catch (error) {
            console.error('Cloudinary signed URL error:', error);
            throw new Error('Failed to generate signed URL');
        }
    }
}

module.exports = new CloudinaryService();