/**
 * AiResumeCheckPanel — AI-powered resume evaluation panel.
 *
 * Displays the result of the agentic AI resume checker:
 *   - Overall score ring + category bar chart
 *   - Strengths & suggestions
 *   - GitHub signals (if available)
 *   - Per-category evidence (expandable)
 *   - AI/LLM disclaimer
 *
 * Visually matches AtsAnalysisPanel for a consistent Documents vault experience.
 * Powered by interviewstreet/hiring-agent architecture (MIT © HackerRank),
 * reimplemented in Node.js for FutureTracker.
 */

import React, { useState } from 'react';
import { FaGithub, FaChevronDown, FaChevronUp, FaBrain } from 'react-icons/fa';
import { ScoreRing } from './AtsAnalysisPanel';

// ---------------------------------------------------------------------------
// Category bar
// ---------------------------------------------------------------------------

const CATEGORY_LABELS = {
    open_source:      'Open Source',
    self_projects:    'Self Projects',
    production:       'Production',
    technical_skills: 'Technical Skills',
};

const CATEGORY_MAX = {
    open_source: 35,
    self_projects: 30,
    production: 25,
    technical_skills: 10,
};

const CategoryBar = ({ label, score, max = 25 }) => {
    const pct = Math.min(100, Math.round((score / max) * 100));
    const color =
        pct >= 70 ? 'bg-emerald-500' :
        pct >= 40 ? 'bg-amber-500' :
                    'bg-red-500';

    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs font-semibold text-white">{score}/{max}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

const AiResumeCheckPanel = ({
    checkResult = null,
    isAnalyzing = false,
    isOpen = false,
    onToggle,
}) => {
    const [showEvidence, setShowEvidence] = useState(false);

    // ---------- Loading state ----------
    if (isAnalyzing) {
        return (
            <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
                <div className="flex items-center gap-2 mb-1">
                    <FaBrain className="text-violet-400 animate-pulse" size={14} />
                    <p className="text-sm font-medium text-violet-200">AI Resume Check running…</p>
                </div>
                <p className="text-xs text-gray-400">
                    Extracting content, parsing sections, checking GitHub signals, and evaluating.
                    This typically takes 20–60 seconds.
                </p>
                <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full bg-violet-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
            </div>
        );
    }

    // ---------- No result yet ----------
    if (!checkResult) {
        return (
            <div className="mt-3 rounded-lg border border-dashed border-white/10 bg-white/[0.02] px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                    <FaBrain className="text-violet-400" size={12} />
                    <p className="text-sm font-medium text-white">No AI check yet</p>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                    Use <span className="text-violet-300">AI Check</span> below to run an agentic evaluation powered by an LLM.
                    Scores overall quality, open-source contributions, projects, production experience,
                    and technical skills.
                </p>
            </div>
        );
    }

    // ---------- Failed state ----------
    if (checkResult.status === 'failed') {
        return (
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
                <div className="flex items-center gap-1.5 mb-1">
                    <FaBrain className="text-red-400" size={12} />
                    <p className="text-sm font-medium text-red-300">AI check failed</p>
                </div>
                <p className="text-xs text-gray-400">
                    {checkResult.error || 'Analysis could not be completed. Please try again.'}
                </p>
            </div>
        );
    }

    // ---------- Completed state ----------
    const score = checkResult.overall_score ?? 0;
    const cats = checkResult.category_scores || {};
    const catMax = checkResult.category_max || CATEGORY_MAX;
    const strengths = checkResult.strengths || [];
    const suggestions = checkResult.suggestions || [];
    const evidence = checkResult.evidence || {};
    const github = checkResult.github_summary;
    const provider = checkResult.provider;
    const model = checkResult.model;

    return (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20">
            {/* Header row */}
            <div
                className="flex items-center justify-between gap-3 p-3 cursor-pointer select-none"
                onClick={onToggle}
                role="button"
                aria-expanded={isOpen}
            >
                <div className="flex items-center gap-2">
                    <FaBrain className="text-violet-400 shrink-0" size={13} />
                    <span className="text-xs text-gray-400">AI Resume Score</span>
                    {provider && (
                        <span className="text-[10px] text-gray-600 hidden sm:inline">
                            {provider}/{model}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${score >= 75 ? 'text-emerald-300' : score >= 50 ? 'text-amber-300' : 'text-red-300'}`}>
                        {score}/100
                    </span>
                    {onToggle && (
                        isOpen
                            ? <FaChevronUp size={11} className="text-gray-500" />
                            : <FaChevronDown size={11} className="text-gray-500" />
                    )}
                </div>
            </div>

            {isOpen && (
                <div className="px-3 pb-4 space-y-4 border-t border-white/5 pt-3">

                    {/* Score ring + category bars */}
                    <div className="flex items-start gap-4">
                        <ScoreRing score={score} />
                        <div className="flex-1 space-y-2 min-w-0">
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                                <CategoryBar
                                    key={key}
                                    label={label}
                                    score={cats[key] ?? 0}
                                    max={catMax[key] ?? CATEGORY_MAX[key] ?? 25}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Bonus / deductions row */}
                    {(checkResult.bonus > 0 || checkResult.deductions > 0) && (
                        <div className="flex gap-3 text-xs">
                            {checkResult.bonus > 0 && (
                                <span className="text-emerald-400">+{checkResult.bonus} bonus</span>
                            )}
                            {checkResult.deductions > 0 && (
                                <span className="text-red-400">-{checkResult.deductions} deductions</span>
                            )}
                        </div>
                    )}

                    {/* Strengths */}
                    {strengths.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-300 mb-1.5">Strengths</p>
                            <ul className="space-y-1">
                                {strengths.map((s, i) => (
                                    <li key={i} className="flex gap-1.5 text-xs text-gray-400">
                                        <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Suggestions */}
                    {suggestions.length > 0 && (
                        <div>
                            <p className="text-xs font-semibold text-gray-300 mb-1.5">Suggestions</p>
                            <ul className="space-y-1">
                                {suggestions.map((s, i) => (
                                    <li key={i} className="flex gap-1.5 text-xs text-gray-400">
                                        <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                                        <span>{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* GitHub signals */}
                    {github && (
                        <div className="rounded-md bg-white/[0.03] border border-white/5 px-3 py-2">
                            <div className="flex items-center gap-1.5 mb-1">
                                <FaGithub size={12} className="text-gray-400" />
                                <span className="text-xs font-medium text-gray-300">
                                    GitHub: @{github.username}
                                </span>
                            </div>
                            <div className="flex gap-4 text-[11px] text-gray-500">
                                <span>{github.publicRepos} public repos</span>
                                <span>{github.totalStars} total stars</span>
                                <span>{github.followers} followers</span>
                            </div>
                            {github.topProjects?.length > 0 && (
                                <p className="mt-1 text-[11px] text-gray-500">
                                    Top projects: {github.topProjects.join(', ')}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Evidence (expandable) */}
                    {Object.values(evidence).some(Boolean) && (
                        <div>
                            <button
                                type="button"
                                onClick={() => setShowEvidence(v => !v)}
                                className="flex items-center gap-1 text-xs font-medium text-blue-400 hover:text-blue-300"
                            >
                                {showEvidence ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                                {showEvidence ? 'Hide' : 'Show'} evaluation evidence
                            </button>
                            {showEvidence && (
                                <ul className="mt-2 space-y-1.5">
                                    {Object.entries(evidence).map(([key, val]) => val ? (
                                        <li key={key} className="text-[11px] text-gray-500">
                                            <span className="text-gray-400 font-medium">
                                                {CATEGORY_LABELS[key] || key}:
                                            </span>{' '}
                                            {val}
                                        </li>
                                    ) : null)}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* AI disclaimer */}
                    <p className="text-[10px] text-gray-600 leading-relaxed border-t border-white/5 pt-2">
                        AI-generated evaluation — not an official score. Results may vary across runs
                        and providers. Powered by {provider || 'LLM'} ({model || 'unknown model'}).
                    </p>
                </div>
            )}
        </div>
    );
};

export default AiResumeCheckPanel;
