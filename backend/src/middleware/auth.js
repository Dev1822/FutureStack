const { verifyToken } = require('@clerk/express');
const { supabase } = require('../lib/supabase');

/**
 * Clerk JWT Authentication Middleware
 * Validates Bearer token and attaches user info to request
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

        // Verify the JWT using Clerk's secret key
        const payload = await verifyToken(token, {
            secretKey: process.env.CLERK_SECRET_KEY
        });

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

        // Ensure user exists in our database (sync from Clerk on first request)
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
 */
async function ensureUserExists(auth) {
    const { userId, email } = auth;

    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .maybeSingle();

    if (selectError) throw selectError;

    if (existingUser) {
        // Attach internal user ID to auth object
        auth.internalUserId = existingUser.id;
        return;
    }

    // Create new user
    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            clerk_id: userId,
            email: email || null
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating user:', error.message);
        throw error;
    }

    auth.internalUserId = newUser.id;
}

module.exports = { requireAuth };
