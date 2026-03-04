const { verifyToken } = require('@clerk/backend');
const { supabase } = require('../lib/supabase');

// In-memory cache for user IDs to avoid database lookups on every request
// Key: clerk_id, Value: { internalUserId, timestamp }
const userCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Log configuration on startup
const hasJwtKey = !!process.env.CLERK_JWT_KEY;
console.log(`Auth config: networkless verification ${hasJwtKey ? 'ENABLED (CLERK_JWT_KEY set)' : 'DISABLED (no CLERK_JWT_KEY — will fetch JWKS from Clerk API)'}`);

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
        let jwtKey = process.env.CLERK_JWT_KEY;

        // Render sometimes saves newlines as literal '\n' strings which breaks PEM parsing
        if (jwtKey && jwtKey.includes('\\n')) {
            jwtKey = jwtKey.replace(/\\n/g, '\n');
        }

        const verifyOptions = {};

        if (jwtKey) {
            verifyOptions.jwtKey = jwtKey;
            console.log('Auth: Verifying strictly with local PEM key');
        } else {
            verifyOptions.secretKey = process.env.CLERK_SECRET_KEY;
            console.log('Auth: CLERK_JWT_KEY missing or empty. Falling back to secretKey (NETWORK REQUEST REQUIRED)');
        }

        // Verify the JWT
        let payload;
        try {
            console.log(`Auth: Token issuer check -> using options keys: ${Object.keys(verifyOptions)}`);
            payload = await verifyToken(token, verifyOptions);
        } catch (verifyError) {
            // If network verification fails, provide helpful error
            if (verifyError.message?.includes('fetch failed') ||
                verifyError.message?.includes('ECONNREFUSED') ||
                verifyError.message?.includes('ENOTFOUND') ||
                verifyError.message?.includes('fetch is not defined')) {
                console.error('Auth: Network error verifying token — cannot reach Clerk API.', verifyError.message);
                console.error('Auth: PLEASE CHECK YOUR RENDER ENV VARS. CLERK_JWT_KEY is not being applied correctly.');
                return res.status(503).json({
                    error: 'Service Unavailable',
                    message: 'Authentication service temporarily unavailable due to network restrictions. Please try again.'
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

        // Get or create user in Supabase (with caching)
        await ensureUserExists(req.auth);

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);

        let message = 'Token verification failed';
        if (error.message?.includes('expired')) {
            message = 'Token has expired';
        } else if (error.message?.includes('malformed') || error.message?.includes('invalid')) {
            message = 'Malformed or invalid token';
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

    // Try to find existing user
    const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .maybeSingle();

    if (selectError) throw selectError;

    if (existingUser) {
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
        // Handle race condition
        if (insertError.code === '23505') {
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

    userCache.set(userId, { internalUserId: newUser.id, timestamp: Date.now() });
    auth.internalUserId = newUser.id;
}

module.exports = { requireAuth };
