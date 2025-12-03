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
            pathRewrite: { '^/api/auth': '/api' },
            selfHandleResponse: true, // <-- important
            onProxyRes: async (proxyRes, req, res) => {
                let body = '';
                proxyRes.on('data', chunk => { body += chunk.toString(); });
                proxyRes.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        res.status(proxyRes.statusCode).json(json); // forward exactly
                    } catch (err) {
                        res.status(500).json({ success: false, message: 'Proxy parse error' });
                    }
                });
            }
        });
    }

    // In your proxy.service.js, update the createPostProxy method:
    createPostProxy() {
        return createProxyMiddleware({
            target: services.post,
            changeOrigin: true,
            // IMPORTANT: Change this line
            pathRewrite: function (path, req) {
                // If the path is exactly '/api/blogs', rewrite to '/api'
                // If it's '/api/blogs/search', rewrite to '/api/search'
                // If it's '/api/blogs/:id', rewrite to '/api/:id'
                if (path === '/api/blogs') {
                    return '/api';
                } else if (path.startsWith('/api/blogs/')) {
                    return '/api' + path.substring('/api/blogs'.length);
                }
                return path;
            },
            onProxyReq: (proxyReq, req) => {
                if (req.headers['content-type'] &&
                    req.headers['content-type'].includes('multipart/form-data')) {
                    // Let multipart pass through
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