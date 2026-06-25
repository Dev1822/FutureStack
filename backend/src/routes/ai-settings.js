/**
 * AI Settings routes (BYOK)
 *
 * GET    /api/ai-settings  – whether user has a saved key (safe summary)
 * PUT    /api/ai-settings  – save/update encrypted API key + provider/model
 * DELETE /api/ai-settings  – remove saved key
 */

'use strict';

const express = require('express');
const { supabase } = require('../lib/supabase');
const { validate } = require('../middleware/validate');
const { saveAiSettingsSchema } = require('../validation/ai-settings-schemas');
const { encryptApiKey, keyHint } = require('../lib/apiKeyVault');
const { getUserAiSettingsSummary } = require('../lib/userAiSettings');
const { mapDbError } = require('../lib/dbSetup');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const summary = await getUserAiSettingsSummary(req.auth.internalUserId);
        return res.json(summary);
    } catch (err) {
        console.error('[ai-settings] GET error:', err.message);
        const mapped = mapDbError(err);
        if (mapped) {
            return res.status(503).json(mapped);
        }
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to load AI settings.',
        });
    }
});

router.put('/', validate(saveAiSettingsSchema), async (req, res) => {
    const userId = req.auth.internalUserId;
    const { provider, model, apiKey } = req.body;
    const trimmedKey = typeof apiKey === 'string' ? apiKey.trim() : '';

    try {
        if (!trimmedKey) {
            const summary = await getUserAiSettingsSummary(userId);
            if (!summary.configured) {
                return res.status(400).json({
                    error: 'API Key Required',
                    message: 'Enter your Gemini API key to get started.',
                });
            }

            const { data, error } = await supabase
                .from('user_ai_settings')
                .update({
                    provider,
                    model,
                    updated_at: new Date().toISOString(),
                })
                .eq('user_id', userId)
                .select('provider, model')
                .single();

            if (error) throw error;

            return res.json({
                configured: true,
                provider: data.provider,
                model: data.model,
                keyHint: summary.keyHint,
                message: 'AI settings updated.',
            });
        }

        const encrypted = encryptApiKey(trimmedKey);

        const { data, error } = await supabase
            .from('user_ai_settings')
            .upsert({
                user_id: userId,
                provider,
                model,
                ...encrypted,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' })
            .select('provider, model')
            .single();

        if (error) throw error;

        return res.json({
            configured: true,
            provider: data.provider,
            model: data.model,
            keyHint: keyHint(trimmedKey),
            message: 'API key saved securely. You will not need to enter it again.',
        });
    } catch (err) {
        console.error('[ai-settings] PUT error:', err.message);
        const mapped = mapDbError(err);
        if (mapped) {
            return res.status(503).json(mapped);
        }
        return res.status(500).json({
            error: 'Internal Server Error',
            message: err.message.includes('encryption key')
                ? 'Server is not configured for API key storage.'
                : 'Failed to save AI settings.',
        });
    }
});

router.delete('/', async (req, res) => {
    const userId = req.auth.internalUserId;

    try {
        const { error } = await supabase
            .from('user_ai_settings')
            .delete()
            .eq('user_id', userId);

        if (error) throw error;

        return res.json({ configured: false, message: 'API key removed.' });
    } catch (err) {
        console.error('[ai-settings] DELETE error:', err.message);
        const mapped = mapDbError(err);
        if (mapped) {
            return res.status(503).json(mapped);
        }
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to remove AI settings.',
        });
    }
});

module.exports = router;
