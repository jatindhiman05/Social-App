const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class ImageService {
    async uploadImage(base64Image) {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: "blog-app",
                    resource_type: 'auto'
                },
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

            // Convert base64 to buffer and pipe to upload stream
            const buffer = Buffer.from(base64Image.split(',')[1], 'base64');
            streamifier.createReadStream(buffer).pipe(uploadStream);
        });
    }

    async deleteImage(imageId) {
        try {
            const result = await cloudinary.uploader.destroy(imageId);

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
                this.uploadImage(`data:${image.mimetype};base64,${image.buffer.toString('base64')}`, folder)
            );

            const results = await Promise.all(uploadPromises);
            return results;
        } catch (error) {
            console.error('Cloudinary upload multiple error:', error);
            throw new Error('Failed to upload images');
        }
    }
}

module.exports = new ImageService();