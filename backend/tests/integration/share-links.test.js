const { createChain } = require('../mocks/supabase');
const { mockRequireAuth, TEST_AUTH } = require('../mocks/auth');
const { createPasscodeHash, hashToken } = require('../../src/lib/shareLinks');

jest.mock('../../src/middleware/auth', () => ({
    requireAuth: (...args) => mockRequireAuth(...args),
}));

const mockFrom = jest.fn();
jest.mock('../../src/lib/supabase', () => ({
    supabase: {
        from: (...args) => mockFrom(...args),
    },
}));

const request = require('supertest');
const app = require('../../src/app');

const authHeader = { Authorization: 'Bearer test-token' };

const sampleSnapshot = {
    version: 1,
    generatedAt: '2026-06-24T12:00:00.000Z',
    shareType: 'placement_dashboard',
    options: {
        fields: {
            status: true,
            rejectedRound: true,
            dateApplied: true,
        },
        expiry: '7d',
        selectionMode: 'all',
    },
    summary: {
        total: 1,
        statusCounts: { rejected: 1 },
        categoryCounts: { internship: 1 },
        selected: 0,
        rejected: 1,
        ghosted: 0,
        inProgress: 0,
    },
    opportunities: [
        {
            id: '00000000-0000-4000-8000-000000000001',
            title: 'Backend Intern',
            category: 'internship',
            status: 'rejected',
            rejectedRoundNumber: 2,
            currentRoundNumber: 2,
            dateApplied: '2026-06-01T00:00:00.000Z',
        },
    ],
};

function shareRow(overrides = {}) {
    return {
        id: '00000000-0000-4000-8000-000000000099',
        user_id: TEST_AUTH.internalUserId,
        token_hash: hashToken('valid-token_123456789012345678901234'),
        snapshot: sampleSnapshot,
        snapshot_type: 'frozen',
        expires_at: null,
        is_active: true,
        view_count: 3,
        passcode_hash: null,
        passcode_salt: null,
        created_at: '2026-06-24T12:00:00.000Z',
        updated_at: '2026-06-24T12:00:00.000Z',
        ...overrides,
    };
}

describe('Share Links API', () => {
    beforeEach(() => {
        mockFrom.mockReset();
    });

    it('GET /api/share-links returns 401 without auth', async () => {
        const res = await request(app).get('/api/share-links');
        expect(res.status).toBe(401);
    });

    it('POST /api/share-links validates passcode format', async () => {
        const res = await request(app)
            .post('/api/share-links')
            .set(authHeader)
            .send({
                expiry: '7d',
                fields: { status: true },
                passcode: '12',
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Validation Error');
        expect(res.body.details).toEqual(
            expect.arrayContaining([expect.objectContaining({ field: 'passcode' })])
        );
    });

    it('POST /api/share-links creates a redacted frozen share and returns token once', async () => {
        const opportunities = [
            {
                id: '00000000-0000-4000-8000-000000000001',
                title: 'Backend Intern',
                category: 'internship',
                status: 'rejected',
                created_at: '2026-06-01T00:00:00.000Z',
                rejected_round_number: 2,
                current_round_number: 2,
                notes: 'must never leak',
            },
        ];

        mockFrom
            .mockReturnValueOnce(createChain({ data: opportunities, error: null }))
            .mockReturnValueOnce(createChain({ data: shareRow({ view_count: 0 }), error: null }));

        const res = await request(app)
            .post('/api/share-links')
            .set(authHeader)
            .send({
                expiry: '7d',
                fields: {
                    status: true,
                    rejectedRound: true,
                    dateApplied: true,
                },
            });

        expect(res.status).toBe(201);
        expect(res.body.token).toMatch(/^[A-Za-z0-9_-]{32,128}$/);
        expect(res.body.url).toContain(`/share/${res.body.token}`);
        expect(res.body.hasPasscode).toBe(false);
        expect(res.body).not.toHaveProperty('user_id');
        expect(res.body.summary.total).toBe(1);
        expect(mockFrom).toHaveBeenCalledWith('opportunities');
        expect(mockFrom).toHaveBeenCalledWith('share_links');
    });

    it('GET /api/share-links lists owner metadata without raw token or user id', async () => {
        mockFrom.mockReturnValue(createChain({ data: [shareRow()], error: null }));

        const res = await request(app).get('/api/share-links').set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body[0].id).toBe('00000000-0000-4000-8000-000000000099');
        expect(res.body[0].viewCount).toBe(3);
        expect(res.body[0].summary.total).toBe(1);
        expect(res.body[0]).not.toHaveProperty('token');
        expect(res.body[0]).not.toHaveProperty('token_hash');
        expect(res.body[0]).not.toHaveProperty('user_id');
    });

    it('DELETE /api/share-links/:id revokes owner share', async () => {
        mockFrom.mockReturnValue(createChain({
            data: shareRow({ is_active: false }),
            error: null,
        }));

        const res = await request(app)
            .delete('/api/share-links/00000000-0000-4000-8000-000000000099')
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body.isActive).toBe(false);
    });

    it('GET /api/public/share-links/:token returns public snapshot without auth or owner fields', async () => {
        mockFrom
            .mockReturnValueOnce(createChain({ data: shareRow(), error: null }))
            .mockReturnValueOnce(createChain({ data: null, error: null }));

        const res = await request(app).get('/api/public/share-links/valid-token_123456789012345678901234');

        expect(res.status).toBe(200);
        expect(res.body.snapshot.summary.total).toBe(1);
        expect(res.body.viewCount).toBe(4);
        expect(res.body).not.toHaveProperty('user_id');
        expect(res.body).not.toHaveProperty('token_hash');
        expect(JSON.stringify(res.body)).not.toContain('must never leak');
    });

    it('GET /api/public/share-links/:token gracefully rejects expired or revoked links', async () => {
        mockFrom.mockReturnValue(createChain({
            data: shareRow({ is_active: false }),
            error: null,
        }));

        const res = await request(app).get('/api/public/share-links/valid-token_123456789012345678901234');

        expect(res.status).toBe(410);
        expect(res.body.message).toBe('This link has expired or been revoked.');
    });

    it('GET /api/public/share-links/:token gates passcode-protected links', async () => {
        const { passcodeHash, passcodeSalt } = createPasscodeHash('1234');
        mockFrom.mockReturnValue(createChain({
            data: shareRow({ passcode_hash: passcodeHash, passcode_salt: passcodeSalt }),
            error: null,
        }));

        const res = await request(app).get('/api/public/share-links/valid-token_123456789012345678901234');

        expect(res.status).toBe(200);
        expect(res.body.requiresPasscode).toBe(true);
        expect(res.body).not.toHaveProperty('snapshot');
    });

    it('POST /api/public/share-links/:token/verify rejects wrong passcode', async () => {
        const { passcodeHash, passcodeSalt } = createPasscodeHash('1234');
        mockFrom.mockReturnValue(createChain({
            data: shareRow({ passcode_hash: passcodeHash, passcode_salt: passcodeSalt }),
            error: null,
        }));

        const res = await request(app)
            .post('/api/public/share-links/valid-token_123456789012345678901234/verify')
            .send({ passcode: '9999' });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid Passcode');
    });

    it('POST /api/public/share-links/:token/verify returns snapshot on correct passcode', async () => {
        const { passcodeHash, passcodeSalt } = createPasscodeHash('1234');
        mockFrom
            .mockReturnValueOnce(createChain({
                data: shareRow({ passcode_hash: passcodeHash, passcode_salt: passcodeSalt }),
                error: null,
            }))
            .mockReturnValueOnce(createChain({ data: null, error: null }));

        const res = await request(app)
            .post('/api/public/share-links/valid-token_123456789012345678901234/verify')
            .send({ passcode: '1234' });

        expect(res.status).toBe(200);
        expect(res.body.snapshot.opportunities[0].title).toBe('Backend Intern');
        expect(res.body.viewCount).toBe(4);
    });
});
