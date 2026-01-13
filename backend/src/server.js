require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { requireAuth } = require('./middleware/auth');
const opportunitiesRoutes = require('./routes/opportunities');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// Middleware
// =============================================================================

// Security headers
app.use(helmet());

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN
        ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
        : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Parse JSON bodies with size limit to prevent DoS
app.use(express.json({ limit: '1mb' }));

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// =============================================================================
// Routes
// =============================================================================

// Health check (public)
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Protected routes - require authentication
app.use('/api/opportunities', requireAuth, opportunitiesRoutes);
app.use('/api/analytics', requireAuth, analyticsRoutes);

// User info endpoint
app.get('/api/me', requireAuth, (req, res) => {
    res.json({
        userId: req.auth.userId,
        internalUserId: req.auth.internalUserId,
        email: req.auth.email
    });
});

// =============================================================================
// Error Handling
// =============================================================================

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found', message: `Route ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// =============================================================================
// Start Server
// =============================================================================

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   FutureTracker API                        ║
╠═══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                   ║
║  Environment: ${(process.env.NODE_ENV || 'development').padEnd(42)}║
║  CORS Origin: ${(process.env.CORS_ORIGIN || 'http://localhost:3000').substring(0, 42).padEnd(42)}║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
