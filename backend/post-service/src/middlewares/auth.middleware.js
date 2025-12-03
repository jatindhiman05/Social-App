const axios = require('axios');

class AuthMiddleware {
    async verifyToken(req, res, next) {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No token provided for protected route');
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const token = authHeader.split(' ')[1];

        try {
            // Verify token with Identity Service
            const response = await axios.get(`${process.env.IDENTITY_SERVICE_URL}/api/validate-token`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.valid) {
                req.user = response.data.user;
                next();
            } else {
                console.log('Invalid token');
                return res.status(401).json({
                    success: false,
                    message: 'Invalid token'
                });
            }
        } catch (error) {
            console.error('Token validation error:', error.message);
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }
    }
}

module.exports = new AuthMiddleware();