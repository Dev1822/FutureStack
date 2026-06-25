'use strict';

const { generateText } = require('ai');
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
const { classifyLlmError } = require('./llm/errors');

const PROBE_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.1-flash-lite'];
const VERIFY_TIMEOUT_MS = 10_000;

/**
 * Normalize pasted API keys (strip whitespace, zero-width chars, etc.).
 * @param {string} raw
 * @returns {string}
 */
function sanitizeApiKey(raw) {
    if (typeof raw !== 'string') return '';
    return raw
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, '')
        .trim();
}

/**
 * @param {string} apiKey
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function validateGeminiKeyFormat(apiKey) {
    if (!apiKey || apiKey.length < 10) {
        return {
            ok: false,
            message: 'API key looks too short. Copy the full key from Google AI Studio.',
        };
    }
    return { ok: true };
}

/**
 * Probe Gemini with the same SDK path used by the resume pipeline.
 * @param {string} apiKey
 * @param {string} [preferredModel]
 * @param {{ strictPreferredModel?: boolean }} [options]
 * @returns {Promise<{ ok: true, model: string } | { ok: false, code?: string, message: string }>}
 */
async function verifyGeminiApiKey(apiKey, preferredModel, options = {}) {
    const format = validateGeminiKeyFormat(apiKey);
    if (!format.ok) {
        return { ok: false, message: format.message };
    }

    const models = options.strictPreferredModel
        ? [preferredModel].filter(Boolean)
        : [preferredModel, ...PROBE_MODELS].filter(Boolean);
    const uniqueModels = [...new Set(models)];

    let lastMessage = 'Could not verify API key with Gemini.';

    for (const model of uniqueModels) {
        try {
            const google = createGoogleGenerativeAI({ apiKey });
            await generateText({
                model: google(model),
                prompt: 'Reply with exactly: ok',
                maxTokens: 8,
                abortSignal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
            });
            return { ok: true, model };
        } catch (err) {
            const classified = classifyLlmError(err);
            if (classified) {
                if (classified.code === 'LLM_AUTH_ERROR') {
                    return {
                        ok: false,
                        code: classified.code,
                        message:
                            'Gemini rejected this API key. Create a new key at https://aistudio.google.com/api-keys '
                            + 'with no application restrictions (HTTP referrer / IP limits block server-side use). '
                            + 'Enable the Generative Language API for the key\'s Google Cloud project.',
                    };
                }
                if (classified.code === 'LLM_QUOTA_EXCEEDED' || classified.code === 'LLM_RATE_LIMITED') {
                    // Key is valid; quota limits are OK for save.
                    return { ok: true, model };
                }
                lastMessage = classified.message;
                continue;
            }
            lastMessage = err.message || lastMessage;
        }
    }

    return { ok: false, message: lastMessage };
}

module.exports = {
    sanitizeApiKey,
    validateGeminiKeyFormat,
    verifyGeminiApiKey,
};
