const { createChain } = require('../mocks/supabase');
const { mockRequireAuth, TEST_AUTH } = require('../mocks/auth');

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

describe('Interview Prep API', () => {
    beforeEach(() => {
        mockFrom.mockReset();
    });

    it('GET /api/interview-prep/:opportunityId returns 401 without auth', async () => {
        const res = await request(app).get('/api/interview-prep/opp-1');
        expect(res.status).toBe(401);
    });

    it('GET /api/interview-prep/:opportunityId returns 404 for non-internship opportunity', async () => {
        mockFrom.mockReturnValue(
            createChain({ data: { category: 'hackathon' }, error: null })
        );

        const res = await request(app)
            .get('/api/interview-prep/opp-1')
            .set(authHeader);

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('This feature is only available for internships');
    });

    it('GET /api/interview-prep/:opportunityId returns 503 when tables do not exist', async () => {
        // First call: verifyInternshipOwnership should succeed
        mockFrom.mockReturnValueOnce(
            createChain({ data: { category: 'internship' }, error: null })
        );

        // Second call: getPrepForOpportunity should return table-not-exists error
        mockFrom.mockReturnValueOnce(
            createChain({ data: null, error: { code: '42P01', message: 'relation does not exist' } })
        );

        const res = await request(app)
            .get('/api/interview-prep/opp-1')
            .set(authHeader);

        expect(res.status).toBe(503);
        expect(res.body.code).toBe('TABLES_NOT_EXIST');
    });

    it('GET /api/interview-prep/:opportunityId returns empty state when no prep exists', async () => {
        // First call: verifyInternshipOwnership
        mockFrom.mockReturnValueOnce(
            createChain({ data: { category: 'internship' }, error: null })
        );
    
        // Second call: getPrepForOpportunity (no prep found)
        mockFrom.mockReturnValueOnce(
            createChain({ data: null, error: { code: 'PGRST116' } })
        );

        const res = await request(app)
            .get('/api/interview-prep/opp-1')
            .set(authHeader);

        expect(res.status).toBe(200);
        expect(res.body.prep).toBeNull();
        expect(res.body.questions).toEqual([]);
        expect(res.body.topics).toEqual([]);
        expect(res.body.behavioral).toEqual([]);
    });

    it('POST /api/interview-prep/:opportunityId creates prep record', async () => {
        const created = {
            id: 'prep-1',
            opportunity_id: 'opp-1',
            user_id: TEST_AUTH.internalUserId,
            company_research: null,
            reflection_notes: null,
        };

        // First call: verifyInternshipOwnership
        mockFrom.mockReturnValueOnce(
            createChain({ data: { category: 'internship' }, error: null })
        );
    
        // Second call: getPrepForOpportunity (no existing prep)
        mockFrom.mockReturnValueOnce(
            createChain({ data: null, error: { code: 'PGRST116' } })
        );
    
        // Third call: insert new prep
        mockFrom.mockReturnValueOnce(
            createChain({ data: created, error: null })
        );

        const res = await request(app)
            .post('/api/interview-prep/opp-1')
            .set(authHeader)
            .send({});

        expect(res.status).toBe(201);
        expect(res.body.prep.id).toBe('prep-1');
    });

    it('POST /api/interview-prep/:opportunityId returns 400 when prep already exists', async () => {
        const existing = {
            id: 'prep-1',
            opportunity_id: 'opp-1',
            user_id: TEST_AUTH.internalUserId,
        };

        // First call: verifyInternshipOwnership
        mockFrom.mockReturnValueOnce(
            createChain({ data: { category: 'internship' }, error: null })
        );

        // Second call: getPrepForOpportunity (prep already exists)
        mockFrom.mockReturnValueOnce(
            createChain({ data: existing, error: null })
        );

        const res = await request(app)
            .post('/api/interview-prep/opp-1')
            .set(authHeader)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Interview prep already exists for this internship');
    });

    it('POST /api/interview-prep/:opportunityId/questions creates question', async () => {
        const prep = {
            id: 'prep-1',
            opportunity_id: 'opp-1',
            user_id: TEST_AUTH.internalUserId,
        };

        const question = {
            id: 'q-1',
            prep_id: 'prep-1',
            question: 'Tell me about yourself',
            answer: null,
            is_prepared: false,
        };

        mockFrom.mockReturnValue(
            createChain({ data: prep, error: null })
        );

        mockFrom.mockReturnValueOnce(
            createChain({ data: question, error: null })
        );

        const res = await request(app)
            .post('/api/interview-prep/opp-1/questions')
            .set(authHeader)
            .send({ question: 'Tell me about yourself' });

        expect(res.status).toBe(201);
        expect(res.body.question).toBe('Tell me about yourself');
    });

    it('POST /api/interview-prep/:opportunityId/questions returns 404 when prep does not exist', async () => {
        mockFrom.mockReturnValue(
            createChain({ data: null, error: { code: 'PGRST116' } })
        );

        const res = await request(app)
            .post('/api/interview-prep/opp-1/questions')
            .set(authHeader)
            .send({ question: 'Test question' });

        expect(res.status).toBe(404);
        expect(res.body.error).toBe('Interview prep not found. Create prep first.');
    });

    it('POST /api/interview-prep/:opportunityId/topics creates topic', async () => {
        const prep = {
            id: 'prep-1',
            opportunity_id: 'opp-1',
            user_id: TEST_AUTH.internalUserId,
        };

        const topic = {
            id: 't-1',
            prep_id: 'prep-1',
            topic: 'React Hooks',
            priority: 'high',
            is_reviewed: false,
        };

        mockFrom.mockReturnValue(
            createChain({ data: prep, error: null })
        );

        mockFrom.mockReturnValueOnce(
            createChain({ data: topic, error: null })
        );

        const res = await request(app)
            .post('/api/interview-prep/opp-1/topics')
            .set(authHeader)
            .send({ topic: 'React Hooks', priority: 'high' });

        expect(res.status).toBe(201);
        expect(res.body.topic).toBe('React Hooks');
    });

    it('POST /api/interview-prep/:opportunityId/behavioral creates behavioral entry', async () => {
        const prep = {
            id: 'prep-1',
            opportunity_id: 'opp-1',
            user_id: TEST_AUTH.internalUserId,
        };

        const behavioral = {
            id: 'b-1',
            prep_id: 'prep-1',
            question: 'Tell me about a time you led a team',
            situation: 'Project deadline was tight',
            task: 'Lead a team of 5 developers',
            action: 'Organized daily standups and prioritized tasks',
            result: 'Delivered on time with high quality',
        };

        mockFrom.mockReturnValue(
            createChain({ data: prep, error: null })
        );

        mockFrom.mockReturnValueOnce(
            createChain({ data: behavioral, error: null })
        );

        const res = await request(app)
            .post('/api/interview-prep/opp-1/behavioral')
            .set(authHeader)
            .send({
                question: 'Tell me about a time you led a team',
                situation: 'Project deadline was tight',
                task: 'Lead a team of 5 developers',
                action: 'Organized daily standups and prioritized tasks',
                result: 'Delivered on time with high quality',
            });

        expect(res.status).toBe(201);
        expect(res.body.question).toBe('Tell me about a time you led a team');
    });
});
