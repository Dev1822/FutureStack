require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');

const { requireAuth } = require('./middleware/auth');
const opportunitiesRoutes = require('./routes/opportunities');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================================================
// Trust Proxy Configuration
// =============================================================================

// CRITICAL: Enable trust proxy for correct IP detection behind reverse proxies
// This is essential for rate limiting and IP logging to work correctly when
// deployed behind Nginx, load balancers, or cloud platforms (Heroku, Railway, etc.)
// Without this, all requests appear to come from the proxy's IP address
app.set('trust proxy', 1);

// =============================================================================
// Middleware
// =============================================================================

// Security headers with enhanced configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            // Note: 'unsafe-inline' for styles is required for React's runtime style injection
            // Consider migrating to styled-components or CSS modules with nonces for stronger protection
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    hsts: {
        maxAge: 31536000, // 1 year in seconds
        includeSubDomains: true,
        preload: true
    },
    frameguard: {
        action: 'deny'
    },
    // xssFilter deprecated - removed as it's no longer supported
    // Modern browsers use CSP and built-in protections instead
    noSniff: true,
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    }
}));

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

// Parse JSON bodies BEFORE sanitization (order matters!)
app.use(express.json({ limit: '1mb' }));

// Data sanitization against NoSQL injection attacks
// Note: While we use PostgreSQL (Supabase), this provides defense-in-depth
// and future-proofs the application if MongoDB is added later
app.use(mongoSanitize());

// Rate limiting - Generous limits to prevent abuse while allowing normal usage
// Note: For users from the same network (e.g., hostels), consider implementing
// per-user rate limiting using req.auth.userId in addition to IP-based limiting
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 300, // 300 requests per windowMs per IP
    standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false, // Disable `X-RateLimit-*` headers
    // Skip health check endpoint for monitoring
    skip: (req) => req.path === '/api/health',
    handler: (req, res) => {
        const resetTime = new Date(Date.now() + 15 * 60 * 1000);
        const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

        res.set('Retry-After', retryAfterSeconds.toString());
        res.status(429).json({
            error: 'Rate Limit Exceeded',
            message: 'You have made too many requests. This is to prevent abuse and ensure fair usage for all users.',
            retryAfter: resetTime.toISOString(),
            retryAfterSeconds,
            limit: 300,
            window: '15 minutes'
        });
    }
});

const writeOperationsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 write operations per windowMs per IP (generous for bulk additions)
    standardHeaders: true,
    legacyHeaders: false,
    // Only apply to write operations (POST, PUT, PATCH, DELETE)
    // Skip read operations (GET, HEAD, OPTIONS)
    skip: (req) => !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method),
    handler: (req, res) => {
        const resetTime = new Date(Date.now() + 15 * 60 * 1000);
        const retryAfterSeconds = Math.ceil((resetTime - Date.now()) / 1000);

        res.set('Retry-After', retryAfterSeconds.toString());
        res.status(429).json({
            error: 'Write Rate Limit Exceeded',
            message: 'You have made too many create/update/delete operations. This limit helps prevent abuse while allowing you to add multiple opportunities. Please wait a moment and try again.',
            retryAfter: resetTime.toISOString(),
            retryAfterSeconds,
            limit: 100,
            window: '15 minutes',
            tip: 'If you need to add many opportunities at once, you can still do so within this limit.'
        });
    }
});

// Apply general rate limiter to all API routes (except health check)
app.use('/api/', generalLimiter);

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
        next();
    });
}

// Audit logging middleware for write operations
// Logs request initiation and response outcome for comprehensive audit trail
app.use((req, res, next) => {
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        // Get the true client IP (first IP from X-Forwarded-For when behind proxy)
        const clientIp = req.ips && req.ips.length > 0 ? req.ips[0] : req.ip;

        // Log request initiation
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            type: 'REQUEST',
            method: req.method,
            path: req.path,
            ip: clientIp
        }));

        // Capture the original res.json to log response outcome
        const originalJson = res.json.bind(res);
        res.json = function (body) {
            // Log response outcome
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                type: 'RESPONSE',
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                success: res.statusCode >= 200 && res.statusCode < 300,
                ip: clientIp
            }));
            return originalJson(body);
        };
    }
    next();
});

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

// Protected routes - require authentication and write rate limiting
app.use('/api/opportunities', requireAuth, writeOperationsLimiter, opportunitiesRoutes);
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
