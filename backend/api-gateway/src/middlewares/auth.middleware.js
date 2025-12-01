const jwt = require('jsonwebtoken');
const axios = require('axios');

const JWT_SECRET = process.env.JWT_SECRET;
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;

// Public routes that don't need authentication
const PUBLIC_ROUTES = [
    '/api/auth/signup',
    '/api/auth/signin',
    '/api/auth/google-auth',
    '/api/auth/verify-email',
    '/api/blogs',
    '/api/blogs/search',
    '/api/users/[a-zA-Z0-9_]+',
    '/health',
    '/api/health'
];

// Helper function to check if route is public
function isPublicRoute(path) {
    return PUBLIC_ROUTES.some(route => {
        const pattern = route.replace(/\[[^\]]+\]/g, '[^/]+');
        return new RegExp(`^${pattern}$`).test(path);
    });
}

// Auth middleware
async function verifyToken(req, res, next) {
    // Skip auth for public routes
    if (isPublicRoute(req.path)) {
        return next();
    }

    // Skip for OPTIONS preflight
    if (req.method === 'OPTIONS') {
        return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'No token provided'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify token with Identity Service
        const response = await axios.get(`${IDENTITY_SERVICE_URL}/api/validate-token`, {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000
        });

        if (response.data.valid) {
            req.user = response.data.user;
            return next();
        } else {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Token validation error:', error.message);

        // Fallback: Try JWT verification locally
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id,
                email: decoded.email
            };
            console.warn('Using local JWT verification (Identity Service unavailable)');
            return next();
        } catch (jwtError) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
}

// Role-based access control (optional)
function requireRole(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // You can implement role checking here if needed
        // For now, just pass through
        next();
    };
}

module.exports = {
    verifyToken,
    requireRole,
    isPublicRoute
};