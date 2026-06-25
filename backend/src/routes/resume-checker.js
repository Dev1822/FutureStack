/**
 * Resume Checker routes
 *
 * POST /api/documents/:id/ai-check  – Run the AI resume check pipeline
 * GET  /api/documents/:id/ai-check  – Fetch the latest AI check result
 *
 * Both routes are authenticated via requireAuth (Clerk JWT).
 * A dedicated AI rate limiter (applied in app.js) keeps LLM costs in check.
 */

'use strict';

const express = require('express');
const { supabase } = require('../lib/supabase');
const { validate } = require('../middleware/validate');
const { documentIdParamSchema } = require('../validation/resume-checker-schemas');
const { runResumeCheck } = require('../lib/resume-agent/runResumeCheck');
const { resolveUserLlmOptions } = require('../lib/userAiSettings');
const { LlmError } = require('../lib/llm/errors');

const router = express.Router({ mergeParams: true });

// Whether the AI feature is enabled (default: true – can be toggled via env)
const AI_ENABLED = process.env.RESUME_AI_ENABLED !== 'false';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function logAudit(action, userId, resourceId = null, outcome = 'success', details = {}) {
    const allowed = ['errorCode', 'provider', 'model', 'score', 'documentType'];
    const sanitized = {};
    for (const key of allowed) {
        if (details[key] !== undefined) sanitized[key] = details[key];
    }
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'AUDIT',
        action,
        userId,
        resourceId,
        outcome,
        details: sanitized,
    }));
}

// ---------------------------------------------------------------------------
// POST /api/documents/:id/ai-check
// ---------------------------------------------------------------------------

router.post('/', validate(documentIdParamSchema, 'params'), async (req, res) => {
    if (!AI_ENABLED) {
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'AI resume checker is not enabled on this server.',
        });
    }

    const { id } = req.params;
    const userId = req.auth.internalUserId;

    try {
        // 1. Verify document ownership and that it is a resume
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('id, name, type, storage_path, file_url, is_external')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (docError) {
            if (docError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Document not found' });
            }
            throw docError;
        }

        if (doc.type !== 'resume') {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'AI check is only available for documents of type "resume".',
            });
        }

        if (!doc.storage_path && !doc.file_url) {
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Document has no accessible file. Please upload a PDF or DOCX file.',
            });
        }

        // 2. Create a "running" record so the frontend can poll if needed
        const { data: checkRecord, error: insertError } = await supabase
            .from('resume_ai_checks')
            .insert({
                user_id: userId,
                document_id: id,
                status: 'running',
            })
            .select('id')
            .single();

        if (insertError) throw insertError;

        const checkId = checkRecord.id;

        // Resolve user's BYOK credentials (or server fallback)
        let llmOptions;
        try {
            llmOptions = await resolveUserLlmOptions(userId);
        } catch (keyError) {
            await supabase
                .from('resume_ai_checks')
                .update({
                    status: 'failed',
                    error: keyError.message,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', checkId);

            return res.status(400).json({
                error: 'API Key Required',
                message: keyError.message,
                check_id: checkId,
                needsApiKey: true,
            });
        }

        // 3. Run the pipeline (synchronous in v1; async job queue is a follow-up)
        let result;
        try {
            result = await runResumeCheck(doc, llmOptions);
        } catch (pipelineError) {
            const isLlmError = pipelineError instanceof LlmError;
            const statusCode = isLlmError ? pipelineError.statusCode : 500;
            const message = pipelineError.message || 'Resume analysis failed. Please try again.';

            await supabase
                .from('resume_ai_checks')
                .update({
                    status: 'failed',
                    error: message,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', checkId);

            logAudit('AI_CHECK_FAILED', userId, id, 'failure', {
                errorCode: isLlmError ? pipelineError.code : pipelineError.message,
            });

            return res.status(statusCode).json({
                error: isLlmError ? pipelineError.code : 'Pipeline Failed',
                message,
                check_id: checkId,
                ...(isLlmError && pipelineError.code === 'LLM_QUOTA_EXCEEDED'
                    ? { retryable: true }
                    : {}),
            });
        }

        // 4. Persist the completed result
        const { data: completed, error: updateError } = await supabase
            .from('resume_ai_checks')
            .update({
                status:           result.status,
                provider:         result.provider,
                model:            result.model,
                overall_score:    result.overall_score,
                category_scores:  result.category_scores,
                structured_resume: result.structured_resume,
                github_summary:   result.github_summary,
                strengths:        result.strengths,
                suggestions:      result.suggestions,
                evidence:         result.evidence,
                bonus:            result.bonus,
                deductions:       result.deductions,
                updated_at:       new Date().toISOString(),
            })
            .eq('id', checkId)
            .select()
            .single();

        if (updateError) throw updateError;

        logAudit('AI_CHECK_COMPLETED', userId, id, 'success', {
            provider: result.provider,
            model: result.model,
            score: result.overall_score,
        });

        return res.status(200).json(completed);

    } catch (err) {
        console.error('[resume-checker] Unexpected error:', err.code || err.message || 'UNKNOWN');
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'An unexpected error occurred. Please try again.',
        });
    }
});

// ---------------------------------------------------------------------------
// GET /api/documents/:id/ai-check
// ---------------------------------------------------------------------------

router.get('/', validate(documentIdParamSchema, 'params'), async (req, res) => {
    const { id } = req.params;
    const userId = req.auth.internalUserId;

    try {
        // Verify document ownership
        const { data: doc, error: docError } = await supabase
            .from('documents')
            .select('id')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (docError) {
            if (docError.code === 'PGRST116') {
                return res.status(404).json({ error: 'Document not found' });
            }
            throw docError;
        }

        // Fetch the latest check for this document
        const { data: checks, error: checksError } = await supabase
            .from('resume_ai_checks')
            .select('*')
            .eq('document_id', id)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1);

        if (checksError) throw checksError;

        if (!checks || checks.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'No AI check found for this document.',
            });
        }

        return res.json(checks[0]);

    } catch (err) {
        console.error('[resume-checker] GET error:', err.code || err.message || 'UNKNOWN');
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to fetch AI check result.',
        });
    }
});

module.exports = router;
