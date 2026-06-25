/**
 * runResumeCheck.js — Orchestrator for the full AI resume check pipeline.
 *
 * Mirrors score.py from interviewstreet/hiring-agent (MIT © HackerRank).
 * Runs the four stages in sequence:
 *   1. extract   – PDF/DOCX → plain text
 *   2. parse     – LLM → structured JSON Resume
 *   3. enrich    – GitHub signals (optional)
 *   4. evaluate  – LLM → scores + insights
 *
 * Returns a normalised result object that is persisted in resume_ai_checks.
 */

'use strict';

const { extractResumeText } = require('./extract');
const { parseResume } = require('./parser');
const { enrichWithGithub } = require('./github');
const { evaluateResume } = require('./evaluator');
const { getProviderInfo } = require('../llm');
const { LlmError } = require('../llm/errors');

function rethrowPipelineError(stage, err) {
    if (err instanceof LlmError) throw err;
    throw new Error(`${stage}: ${err.message}`);
}

/**
 * Run the full resume check pipeline for a given document record.
 *
 * @param {object} document - Row from the documents table
 *   Must have: id, name, type, storage_path, file_url, is_external
 * @returns {Promise<object>} Result object ready to persist in resume_ai_checks
 */
async function runResumeCheck(document, llmOptions) {
    const { provider, model } = getProviderInfo(llmOptions);

    // Stage 1: Extract text
    let extractionResult;
    try {
        extractionResult = await extractResumeText(document);
    } catch (err) {
        rethrowPipelineError('Text extraction failed', err);
    }

    const { text: resumeText } = extractionResult;

    // Stage 2: Parse into structured resume
    let structuredResume;
    try {
        structuredResume = await parseResume(resumeText, llmOptions);
    } catch (err) {
        rethrowPipelineError('Resume parsing failed', err);
    }

    // Stage 3: GitHub enrichment (optional – never throws)
    let githubSummary = null;
    try {
        githubSummary = await enrichWithGithub(structuredResume, llmOptions);
    } catch (err) {
        console.warn('[resume-agent] GitHub enrichment skipped due to error:', err.message);
    }

    // Stage 4: Evaluate
    let evaluation;
    try {
        evaluation = await evaluateResume(structuredResume, githubSummary, llmOptions);
    } catch (err) {
        rethrowPipelineError('Resume evaluation failed', err);
    }

    return {
        status: 'completed',
        provider,
        model,
        overall_score:    evaluation.overall_score,
        category_scores:  evaluation.category_scores,
        category_max:     evaluation.category_max,
        structured_resume: structuredResume,
        github_summary:   githubSummary,
        strengths:        evaluation.strengths,
        suggestions:      evaluation.suggestions,
        evidence:         evaluation.evidence,
        bonus:            evaluation.bonus,
        deductions:       evaluation.deductions,
        bonus_breakdown:  evaluation.bonus_breakdown,
        deduction_reasons: evaluation.deduction_reasons,
    };
}

module.exports = { runResumeCheck };
