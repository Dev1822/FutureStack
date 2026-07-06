'use strict';

const SETUP_MESSAGE =
    'AI settings storage is not set up. Run docs/ai-tables-setup.sql in your Supabase SQL Editor, or run: npm run db:migrate:ai (requires SUPABASE_DB_PASSWORD in backend/.env).';

function isMissingTableError(err) {
    const msg = err?.message || String(err);
    return (
        msg.includes('Could not find the table') ||
        msg.includes('schema cache') ||
        err?.code === 'PGRST205' ||
        err?.code === '42P01'
    );
}

function aiSetupErrorResponse() {
    return {
        error: 'Setup Required',
        code: 'AI_TABLES_MISSING',
        message: SETUP_MESSAGE,
    };
}

function mapDbError(err) {
    if (isMissingTableError(err)) {
        return aiSetupErrorResponse();
    }
    if (err?.message?.includes('encryption key')) {
        return {
            error: 'Configuration Error',
            code: 'ENCRYPTION_NOT_CONFIGURED',
            message: 'Server is not configured for API key storage. Set SHARE_LINK_ENCRYPTION_KEY or AI_KEY_ENCRYPTION_KEY in backend/.env.',
        };
    }
    return null;
}

module.exports = {
    SETUP_MESSAGE,
    isMissingTableError,
    aiSetupErrorResponse,
    mapDbError,
};
