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
    '/health',
    '/api/health'
];

// Dynamic public routes patterns
const PUBLIC_DYNAMIC_ROUTES = [
    { prefix: '/api/users/' } // matches /api/users/:username
];

// Helper function to check if route is public
function isPublicRoute(path) {
    // Exact match
    if (PUBLIC_ROUTES.includes(path)) return true;

    // Dynamic routes
    return PUBLIC_DYNAMIC_ROUTES.some(route => path.startsWith(route.prefix));
}

// Auth middleware
async function verifyToken(req, res, next) {
    // Skip auth for public routes
    if (isPublicRoute(req.path)) return next();

    // Skip for OPTIONS preflight
    if (req.method === 'OPTIONS') return next();

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
        // Implement role check if needed
        next();
    };
}

module.exports = {
    verifyToken,
    requireRole,
    isPublicRoute
};
