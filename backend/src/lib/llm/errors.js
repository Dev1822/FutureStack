'use strict';

class LlmError extends Error {
    constructor(message, code, statusCode = 500) {
        super(message);
        this.name = 'LlmError';
        this.code = code;
        this.statusCode = statusCode;
    }
}

function classifyLlmError(err) {
    const msg = err?.message || String(err);
    const lower = msg.toLowerCase();

    if (
        lower.includes('quota') ||
        lower.includes('exceeded your current quota') ||
        lower.includes('resource_exhausted')
    ) {
        return new LlmError(
            'Your Gemini API key has no remaining quota for this model. In AI Settings, try gemini-3.1-flash-lite, wait a few minutes, or use a different API key.',
            'LLM_QUOTA_EXCEEDED',
            429
        );
    }

    if (lower.includes('rate limit') || lower.includes('please retry in')) {
        return new LlmError(
            'Gemini rate limit reached. Please wait a minute and try again.',
            'LLM_RATE_LIMITED',
            429
        );
    }

    if (
        lower.includes('api key not valid') ||
        lower.includes('invalid api key') ||
        lower.includes('api_key_invalid') ||
        lower.includes('permission_denied')
    ) {
        return new LlmError(
            'Gemini rejected your API key. In AI Settings, paste a new key from https://aistudio.google.com/api-keys '
            + 'with no HTTP referrer or IP restrictions (those block this server).',
            'LLM_AUTH_ERROR',
            400
        );
    }

    if (err?.name === 'AbortError' || lower.includes('aborted') || lower.includes('timeout')) {
        return new LlmError(
            'AI analysis timed out. Try again with a shorter resume or a faster model.',
            'LLM_TIMEOUT',
            504
        );
    }

    return null;
}

function throwIfLlmError(err, fallbackMessage) {
    const classified = classifyLlmError(err);
    if (classified) throw classified;
    throw new Error(fallbackMessage || err.message);
}

module.exports = { LlmError, classifyLlmError, throwIfLlmError };
