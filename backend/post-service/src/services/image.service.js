const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

class ImageService {
    async uploadImage(base64Image) {
        try {
            const result = await cloudinary.uploader.upload(base64Image, {
                folder: "blog-app",
            });
            return result;
        } catch (error) {
            console.error('Image upload error:', error);
            throw new Error('Failed to upload image');
        }
    }

    async deleteImage(imageId) {
        try {
            await cloudinary.uploader.destroy(imageId);
        } catch (error) {
            console.error('Image delete error:', error);
            throw new Error('Failed to delete image');
        }
    }

    async uploadMultipleImages(images) {
        const uploadPromises = images.map(image => this.uploadImage(image));
        return Promise.all(uploadPromises);
    }

    async deleteMultipleImages(imageIds) {
        const deletePromises = imageIds.map(id => this.deleteImage(id));
        return Promise.all(deletePromises);
    }
}

module.exports = new ImageService();