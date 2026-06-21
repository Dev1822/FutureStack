const {
    createOpportunitySchema,
    updateOpportunitySchema,
} = require('../../src/validation/schemas');
const { createDocumentSchema } = require('../../src/validation/documents-schemas');
const {
    createInterviewPrepSchema,
    createInterviewQuestionSchema,
    updateInterviewQuestionSchema,
    createTechnicalTopicSchema,
    updateTechnicalTopicSchema,
    createBehavioralPrepSchema,
    updateBehavioralPrepSchema,
} = require('../../src/validation/interview-prep-schemas');

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
});

describe('createInterviewPrepSchema', () => {
    it('accepts valid prep payload', () => {
        const { error, value } = createInterviewPrepSchema.validate({
            company_research: 'Company mission is to...',
            reflection_notes: 'Interview went well...',
        });

        expect(error).toBeUndefined();
        expect(value.company_research).toBe('Company mission is to...');
    });

    it('accepts empty payload', () => {
        const { error, value } = createInterviewPrepSchema.validate({});
        expect(error).toBeUndefined();
    });

    it('rejects company_research exceeding max length', () => {
        const { error } = createInterviewPrepSchema.validate({
            company_research: 'a'.repeat(10001),
        });
        expect(error).toBeDefined();
    });
});

describe('createInterviewQuestionSchema', () => {
    it('accepts valid question payload', () => {
        const { error, value } = createInterviewQuestionSchema.validate({
            question: 'Tell me about yourself',
            answer: 'I am a software engineer...',
            is_prepared: true,
        });

        expect(error).toBeUndefined();
        expect(value.question).toBe('Tell me about yourself');
    });

    it('rejects empty question', () => {
        const { error } = createInterviewQuestionSchema.validate({ question: '' });
        expect(error).toBeDefined();
    });

    it('rejects question exceeding max length', () => {
        const { error } = createInterviewQuestionSchema.validate({
            question: 'a'.repeat(501),
        });
        expect(error).toBeDefined();
    });
});

describe('updateInterviewQuestionSchema', () => {
    it('allows partial updates', () => {
        const { error, value } = updateInterviewQuestionSchema.validate({
            is_prepared: true,
        });
        expect(error).toBeUndefined();
        expect(value.is_prepared).toBe(true);
    });

    it('rejects empty payload', () => {
        const { error } = updateInterviewQuestionSchema.validate({});
        expect(error).toBeDefined();
    });
});

describe('createTechnicalTopicSchema', () => {
    it('accepts valid topic payload', () => {
        const { error, value } = createTechnicalTopicSchema.validate({
            topic: 'React Hooks',
            priority: 'high',
            is_reviewed: false,
        });

        expect(error).toBeUndefined();
        expect(value.topic).toBe('React Hooks');
    });

    it('rejects empty topic', () => {
        const { error } = createTechnicalTopicSchema.validate({ topic: '' });
        expect(error).toBeDefined();
    });

    it('rejects invalid priority', () => {
        const { error } = createTechnicalTopicSchema.validate({
            topic: 'React',
            priority: 'urgent',
        });
        expect(error).toBeDefined();
    });
});

describe('updateTechnicalTopicSchema', () => {
    it('allows partial updates', () => {
        const { error, value } = updateTechnicalTopicSchema.validate({
            is_reviewed: true,
        });
        expect(error).toBeUndefined();
        expect(value.is_reviewed).toBe(true);
    });

    it('rejects empty payload', () => {
        const { error } = updateTechnicalTopicSchema.validate({});
        expect(error).toBeDefined();
    });
});

describe('createBehavioralPrepSchema', () => {
    it('accepts valid behavioral payload', () => {
        const { error, value } = createBehavioralPrepSchema.validate({
            question: 'Tell me about a time you led a team',
            situation: 'Project deadline was tight',
            task: 'Lead a team of 5 developers',
            action: 'Organized daily standups',
            result: 'Delivered on time',
        });

        expect(error).toBeUndefined();
        expect(value.question).toBe('Tell me about a time you led a team');
    });

    it('rejects empty question', () => {
        const { error } = createBehavioralPrepSchema.validate({ question: '' });
        expect(error).toBeDefined();
    });

    it('rejects situation exceeding max length', () => {
        const { error } = createBehavioralPrepSchema.validate({
            question: 'Test question',
            situation: 'a'.repeat(2001),
        });
        expect(error).toBeDefined();
    });
});

describe('updateBehavioralPrepSchema', () => {
    it('allows partial updates', () => {
        const { error, value } = updateBehavioralPrepSchema.validate({
            result: 'Project was successful',
        });
        expect(error).toBeUndefined();
        expect(value.result).toBe('Project was successful');
    });

    it('rejects empty payload', () => {
        const { error } = updateBehavioralPrepSchema.validate({});
        expect(error).toBeDefined();
    });
});
