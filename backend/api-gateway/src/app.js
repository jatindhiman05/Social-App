const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const proxyRoutes = require('./routes/proxy.routes');
const rateLimit = require('./middlewares/rate-limit.middleware');

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined'));
app.use('/api', proxyRoutes);

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', rateLimit.general);

// Health check route
app.get('/health', require('./controllers/health.controller').getHealth);

// API routes

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
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