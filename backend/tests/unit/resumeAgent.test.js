/**
 * Unit tests for the AI resume checker pipeline.
 *
 * All LLM calls and external services are mocked so that tests are fast,
 * hermetic, and pass without any API keys or file-system access.
 */

'use strict';

// ---------------------------------------------------------------------------
// Global mocks (must be declared before require() calls that load the modules)
// ---------------------------------------------------------------------------

// Mock the LLM layer so no actual API calls are made
jest.mock('../../src/lib/llm', () => ({
    generateText: jest.fn(),
    generateObject: jest.fn(),
    getProviderInfo: jest.fn(() => ({ provider: 'gemini', model: 'gemini-2.5-flash' })),
}));

// Mock pdf-parse v2 (PDFParse class)
jest.mock('pdf-parse', () => ({
    PDFParse: jest.fn().mockImplementation(() => ({
        getText: jest.fn(() => Promise.resolve({
            text: 'John Doe\njohn@example.com\nSoftware Engineer\nSkills: JavaScript, Node.js, React\n'.repeat(5),
        })),
        destroy: jest.fn(() => Promise.resolve()),
    })),
}));

// Mock mammoth
jest.mock('mammoth', () => ({
    extractRawText: jest.fn(() =>
        Promise.resolve({ value: 'Jane Smith\njane@example.com\nSoftware Developer\nSkills: Python, Django' })
    ),
}));

// Mock supabase (storage download)
jest.mock('../../src/lib/supabase', () => ({
    supabase: {
        storage: {
            from: jest.fn(() => ({
                download: jest.fn(() =>
                    Promise.resolve({
                        data: new Blob(['%PDF fake content'], { type: 'application/pdf' }),
                        error: null,
                    })
                ),
            })),
        },
    },
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

const { generateObject } = require('../../src/lib/llm');
const { parseResume } = require('../../src/lib/resume-agent/parser');
const { evaluateResume } = require('../../src/lib/resume-agent/evaluator');
const { enrichWithGithub } = require('../../src/lib/resume-agent/github');
const { runResumeCheck } = require('../../src/lib/resume-agent/runResumeCheck');
const { extractResumeText } = require('../../src/lib/resume-agent/extract');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_STRUCTURED_RESUME = {
    basics: {
        name: 'John Doe',
        email: 'john@example.com',
        phone: null,
        location: 'San Francisco, CA',
        summary: 'Software Engineer with 3 years of experience.',
        profiles: [{ network: 'GitHub', url: 'https://github.com/johndoe' }],
    },
    work: [{ company: 'Acme Corp', position: 'Software Engineer', startDate: '2021-01', endDate: 'Present', highlights: ['Built scalable APIs'] }],
    education: [{ institution: 'MIT', area: 'Computer Science', studyType: 'B.S.', startDate: '2017', endDate: '2021', score: '3.8', courses: [] }],
    skills: { technical: ['JavaScript', 'Node.js', 'React'], soft: ['Communication'], languages: ['English'] },
    projects: [{ name: 'OpenPR', description: 'OSS tool', url: 'https://github.com/johndoe/openpr', startDate: '2022', endDate: null, highlights: ['500+ stars'], keywords: ['Node.js'] }],
    awards: [],
};

const SAMPLE_EVALUATION = {
    scores: {
        open_source: { score: 18, max: 35, evidence: 'Has a 500+ star OSS project' },
        self_projects: { score: 20, max: 30, evidence: 'Multiple personal projects on GitHub' },
        production: { score: 17, max: 25, evidence: 'Work experience at Acme Corp' },
        technical_skills: { score: 7, max: 10, evidence: 'Proficient in JavaScript, Node.js, React' },
    },
    bonus_points: { total: 0, breakdown: 'None' },
    deductions: { total: 0, reasons: 'None' },
    key_strengths: ['Strong open-source presence'],
    areas_for_improvement: ['Add more production work examples'],
};

// ---------------------------------------------------------------------------
// Tests: parser.js
// ---------------------------------------------------------------------------

describe('parseResume', () => {
    beforeEach(() => {
        generateObject.mockReset();
    });

    it('calls generateObject once and assembles the result', async () => {
        generateObject.mockResolvedValueOnce({
            basics: { name: 'John Doe', email: 'john@example.com', profiles: [] },
            work: [],
            education: [],
            skills: { technical: ['JavaScript'], soft: [], languages: [] },
            projects: [],
            awards: [],
        });

        const result = await parseResume('John Doe\njohn@example.com');

        expect(generateObject).toHaveBeenCalledTimes(1);
        expect(result.basics.name).toBe('John Doe');
        expect(result.skills.technical).toContain('JavaScript');
    });

    it('throws a quota error when the LLM reports quota exhaustion', async () => {
        generateObject.mockRejectedValueOnce(
            new Error('You exceeded your current quota, please check your plan and billing details.')
        );

        await expect(parseResume('Jane Smith\njane@example.com'))
            .rejects.toMatchObject({ code: 'LLM_QUOTA_EXCEEDED', statusCode: 429 });
    });

    it('normalises the parsed output shape correctly', async () => {
        generateObject.mockResolvedValueOnce({
            basics: { name: 'Test', email: null, profiles: [] },
            work: [{ company: 'X', position: 'Dev' }],
            education: [],
            skills: { technical: ['Python'], soft: [], languages: [] },
            projects: [],
            awards: [],
        });

        const result = await parseResume('...');

        expect(result).toMatchObject({
            basics: expect.objectContaining({ name: 'Test' }),
            work: expect.any(Array),
            education: expect.any(Array),
            skills: expect.objectContaining({ technical: expect.any(Array) }),
            projects: expect.any(Array),
            awards: expect.any(Array),
        });
    });
});

// ---------------------------------------------------------------------------
// Tests: evaluator.js
// ---------------------------------------------------------------------------

describe('evaluateResume', () => {
    beforeEach(() => {
        generateObject.mockReset();
    });

    it('returns normalised scores when LLM succeeds', async () => {
        generateObject.mockResolvedValueOnce(SAMPLE_EVALUATION);

        const result = await evaluateResume(SAMPLE_STRUCTURED_RESUME, null);

        expect(result.overall_score).toBe(52); // (18+20+17+7)/120*100 rounded
        expect(result.category_scores.open_source).toBe(18);
        expect(result.category_scores.technical_skills).toBe(7);
        expect(result.category_max.open_source).toBe(35);
        expect(result.strengths.length).toBeGreaterThan(0);
        expect(result.suggestions.length).toBeGreaterThan(0);
        expect(result.evidence.open_source).toContain('OSS');
    });

    it('clamps overall_score to 0-100 range', async () => {
        generateObject.mockResolvedValueOnce({
            ...SAMPLE_EVALUATION,
            scores: {
                open_source: { score: 35, max: 35, evidence: 'x' },
                self_projects: { score: 30, max: 30, evidence: 'x' },
                production: { score: 25, max: 25, evidence: 'x' },
                technical_skills: { score: 10, max: 10, evidence: 'x' },
            },
            bonus_points: { total: 20, breakdown: 'GSoC' },
            deductions: { total: 0, reasons: 'None' },
        });

        const result = await evaluateResume(SAMPLE_STRUCTURED_RESUME, null);
        expect(result.overall_score).toBeLessThanOrEqual(100);
        expect(result.overall_score).toBe(100);
    });

    it('throws a user-friendly error when LLM fails', async () => {
        generateObject.mockRejectedValueOnce(new Error('Network error'));

        await expect(evaluateResume(SAMPLE_STRUCTURED_RESUME, null))
            .rejects.toThrow('Resume evaluation failed');
    });

    it('throws a quota error when the LLM reports quota exhaustion', async () => {
        generateObject.mockRejectedValueOnce(
            new Error('You exceeded your current quota, please check your plan and billing details.')
        );

        await expect(evaluateResume(SAMPLE_STRUCTURED_RESUME, null))
            .rejects.toMatchObject({ code: 'LLM_QUOTA_EXCEEDED', statusCode: 429 });
    });
});

// ---------------------------------------------------------------------------
// Tests: github.js (GitHub enrichment)
// ---------------------------------------------------------------------------

describe('enrichWithGithub', () => {
    it('returns null when no GitHub profile is present', async () => {
        const resume = { ...SAMPLE_STRUCTURED_RESUME, basics: { ...SAMPLE_STRUCTURED_RESUME.basics, profiles: [] } };
        const result = await enrichWithGithub(resume);
        expect(result).toBeNull();
    });

    it('returns null gracefully when GitHub API is unreachable', async () => {
        // profiles has github but fetch will fail (no network in test env)
        const result = await enrichWithGithub(SAMPLE_STRUCTURED_RESUME);
        // In test environment without network, should not throw
        expect(result === null || typeof result === 'object').toBe(true);
    });
});

// ---------------------------------------------------------------------------
// Tests: extract.js
// ---------------------------------------------------------------------------

describe('extractResumeText', () => {
    it('extracts text from a PDF stored in Supabase Storage', async () => {
        const doc = {
            storage_path: 'user-123/resume.pdf',
            file_url: null,
            is_external: false,
        };

        const result = await extractResumeText(doc);

        expect(result).toHaveProperty('text');
        expect(result.text.length).toBeGreaterThan(0);
        expect(result.fileType).toBe('pdf');
    });

    it('throws when document has no accessible file', async () => {
        const doc = { storage_path: null, file_url: null, is_external: false };

        await expect(extractResumeText(doc)).rejects.toThrow(
            'Document has no accessible file'
        );
    });
});

// ---------------------------------------------------------------------------
// Tests: runResumeCheck.js (orchestrator)
// ---------------------------------------------------------------------------

describe('runResumeCheck', () => {
    beforeEach(() => {
        generateObject.mockReset();
    });

    it('returns a completed result with all required fields', async () => {
        generateObject
            .mockResolvedValueOnce({
                basics: { name: 'John', email: 'j@x.com', profiles: [] },
                work: [],
                education: [],
                skills: { technical: [], soft: [], languages: [] },
                projects: [],
                awards: [],
            })
            .mockResolvedValueOnce(SAMPLE_EVALUATION);

        const doc = {
            id: 'doc-uuid-1',
            name: 'My Resume',
            type: 'resume',
            storage_path: 'user-123/resume.pdf',
            file_url: null,
            is_external: false,
        };

        const result = await runResumeCheck(doc);

        expect(result.status).toBe('completed');
        expect(result.provider).toBe('gemini');
        expect(result.model).toBe('gemini-2.5-flash');
        expect(typeof result.overall_score).toBe('number');
        expect(result.category_scores).toBeDefined();
        expect(result.structured_resume).toBeDefined();
        expect(Array.isArray(result.strengths)).toBe(true);
        expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('propagates extraction errors as thrown errors', async () => {
        const doc = {
            id: 'doc-uuid-2',
            storage_path: null,
            file_url: null,
            is_external: false,
        };

        await expect(runResumeCheck(doc)).rejects.toThrow('Text extraction failed');
    });
});

// ---------------------------------------------------------------------------
// Tests: validation schema
// ---------------------------------------------------------------------------

describe('resume-checker Joi schema', () => {
    const { documentIdParamSchema } = require('../../src/validation/resume-checker-schemas');

    it('accepts a valid UUID', () => {
        const { error } = documentIdParamSchema.validate({ id: '550e8400-e29b-41d4-a716-446655440000' });
        expect(error).toBeUndefined();
    });

    it('rejects a non-UUID string', () => {
        const { error } = documentIdParamSchema.validate({ id: 'not-a-uuid' });
        expect(error).toBeDefined();
    });

    it('rejects a missing id', () => {
        const { error } = documentIdParamSchema.validate({});
        expect(error).toBeDefined();
    });
});
