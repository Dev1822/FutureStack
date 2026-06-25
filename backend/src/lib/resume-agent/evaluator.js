/**
 * evaluator.js — Scored evaluation stage.
 *
 * Mirrors evaluator.py from interviewstreet/hiring-agent (MIT © HackerRank).
 * Uses the hiring-agent rubric (35/30/25/10 categories, bonus up to 20)
 * and normalizes the final score to a 0-100 display scale.
 */

'use strict';

const { z } = require('zod');
const { generateObject } = require('../llm');
const { throwIfLlmError } = require('../llm/errors');
const { SYSTEM_EVALUATION, buildEvaluationPrompt } = require('./prompts');
const { buildEvaluationText, CATEGORY_MAX } = require('./resumeText');

const MAX_BONUS = 20;
const MAX_RAW_SCORE = 100 + MAX_BONUS; // 120

const CategoryScoreSchema = z.object({
    score: z.number(),
    max: z.number().optional(),
    evidence: z.string().optional().default(''),
});

const HiringAgentEvaluationSchema = z.object({
    scores: z.object({
        open_source: CategoryScoreSchema,
        self_projects: CategoryScoreSchema,
        production: CategoryScoreSchema,
        technical_skills: CategoryScoreSchema,
    }),
    bonus_points: z.object({
        total: z.number().optional().default(0),
        breakdown: z.string().optional().default(''),
    }).optional().default({ total: 0, breakdown: '' }),
    deductions: z.object({
        total: z.number().optional().default(0),
        reasons: z.string().optional().default(''),
    }).optional().default({ total: 0, reasons: '' }),
    key_strengths: z.array(z.string()).optional().default([]),
    areas_for_improvement: z.array(z.string()).optional().default([]),
});

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function capCategoryScore(key, score) {
    const max = CATEGORY_MAX[key] ?? 25;
    return clamp(Math.round(score), 0, max);
}

function computeOverallScore(categoryScores, bonus, deductions) {
    const categorySum = Object.values(categoryScores).reduce((sum, value) => sum + value, 0);
    const rawTotal = clamp(categorySum + bonus - deductions, 0, MAX_RAW_SCORE);
    return Math.round((rawTotal / MAX_RAW_SCORE) * 100);
}

function normaliseEvaluation(evaluation) {
    const scores = evaluation.scores || {};
    const category_scores = {
        open_source: capCategoryScore('open_source', scores.open_source?.score ?? 0),
        self_projects: capCategoryScore('self_projects', scores.self_projects?.score ?? 0),
        production: capCategoryScore('production', scores.production?.score ?? 0),
        technical_skills: capCategoryScore('technical_skills', scores.technical_skills?.score ?? 0),
    };

    const bonus = clamp(Math.round(evaluation.bonus_points?.total ?? 0), 0, MAX_BONUS);
    const deductions = clamp(Math.round(evaluation.deductions?.total ?? 0), 0, MAX_BONUS);

    const evidence = {
        open_source: scores.open_source?.evidence || '',
        self_projects: scores.self_projects?.evidence || '',
        production: scores.production?.evidence || '',
        technical_skills: scores.technical_skills?.evidence || '',
    };

    return {
        overall_score: computeOverallScore(category_scores, bonus, deductions),
        category_scores,
        category_max: { ...CATEGORY_MAX },
        bonus,
        deductions,
        bonus_breakdown: evaluation.bonus_points?.breakdown || '',
        deduction_reasons: evaluation.deductions?.reasons || '',
        strengths: (evaluation.key_strengths || []).slice(0, 5),
        suggestions: (evaluation.areas_for_improvement || []).slice(0, 3),
        evidence,
    };
}

/**
 * Evaluate the structured resume and produce scores + insights.
 *
 * @param {object} structuredResume
 * @param {object|null} githubSummary
 * @param {object} [llmOptions]
 * @returns {Promise<object>}
 */
async function evaluateResume(structuredResume, githubSummary, llmOptions) {
    const evaluationText = buildEvaluationText(structuredResume, githubSummary);

    let evaluation;
    try {
        evaluation = await generateObject({
            system: SYSTEM_EVALUATION,
            prompt: buildEvaluationPrompt(evaluationText),
            schema: HiringAgentEvaluationSchema,
            schemaName: 'ResumeEvaluation',
            maxTokens: 3072,
            llmOptions,
        });
    } catch (err) {
        console.error('[resume-agent] Evaluation LLM call failed:', err.message);
        throwIfLlmError(err, 'Resume evaluation failed. Please try again.');
    }

    return normaliseEvaluation(evaluation);
}

module.exports = { evaluateResume, normaliseEvaluation, computeOverallScore };
