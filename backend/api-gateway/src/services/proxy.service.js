const { createProxyMiddleware } = require('http-proxy-middleware');

const services = {
    identity: process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001',
    post: process.env.POST_SERVICE_URL || 'http://localhost:3002',
    comment: process.env.COMMENT_SERVICE_URL || 'http://localhost:3003',
    notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004',
    userProfile: process.env.USER_PROFILE_SERVICE_URL || 'http://localhost:3005',
    media: process.env.MEDIA_SERVICE_URL || 'http://localhost:3006'
};

class ProxyService {
    createAuthProxy() {
        return createProxyMiddleware({
            target: services.identity,
            changeOrigin: true,
            pathRewrite: { '^/api/auth': '/api' }
        });
    }

    createPostProxy() {
        return createProxyMiddleware({
            target: services.post,
            changeOrigin: true,
            pathRewrite: { '^/api/blogs': '/api' },
            onProxyReq: (proxyReq, req) => {
                // For multipart/form-data, remove content-type header and let it pass through
                if (req.headers['content-type'] &&
                    req.headers['content-type'].includes('multipart/form-data')) {
                    // Don't parse, let it pass through as stream
                }
            }
        });
    }

    createUserProxy() {
        return createProxyMiddleware({
            target: services.userProfile,
            changeOrigin: true,
            pathRewrite: { '^/api/users': '/api' }
        });
    }

    createCommentProxy() {
        return createProxyMiddleware({
            target: services.comment,
            changeOrigin: true,
            pathRewrite: { '^/api/comments': '/api' }
        });
    }

    createNotificationProxy() {
        return createProxyMiddleware({
            target: services.notification,
            changeOrigin: true,
            pathRewrite: { '^/api/notifications': '/api' }
        });
    }

    createMediaProxy() {
        return createProxyMiddleware({
            target: services.media,
            changeOrigin: true,
            pathRewrite: { '^/api/media': '/api' }
        });
    }
}

module.exports = new ProxyService();