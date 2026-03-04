const { createClerkClient } = require('@clerk/express');
const { supabase } = require('../lib/supabase');

// Initialize Clerk client with secret key
const clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
});

// In-memory cache for user IDs to avoid database lookups on every request
// Key: clerk_id, Value: { internalUserId, timestamp }
const userCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Clerk JWT Authentication Middleware
 * Validates Bearer token and attaches user info to request.
 * 
 * Supports two verification modes:
 * 1. Network mode (default): Uses CLERK_SECRET_KEY to fetch JWKS from Clerk's API
 * 2. Networkless mode: Uses CLERK_JWT_KEY (PEM public key) for local verification
 *    - Get this from Clerk Dashboard > API Keys > Advanced > JWT Public Key
 *    - This avoids outbound HTTP requests and is more reliable on some hosting platforms
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
            secretKey: process.env.CLERK_SECRET_KEY,
        };

        // Use jwtKey for networkless verification if available
        // This avoids the "TypeError: fetch failed" issue on some hosting platforms
        if (process.env.CLERK_JWT_KEY) {
            verifyOptions.jwtKey = process.env.CLERK_JWT_KEY;
        }

        // Verify the JWT using Clerk client
        let payload;
        try {
            payload = await clerkClient.verifyToken(token, verifyOptions);
        } catch (verifyError) {
            // If network verification fails and we don't have jwtKey, provide helpful error
            if (verifyError.message?.includes('fetch failed') || verifyError.message?.includes('ECONNREFUSED') || verifyError.message?.includes('ENOTFOUND')) {
                console.error('Auth: Network error verifying token - cannot reach Clerk API.', verifyError.message);
                console.error('Auth: Consider setting CLERK_JWT_KEY env var for networkless verification.');
                console.error('Auth: Get the PEM key from Clerk Dashboard > API Keys > Advanced > JWT Public Key');
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Authentication service temporarily unavailable. Please try again in a moment.'
                });
            }
            throw verifyError; // Re-throw other errors (expired, malformed, etc.)
        }

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
