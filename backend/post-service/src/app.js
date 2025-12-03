const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const blogRoutes = require('./routes/blog.routes');
const rabbitmqService = require('./services/rabbitmq.service');
const parseMultipartFormData = require('./middlewares/multipart.middleware');

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(compression());
app.use(morgan('combined'));

// IMPORTANT: Custom middleware for multipart/form-data
app.use((req, res, next) => {
    if (req.headers['content-type'] &&
        req.headers['content-type'].includes('multipart/form-data')) {
        parseMultipartFormData(req, res, next);
    } else {
        // Parse JSON for other content types
        express.json({ limit: '50mb' })(req, res, next);
        express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    }
});

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('✅ MongoDB connected for Post Service');
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on("connected", () => {
    console.log("📌 Connected to DB:", mongoose.connection.name);
});

// Connect to RabbitMQ
rabbitmqService.connect();

// Routes
app.use('/api', blogRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        service: 'post-service',
        timestamp: new Date().toISOString()
    });
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