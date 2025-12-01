const User = require('../models/User.model');
const jwt = require('jsonwebtoken');
const ShortUniqueId = require('short-unique-id');
const { randomUUID } = new ShortUniqueId({ length: 5 });
const rabbitmqService = require('./rabbitmq.service');
const emailService = require('./email.service');

class AuthService {
    async createUser(userData) {
        try {
            const { name, password, email } = userData;

            // Check for existing user
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                if (existingUser.googleAuth) {
                    throw new Error('This email is registered with Google');
                }
                if (existingUser.isVerify) {
                    throw new Error('User already registered');
                }
            }

            // Create username
            const username = email.split("@")[0] + "-" + randomUUID();

            let user;
            if (existingUser && !existingUser.isVerify) {
                // Update existing unverified user
                existingUser.name = name;
                existingUser.password = password;
                existingUser.username = username;
                user = await existingUser.save();
            } else {
                // Create new user
                user = await User.create({
                    name,
                    email,
                    password,
                    username,
                });
            }

            // Generate verification token
            const verificationToken = jwt.sign(
                { email: user.email, id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            // Send verification email via RabbitMQ
            rabbitmqService.publish('email.events', {
                type: 'VERIFICATION_EMAIL',
                to: user.email,
                subject: 'Email Verification',
                template: 'verification',
                data: {
                    name: user.name,
                    verificationToken,
                    frontendUrl: process.env.FRONTEND_URL
                }
            });

            return {
                success: true,
                message: "Email verification sent",
                userId: user._id
            };
        } catch (error) {
            throw error;
        }
    }

    async login(email, password) {
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            throw new Error('User not found');
        }

        if (user.googleAuth) {
            throw new Error('Please use Google login');
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Invalid credentials');
        }

        if (!user.isVerify) {
            // Resend verification email
            const verificationToken = jwt.sign(
                { email: user.email, id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '1d' }
            );

            rabbitmqService.publish('email.events', {
                type: 'VERIFICATION_EMAIL',
                to: user.email,
                subject: 'Email Verification',
                template: 'verification',
                data: {
                    name: user.name,
                    verificationToken,
                    frontendUrl: process.env.FRONTEND_URL
                }
            });

            throw new Error('Please verify your email');
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Publish user logged in event
        rabbitmqService.publish('user.events', {
            type: 'USER_LOGGED_IN',
            userId: user._id,
            email: user.email
        });

        return {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                googleAuth: user.googleAuth
            }
        };
    }

    async googleAuth(accessToken, name, email) {
        let user = await User.findOne({ email });

        if (user) {
            if (user.googleAuth) {
                const token = jwt.sign(
                    { id: user._id, email: user.email },
                    process.env.JWT_SECRET,
                    { expiresIn: '7d' }
                );

                return {
                    token,
                    user: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        username: user.username,
                        googleAuth: user.googleAuth
                    }
                };
            } else {
                throw new Error('Email already registered without Google');
            }
        }

        // Create new user
        const username = email.split("@")[0] + "-" + randomUUID();
        user = await User.create({
            name,
            email,
            googleAuth: true,
            isVerify: true,
            username
        });

        const token = jwt.sign(
            { id: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Publish user created event for profile service
        rabbitmqService.publish('user.events', {
            type: 'USER_CREATED',
            userId: user._id,
            email: user.email,
            name: user.name,
            username: user.username,
            googleAuth: true
        });

        return {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                googleAuth: user.googleAuth
            }
        };
    }

    async verifyEmail(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const { id } = decoded;

            const user = await User.findByIdAndUpdate(
                id,
                { isVerify: true, verificationToken: null, verificationTokenExpiry: null },
                { new: true }
            );

            if (!user) {
                throw new Error('User not found');
            }

            // Publish user verified event
            rabbitmqService.publish('user.events', {
                type: 'USER_VERIFIED',
                userId: user._id,
                email: user.email
            });

            return {
                success: true,
                message: 'Email verified successfully'
            };
        } catch (error) {
            throw new Error('Invalid or expired token');
        }
    }

    async validateToken(token) {
        try {
            jwt.verify(token, process.env.JWT_SECRET);
            return true;
        } catch (error) {
            return false;
        }
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await User.findById(userId).select('+password');

        if (!user) {
            throw new Error('User not found');
        }

        if (!user.googleAuth) {
            const isPasswordValid = await user.comparePassword(currentPassword);
            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }
        }

        user.password = newPassword;
        await user.save();

        // Publish password changed event
        rabbitmqService.publish('user.events', {
            type: 'PASSWORD_CHANGED',
            userId: user._id,
            email: user.email
        });

        return {
            success: true,
            message: 'Password changed successfully'
        };
    }

    async initiateAccountTransfer(currentUserId, currentPassword, googleAuth, newOwnerEmail) {
        // This is from your transferAccount function
        // Implementation would be similar to your monolith code
        // Publish events for email notifications
    }

    async confirmAccountTransfer(action, token) {
        // This is from your confirmTransfer function
        // Implementation would be similar to your monolith code
    }
}

module.exports = new AuthService();