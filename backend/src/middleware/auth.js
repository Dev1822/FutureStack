const { verifyToken } = require('@clerk/express');
const { supabase } = require('../lib/supabase');

// In-memory cache for user IDs to avoid database lookups on every request
// Key: clerk_id, Value: { internalUserId, timestamp }
const userCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clerk JWT Authentication Middleware
 * Validates Bearer token and attaches user info to request
 * 
 * Uses jwtKey (PEM public key) for local verification to avoid network dependency.
 * Get this from Clerk Dashboard > Configure > API Keys > Show JWT Public Key
 */
const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or invalid Authorization header'
            });
        }

        const token = authHeader.split(' ')[1];

        // Build verification options
        const verifyOptions = {
            secretKey: process.env.CLERK_SECRET_KEY
        };

        // Use JWT public key for local verification if available (recommended for production)
        // This avoids network calls to Clerk's JWKS endpoint
        if (process.env.CLERK_JWT_PUBLIC_KEY) {
            verifyOptions.jwtKey = process.env.CLERK_JWT_PUBLIC_KEY;
        }

        // Verify the JWT
        const payload = await verifyToken(token, verifyOptions);

        if (!payload) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Invalid token'
            });
        }

        // Attach user info to request
        req.auth = {
            userId: payload.sub,
            sessionId: payload.sid,
            email: payload.email
        };

        // Get or create user (with caching)
        await ensureUserExists(req.auth);

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);

        // Provide more specific error messages based on error type
        let message = 'Token verification failed';
        if (error.message?.includes('expired')) {
            message = 'Token has expired';
        } else if (error.message?.includes('malformed') || error.message?.includes('invalid')) {
            message = 'Malformed or invalid token';
        } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            message = 'Authentication service unavailable';
        }

        return res.status(401).json({
            error: 'Unauthorized',
            message
        });
    }
};

/**
 * Ensure user exists in Supabase (create on first login)
 * Uses caching to avoid database lookups on every request
 */
async function ensureUserExists(auth) {
    const { userId, email } = auth;

    // Check cache first
    const cached = userCache.get(userId);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
        auth.internalUserId = cached.internalUserId;
        return;
    }

    // Try to find existing user first (faster than upsert for existing users)
    const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .maybeSingle();

    if (selectError) throw selectError;

    if (existingUser) {
        // Cache and return
        userCache.set(userId, { internalUserId: existingUser.id, timestamp: Date.now() });
        auth.internalUserId = existingUser.id;
        return;
    }

    // User doesn't exist, create them
    const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ clerk_id: userId, email: email || null })
        .select('id')
        .single();

    if (insertError) {
        // Handle race condition - another request may have created the user
        if (insertError.code === '23505') { // Unique violation
            const { data: raceUser } = await supabase
                .from('users')
                .select('id')
                .eq('clerk_id', userId)
                .single();
            if (raceUser) {
                userCache.set(userId, { internalUserId: raceUser.id, timestamp: Date.now() });
                auth.internalUserId = raceUser.id;
                return;
            }
        }
        throw insertError;
    }

    // Cache and return
    userCache.set(userId, { internalUserId: newUser.id, timestamp: Date.now() });
    auth.internalUserId = newUser.id;
}

module.exports = { requireAuth };

