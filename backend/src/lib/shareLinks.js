const crypto = require('crypto');

const TOKEN_BYTES = 32;
const PASSCODE_SALT_BYTES = 16;
const PASSCODE_ITERATIONS = 120000;
const PASSCODE_KEY_LENGTH = 32;
const TOKEN_HASH_ALGORITHM = 'sha256';
const PASSCODE_DIGEST = 'sha256';

const SHARE_FIELD_DEFAULTS = {
    status: true,
    rejectedRound: true,
    dateApplied: true,
};

function generateShareToken() {
    return crypto.randomBytes(TOKEN_BYTES).toString('base64url');
}

function hashToken(token) {
    return crypto.createHash(TOKEN_HASH_ALGORITHM).update(token).digest('hex');
}

function createPasscodeHash(passcode) {
    if (!passcode) {
        return { passcodeHash: null, passcodeSalt: null };
    }

    const passcodeSalt = crypto.randomBytes(PASSCODE_SALT_BYTES).toString('hex');
    const passcodeHash = crypto
        .pbkdf2Sync(passcode, passcodeSalt, PASSCODE_ITERATIONS, PASSCODE_KEY_LENGTH, PASSCODE_DIGEST)
        .toString('hex');

    return { passcodeHash, passcodeSalt };
}

function verifyPasscode(passcode, passcodeHash, passcodeSalt) {
    if (!passcodeHash || !passcodeSalt) {
        return true;
    }

    const candidate = crypto
        .pbkdf2Sync(passcode || '', passcodeSalt, PASSCODE_ITERATIONS, PASSCODE_KEY_LENGTH, PASSCODE_DIGEST)
        .toString('hex');

    return crypto.timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(passcodeHash, 'hex'));
}

function resolveExpiresAt(expiry) {
    if (expiry === '24h') {
        return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    }

    if (expiry === '7d') {
        return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    return null;
}

function isShareExpired(share) {
    return Boolean(share?.expires_at && new Date(share.expires_at).getTime() <= Date.now());
}

function isShareUnavailable(share) {
    return !share || share.is_active === false || isShareExpired(share);
}

function normalizeFieldOptions(fields = {}) {
    return {
        status: fields.status !== false,
        rejectedRound: fields.rejectedRound !== false,
        dateApplied: fields.dateApplied !== false,
    };
}

function toPublicOpportunity(opportunity, fields) {
    const item = {
        id: opportunity.id,
        title: opportunity.title,
        category: opportunity.category,
    };

    if (fields.status) {
        item.status = opportunity.status || 'applied';
    }

    if (fields.rejectedRound) {
        item.rejectedRoundNumber = opportunity.rejected_round_number || null;
        item.currentRoundNumber = opportunity.current_round_number || null;
    }

    if (fields.dateApplied) {
        item.dateApplied = opportunity.created_at || null;
    }

    return item;
}

function buildShareSnapshot({ opportunities, fields, expiry, selectedOpportunityIds }) {
    const normalizedFields = normalizeFieldOptions(fields);
    const publicOpportunities = opportunities.map((opportunity) =>
        toPublicOpportunity(opportunity, normalizedFields)
    );

    const statusCounts = publicOpportunities.reduce((counts, opportunity) => {
        const status = opportunity.status || 'hidden';
        counts[status] = (counts[status] || 0) + 1;
        return counts;
    }, {});

    const categoryCounts = publicOpportunities.reduce((counts, opportunity) => {
        const category = opportunity.category || 'uncategorized';
        counts[category] = (counts[category] || 0) + 1;
        return counts;
    }, {});

    return {
        version: 1,
        generatedAt: new Date().toISOString(),
        shareType: 'placement_dashboard',
        options: {
            fields: normalizedFields,
            expiry,
            selectionMode: selectedOpportunityIds?.length ? 'specific' : 'all',
        },
        summary: {
            total: publicOpportunities.length,
            statusCounts,
            categoryCounts,
            selected: statusCounts.selected || 0,
            rejected: statusCounts.rejected || 0,
            ghosted: statusCounts.ghosted || 0,
            inProgress:
                (statusCounts.applied || 0) +
                (statusCounts.interviewed || 0) +
                (statusCounts.shortlisted || 0),
        },
        opportunities: publicOpportunities,
    };
}

function sanitizeShareForOwner(share) {
    const snapshot = share.snapshot || {};
    return {
        id: share.id,
        snapshotType: share.snapshot_type,
        expiresAt: share.expires_at,
        isActive: share.is_active,
        viewCount: share.view_count || 0,
        createdAt: share.created_at,
        updatedAt: share.updated_at,
        hasPasscode: Boolean(share.passcode_hash),
        summary: snapshot.summary || { total: 0 },
        options: snapshot.options || {},
    };
}

function sanitizeShareForPublic(share) {
    return {
        id: share.id,
        snapshotType: share.snapshot_type,
        expiresAt: share.expires_at,
        viewCount: share.view_count || 0,
        createdAt: share.created_at,
        snapshot: share.snapshot,
        hasPasscode: Boolean(share.passcode_hash),
    };
}

function getPublicAppUrl() {
    const configuredUrl =
        process.env.PUBLIC_APP_URL ||
        process.env.FRONTEND_URL ||
        process.env.CLIENT_URL ||
        process.env.CORS_ORIGIN;

    if (configuredUrl) {
        return configuredUrl.split(',')[0].trim().replace(/\/$/, '');
    }

    return 'http://localhost:3000';
}

module.exports = {
    SHARE_FIELD_DEFAULTS,
    buildShareSnapshot,
    createPasscodeHash,
    generateShareToken,
    getPublicAppUrl,
    hashToken,
    isShareUnavailable,
    resolveExpiresAt,
    sanitizeShareForOwner,
    sanitizeShareForPublic,
    verifyPasscode,
};
