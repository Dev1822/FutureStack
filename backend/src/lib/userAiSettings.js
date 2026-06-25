/**
 * Load and resolve per-user LLM credentials for the AI Resume Checker.
 */

'use strict';

const { supabase } = require('./supabase');
const { tryDecryptApiKey, keyHint } = require('./apiKeyVault');

const KEY_REFRESH_MESSAGE =
    'Your saved API key could not be read. Enter your Gemini API key again in AI Settings.';

/**
 * Fetch user's saved AI settings (safe for API response — no raw key).
 *
 * @param {string} userId - Internal users.id UUID
 * @returns {Promise<{ configured: boolean, provider?: string, model?: string, keyHint?: string, needsKeyRefresh?: boolean, message?: string }>}
 */
async function getUserAiSettingsSummary(userId) {
    const { data, error } = await supabase
        .from('user_ai_settings')
        .select('provider, model, api_key_ciphertext, api_key_iv, api_key_auth_tag')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        return { configured: false };
    }

    const { key: apiKey, failed } = tryDecryptApiKey(data);
    if (failed) {
        return {
            configured: false,
            needsKeyRefresh: true,
            provider: data.provider,
            model: data.model,
            message: KEY_REFRESH_MESSAGE,
        };
    }

    return {
        configured: Boolean(apiKey),
        provider: data.provider,
        model: data.model,
        keyHint: apiKey ? keyHint(apiKey) : null,
    };
}

/**
 * Resolve LLM options for pipeline execution.
 * User BYOK key takes priority; falls back to server GEMINI_API_KEY.
 *
 * @param {string} userId
 * @returns {Promise<{ provider: string, model: string, apiKey?: string }>}
 */
async function resolveUserLlmOptions(userId) {
    const { data, error } = await supabase
        .from('user_ai_settings')
        .select('provider, model, api_key_ciphertext, api_key_iv, api_key_auth_tag')
        .eq('user_id', userId)
        .maybeSingle();

    if (error) throw error;

    if (data) {
        const { key: apiKey, failed } = tryDecryptApiKey(data);
        if (failed) {
            const err = new Error(KEY_REFRESH_MESSAGE);
            err.code = 'KEY_DECRYPT_FAILED';
            throw err;
        }
        if (apiKey) {
            return { provider: data.provider, model: data.model, apiKey };
        }
    }

    if (process.env.GEMINI_API_KEY) {
        return {
            provider: process.env.LLM_PROVIDER || 'gemini',
            model: process.env.LLM_MODEL || 'gemini-3.1-flash-lite',
            apiKey: process.env.GEMINI_API_KEY,
        };
    }

    throw new Error('No API key configured. Open AI Settings and save your Gemini API key.');
}

module.exports = { getUserAiSettingsSummary, resolveUserLlmOptions, KEY_REFRESH_MESSAGE };
