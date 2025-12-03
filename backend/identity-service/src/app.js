const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const authRoutes = require('./routes/auth.routes');
const rabbitmqService = require('./services/rabbitmq.service');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected for Identity Service');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on("connected", () => {
    console.log("📌 Connected to DB:", mongoose.connection.name);
});

// Connect to RabbitMQ
rabbitmqService.connect();

// Routes
app.use('/api', authRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'identity-service',
        timestamp: new Date().toISOString()
    });
});

// Token validation endpoint for API Gateway
app.get('/api/validate-token', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.json({ valid: false });
        }

        const authService = require('./services/auth.service');
        const isValid = await authService.validateToken(token);

        if (isValid) {
            const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
            res.json({
                valid: true,
                user: { id: decoded.id, email: decoded.email }
            });
        } else {
            res.json({ valid: false });
        }
    } catch (error) {
        res.json({ valid: false });
    }
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
});

module.exports = app;