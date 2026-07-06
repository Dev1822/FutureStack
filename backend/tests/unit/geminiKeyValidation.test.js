'use strict';

const {
    sanitizeApiKey,
    validateGeminiKeyFormat,
    verifyGeminiApiKey,
} = require('../../src/lib/geminiKeyValidation');

jest.mock('ai', () => ({
    generateText: jest.fn(),
}));

jest.mock('@ai-sdk/google', () => ({
    createGoogleGenerativeAI: jest.fn(() => (model) => model),
}));

const { generateText } = require('ai');

describe('geminiKeyValidation', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        generateText.mockReset();
    });

    it('sanitizes whitespace and zero-width characters from pasted keys', () => {
        const raw = ' AIza\u200BSyTest\uFEFFKey1234567890 \n';
        expect(sanitizeApiKey(raw)).toBe('AIzaSyTestKey1234567890');
    });

    it('rejects keys that are too short', () => {
        expect(validateGeminiKeyFormat('short')).toEqual({
            ok: false,
            message: expect.stringContaining('too short'),
        });
    });

    it('accepts keys regardless of prefix when long enough', () => {
        expect(validateGeminiKeyFormat('sk-not-a-gemini-key-123456789')).toEqual({ ok: true });
        expect(validateGeminiKeyFormat('AIzaSyTestKey1234567890')).toEqual({ ok: true });
    });

    it('verifyGeminiApiKey returns auth error when Gemini rejects the key', async () => {
        generateText.mockRejectedValueOnce(new Error('API key not valid. Please pass a valid API key.'));
        const result = await verifyGeminiApiKey('AIzaSyTestKey1234567890', 'gemini-2.5-flash');
        expect(result.ok).toBe(false);
        expect(result.code).toBe('LLM_AUTH_ERROR');
        expect(result.message).toContain('restrictions');
    });

    it('verifyGeminiApiKey passes a bounded abortSignal to generateText', async () => {
        generateText.mockResolvedValueOnce({ text: 'ok' });
        await verifyGeminiApiKey('AIzaSyTestKey1234567890', 'gemini-2.5-flash');
        expect(generateText).toHaveBeenCalledWith(
            expect.objectContaining({
                abortSignal: expect.any(AbortSignal),
            })
        );
    });

    it('verifyGeminiApiKey strict mode only probes the requested model', async () => {
        generateText
            .mockRejectedValueOnce(new Error('model not found'))
            .mockResolvedValueOnce({ text: 'ok' });
        const result = await verifyGeminiApiKey('AIzaSyTestKey1234567890', 'gemini-2.5-flash', {
            strictPreferredModel: true,
        });
        expect(result.ok).toBe(false);
        expect(generateText).toHaveBeenCalledTimes(1);
    });

    it('verifyGeminiApiKey succeeds when Gemini accepts the key', async () => {
        generateText.mockResolvedValueOnce({ text: 'ok' });
        const result = await verifyGeminiApiKey('AIzaSyTestKey1234567890', 'gemini-2.5-flash');
        expect(result.ok).toBe(true);
        expect(result.model).toBe('gemini-2.5-flash');
    });

    it('verifyGeminiApiKey falls back to a probe model when preferred model fails', async () => {
        generateText
            .mockRejectedValueOnce(new Error('model not found'))
            .mockResolvedValueOnce({ text: 'ok' });
        const result = await verifyGeminiApiKey('AIzaSyTestKey1234567890', 'gemini-3.1-flash-lite');
        expect(result.ok).toBe(true);
        expect(result.model).toBe('gemini-2.5-flash');
        expect(generateText).toHaveBeenCalledTimes(2);
    });
});
