/**
 * parser.js — LLM extraction into a JSON Resume object.
 *
 * Uses a single structured LLM call (not per-section) to stay within API quotas.
 */

'use strict';

const { z } = require('zod');
const { generateObject } = require('../llm');
const { throwIfLlmError } = require('../llm/errors');
const {
    SYSTEM_EXTRACTION,
    buildFullExtractionPrompt,
} = require('./prompts');

const ProfileSchema = z.object({
    network: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
});

const WorkEntrySchema = z.object({
    company: z.string().optional().nullable(),
    position: z.string().optional().nullable(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    highlights: z.array(z.string()).optional().default([]),
});

const EducationEntrySchema = z.object({
    institution: z.string().optional().nullable(),
    area: z.string().optional().nullable(),
    studyType: z.string().optional().nullable(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    score: z.string().nullable().optional(),
    courses: z.array(z.string()).optional().default([]),
});

const ProjectEntrySchema = z.object({
    name: z.string().optional().nullable(),
    description: z.string().optional().nullable(),
    url: z.string().optional().nullable(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    highlights: z.array(z.string()).optional().default([]),
    keywords: z.array(z.string()).optional().default([]),
});

const AwardEntrySchema = z.object({
    title: z.string().optional().nullable(),
    date: z.string().nullable().optional(),
    awarder: z.string().nullable().optional(),
    summary: z.string().nullable().optional(),
});

const FullResumeSchema = z.object({
    basics: z.object({
        name: z.string().nullable().optional(),
        email: z.string().nullable().optional(),
        phone: z.string().nullable().optional(),
        location: z.string().nullable().optional(),
        summary: z.string().nullable().optional(),
        profiles: z.array(ProfileSchema).optional().default([]),
    }).optional().default({}),
    work: z.array(WorkEntrySchema).optional().default([]),
    education: z.array(EducationEntrySchema).optional().default([]),
    skills: z.object({
        technical: z.array(z.string()).optional().default([]),
        soft: z.array(z.string()).optional().default([]),
        languages: z.array(z.string()).optional().default([]),
    }).optional().default({ technical: [], soft: [], languages: [] }),
    projects: z.array(ProjectEntrySchema).optional().default([]),
    awards: z.array(AwardEntrySchema).optional().default([]),
});

/**
 * Extract all resume sections from raw text via one LLM call.
 *
 * @param {string} resumeText
 * @returns {Promise<object>}
 */
async function parseResume(resumeText, llmOptions) {
    try {
        const extracted = await generateObject({
            system: SYSTEM_EXTRACTION,
            prompt: buildFullExtractionPrompt(resumeText),
            schema: FullResumeSchema,
            schemaName: 'Resume',
            maxTokens: 4096,
            llmOptions,
        });
        return normalise(extracted);
    } catch (err) {
        const keyMeta = llmOptions?.apiKey
            ? ` (keyLen=${llmOptions.apiKey.length})`
            : '';
        console.error('[resume-agent] Resume parsing failed:', err.message + keyMeta);
        throwIfLlmError(err, `Resume parsing failed: ${err.message}`);
    }
}

function normalise(raw) {
    const basics = raw.basics || raw;

    return {
        basics: {
            name: basics.name || null,
            email: basics.email || null,
            phone: basics.phone || null,
            location: basics.location || null,
            summary: basics.summary || null,
            profiles: Array.isArray(basics.profiles) ? basics.profiles : [],
        },
        work: Array.isArray(raw.work) ? raw.work : [],
        education: Array.isArray(raw.education) ? raw.education : [],
        skills: {
            technical: Array.isArray(raw.skills?.technical) ? raw.skills.technical : [],
            soft: Array.isArray(raw.skills?.soft) ? raw.skills.soft : [],
            languages: Array.isArray(raw.skills?.languages) ? raw.skills.languages : [],
        },
        projects: Array.isArray(raw.projects) ? raw.projects : [],
        awards: Array.isArray(raw.awards) ? raw.awards : [],
    };
}

module.exports = { parseResume };
