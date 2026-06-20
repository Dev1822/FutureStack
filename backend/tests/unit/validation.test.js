const {
    createOpportunitySchema,
    updateOpportunitySchema,
} = require('../../src/validation/schemas');
const { createDocumentSchema, updateDocumentSchema } = require('../../src/validation/documents-schemas');

describe('createOpportunitySchema', () => {
    it('accepts a valid opportunity payload', () => {
        const { error, value } = createOpportunitySchema.validate({
            title: 'Software Engineer Intern',
            link: 'https://example.com/apply',
            category: 'internship',
            status: 'applied',
        });

        expect(error).toBeUndefined();
        expect(value.title).toBe('Software Engineer Intern');
        expect(value.status).toBe('applied');
    });

    it('rejects empty title', () => {
        const { error } = createOpportunitySchema.validate({ title: '' });
        expect(error).toBeDefined();
        expect(error.details[0].path).toContain('title');
    });

    it('rejects invalid link scheme', () => {
        const { error } = createOpportunitySchema.validate({
            title: 'Test Role',
            link: 'ftp://example.com',
        });
        expect(error).toBeDefined();
    });

    it('rejects invalid category', () => {
        const { error } = createOpportunitySchema.validate({
            title: 'Test Role',
            category: 'job',
        });
        expect(error).toBeDefined();
    });
});

describe('updateOpportunitySchema', () => {
    it('allows partial updates', () => {
        const { error, value } = updateOpportunitySchema.validate({ status: 'shortlisted' });
        expect(error).toBeUndefined();
        expect(value.status).toBe('shortlisted');
    });
});

describe('createDocumentSchema', () => {
    it('accepts valid external document metadata', () => {
        const { error, value } = createDocumentSchema.validate({
            name: 'Resume v2',
            type: 'resume',
            file_url: 'https://drive.google.com/file/d/abc',
        });

        expect(error).toBeUndefined();
        expect(value.name).toBe('Resume v2');
    });

    it('rejects missing name', () => {
        const { error } = createDocumentSchema.validate({ type: 'resume' });
        expect(error).toBeDefined();
    });

    it('rejects invalid document type', () => {
        const { error } = createDocumentSchema.validate({
            name: 'Bad doc',
            type: 'invoice',
        });
        expect(error).toBeDefined();
    });

    it('accepts ats fields on update when provided', () => {
        const { error, value } = updateDocumentSchema.validate({
            ats_score: 82,
            ats_analyzed_at: '2026-06-20T12:00:00.000Z',
            ats_analysis: { score: 82, breakdown: { structure: 40, content: 25, atsFriendly: 15 } }
        });
        expect(error).toBeUndefined();
        expect(value.ats_score).toBe(82);
        expect(value.ats_analyzed_at).toBeDefined();
        expect(value.ats_analysis).toBeDefined();
    });
});
