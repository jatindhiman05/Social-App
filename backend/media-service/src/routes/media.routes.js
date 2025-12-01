const express = require('express');
const mediaController = require('../controllers/media.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Public routes (read-only)
router.get('/:imageId/info', mediaController.getImageInfo);
router.get('/:imageId/signed-url', mediaController.generateSignedUrl);
router.get('/:imageId/optimize', mediaController.optimizeImage);

// Protected routes (require authentication)
router.post('/upload', authMiddleware.verifyToken, (req, res) => {
    mediaController.uploadSingleImage(req, res);
});

router.post('/upload-multiple', authMiddleware.verifyToken, mediaController.uploadMultipleImages);
router.post('/upload-base64', authMiddleware.verifyToken, mediaController.uploadFromBase64);
router.post('/upload/profile-picture', authMiddleware.verifyToken, (req, res) => {
    mediaController.uploadProfilePicture(req, res);
});
router.post('/upload/blog-images', authMiddleware.verifyToken, mediaController.uploadBlogImages);

router.delete('/:imageId', authMiddleware.verifyToken, mediaController.deleteImage);
router.delete('/batch/delete', authMiddleware.verifyToken, mediaController.deleteMultipleImages);

module.exports = router;