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

// IMPORTANT: Don't parse multipart/form-data at the gateway level
app.use((req, res, next) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // Skip body parsing for multipart/form-data
        next();
    } else {
        // Parse JSON for other content types
        express.json({ limit: '50mb' })(req, res, next);
        express.urlencoded({ extended: true, limit: '50mb' })(req, res, next);
    }
});

app.use('/api', proxyRoutes);

// Rate limiting
app.use('/api', rateLimit.general);

// Health check route
app.get('/health', require('./controllers/health.controller').getHealth);

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