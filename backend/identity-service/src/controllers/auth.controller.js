const authService = require('../services/auth.service');

class AuthController {
    async signup(req, res) {
        try {
            const { name, password, email } = req.body;

            if (!name || !password || !email) {
                return res.status(400).json({
                    success: false,
                    message: "All fields are required"
                });
            }

            const result = await authService.createUser({ name, password, email });

            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async signin(req, res) {
        try {
            const { password, email } = req.body;

            if (!password || !email) {
                return res.status(400).json({
                    success: false,
                    message: "Email and password are required"
                });
            }

            const result = await authService.login(email, password);

            res.status(200).json({
                success: true,
                message: "Login successful",
                ...result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async googleAuth(req, res) {
        try {
            const { accessToken, name, email } = req.body;

            if (!accessToken || !email) {
                return res.status(400).json({
                    success: false,
                    message: "Access token and email are required"
                });
            }

            const result = await authService.googleAuth(accessToken, name, email);

            res.status(200).json({
                success: true,
                message: "Authentication successful",
                ...result
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async verifyEmail(req, res) {
        try {
            const { verificationToken } = req.params;

            const result = await authService.verifyEmail(verificationToken);

            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async changePassword(req, res) {
        try {
            const userId = req.user?.id;
            const { currentPassword, newPassword } = req.body;

            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }

            const result = await authService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async transferAccount(req, res) {
        try {
            // This would implement your transferAccount logic
            // Using RabbitMQ for async communication
            res.status(200).json({
                success: true,
                message: "Transfer initiated. Check your email."
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

    async confirmTransfer(req, res) {
        try {
            const { action, token } = req.params;

            // This would implement your confirmTransfer logic
            res.status(200).json({
                success: true,
                message: `Transfer ${action}ed successfully`
            });
        } catch (error) {
            res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
}

module.exports = new AuthController();