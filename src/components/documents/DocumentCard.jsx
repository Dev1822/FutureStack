/**
 * DocumentCard - Displays a single document with its details and actions.
 * Shows document type icon, name, version, metadata, usage count, and action buttons.
 *
 * @module components/documents/DocumentCard
 */
import React, { useMemo, useState } from 'react';
import { FaFile, FaFilePdf, FaLink, FaDownload, FaEdit, FaTrash, FaBriefcase } from 'react-icons/fa';

const typeIcons = {
    resume: FaFilePdf,
    cover_letter: FaFile,
    portfolio: FaLink,
    other: FaFile
};

const typeColors = {
    resume: 'text-blue-400',
    cover_letter: 'text-green-400',
    portfolio: 'text-purple-400',
    other: 'text-gray-400'
};

const typeLabels = {
    resume: 'Resume',
    cover_letter: 'Cover Letter',
    portfolio: 'Portfolio',
    other: 'Other'
};

const parseAtsAnalysis = (analysis) => {
    if (!analysis) return null;
    if (typeof analysis === 'object') return analysis;

    try {
        return JSON.parse(analysis);
    } catch (error) {
        return null;
    }
};

const getScoreClasses = (score) => {
    if (score >= 75) return { text: 'text-emerald-300', stroke: 'stroke-emerald-400', bg: 'bg-emerald-500/15' };
    if (score >= 50) return { text: 'text-amber-300', stroke: 'stroke-amber-400', bg: 'bg-amber-500/15' };
    return { text: 'text-red-300', stroke: 'stroke-red-400', bg: 'bg-red-500/15' };
};

const ScoreRing = ({ score }) => {
    const classes = getScoreClasses(score);
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="relative h-12 w-12 shrink-0">
            <svg className="-rotate-90 h-12 w-12" viewBox="0 0 48 48" aria-hidden="true">
                <circle className="stroke-white/10" cx="24" cy="24" r={radius} fill="none" strokeWidth="4" />
                <circle
                    className={classes.stroke}
                    cx="24"
                    cy="24"
                    r={radius}
                    fill="none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-xs font-semibold ${classes.text}`}>
                {score}
            </span>
        </div>
    );
};

/**
 * Card component for displaying a document with actions.
 *
 * @param {Object} props - Component props
 * @param {Object} props.document - Document object with id, name, type, version, file_url, file_size, notes, is_external, created_at, and opportunity_documents
 * @param {Function} props.onEdit - Callback when edit button is clicked, receives the document object
 * @param {Function} props.onDelete - Callback when delete button is clicked, receives the document object
 * @returns {JSX.Element} Rendered document card
 */
const DocumentCard = ({ document, onEdit, onDelete }) => {
    const Icon = typeIcons[document.type] || FaFile;
    const colorClass = typeColors[document.type] || 'text-gray-400';
    const atsScore = document.type === 'resume' ? document.ats_score : null;
    const atsAnalysis = useMemo(() => parseAtsAnalysis(document.ats_analysis), [document.ats_analysis]);
    const [isAtsOpen, setIsAtsOpen] = useState(false);
    const [showScoring, setShowScoring] = useState(false);
    const scoreClasses = atsScore != null ? getScoreClasses(atsScore) : null;

    // Count how many opportunities use this document
    const usageCount = document.opportunity_documents?.length || 0;

    // Format file size
    const formatSize = (bytes) => {
        if (!bytes) return null;
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    // Format date
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all group h-full flex flex-col">
            {/* Header */}
            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${colorClass}`}>
                    <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-white font-medium truncate">{document.name}</h3>
                        {document.type === 'resume' && document.ats_score != null && (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${scoreClasses.bg} ${scoreClasses.text}`}>
                                ATS {document.ats_score}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                        <span>{typeLabels[document.type]}</span>
                        {document.version && (
                            <>
                                <span className="text-gray-600">•</span>
                                <span className="text-gray-500">{document.version}</span>
                            </>
                        )}
                    </div>
                </div>
                {atsScore != null && <ScoreRing score={atsScore} />}
            </div>

            {/* Metadata */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                {document.file_size && (
                    <span>{formatSize(document.file_size)}</span>
                )}
                <span>{formatDate(document.created_at)}</span>
                {document.is_external && (
                    <span className="text-purple-400">External Link</span>
                )}
            </div>

            {/* Notes preview */}
            {document.notes && (
                <p className="mt-2 text-sm text-gray-400 line-clamp-2">{document.notes}</p>
            )}

            {/* Usage badge */}
            {usageCount > 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-blue-400">
                    <FaBriefcase size={12} />
                    <span>Used in {usageCount} {usageCount === 1 ? 'opportunity' : 'opportunities'}</span>
                </div>
            )}

            {atsScore != null && (
                <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs text-gray-400">Rule-based hints - not an official ATS score</p>
                        <button
                            type="button"
                            onClick={() => setIsAtsOpen(open => !open)}
                            className="text-xs font-medium text-blue-300 hover:text-blue-200"
                        >
                            {isAtsOpen ? 'Hide' : 'Details'}
                        </button>
                    </div>

                    {isAtsOpen && (
                        <div className="mt-3 space-y-3">
                            <div className="grid grid-cols-3 gap-2 text-xs">
                                <div className="rounded-md bg-white/5 p-2">
                                    <p className="text-gray-500">Structure</p>
                                    <p className="mt-1 text-white">{atsAnalysis?.breakdown?.structure ?? '--'}/60</p>
                                </div>
                                <div className="rounded-md bg-white/5 p-2">
                                    <p className="text-gray-500">Content</p>
                                    <p className="mt-1 text-white">{atsAnalysis?.breakdown?.content ?? '--'}/25</p>
                                </div>
                                <div className="rounded-md bg-white/5 p-2">
                                    <p className="text-gray-500">ATS</p>
                                    <p className="mt-1 text-white">{atsAnalysis?.breakdown?.atsFriendly ?? '--'}/15</p>
                                </div>
                            </div>

                            {atsAnalysis?.missingSections?.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-gray-300">Missing sections</p>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {atsAnalysis.missingSections.map(section => (
                                            <span key={section} className="rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-300">
                                                {section}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {atsAnalysis?.suggestions?.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium text-gray-300">Top suggestions</p>
                                    <ul className="mt-2 space-y-1 text-xs text-gray-400">
                                        {atsAnalysis.suggestions.slice(0, 3).map(suggestion => (
                                            <li key={suggestion}>{suggestion}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {atsAnalysis?.matchedKeywords?.length > 0 && (
                                <p className="text-xs text-gray-400">
                                    Keywords matched: {atsAnalysis.matchedKeywords.slice(0, 6).join(', ')}
                                </p>
                            )}

                            <button
                                type="button"
                                onClick={() => setShowScoring(open => !open)}
                                className="text-xs font-medium text-blue-300 hover:text-blue-200"
                            >
                                How is this scored?
                            </button>
                            {showScoring && (
                                <ul className="space-y-1 text-xs text-gray-500">
                                    {(atsAnalysis?.howScored || [
                                        'Structure: 60 points across required resume sections.',
                                        'Content: 25 points for skills depth, projects, and experience bullets.',
                                        'ATS-friendly: 15 points for length, contact details, and LinkedIn/GitHub.'
                                    ]).map(item => (
                                        <li key={item}>{item}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="mt-auto pt-4 flex items-center gap-2">
                {document.file_url && (
                    <a
                        href={document.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors text-sm"
                    >
                        {document.is_external ? <FaLink size={14} /> : <FaDownload size={14} />}
                        <span>{document.is_external ? 'Open' : 'Download'}</span>
                    </a>
                )}
                <button
                    onClick={() => onEdit(document)}
                    className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors"
                    title="Edit"
                >
                    <FaEdit size={14} />
                </button>
                <button
                    onClick={() => onDelete(document)}
                    className="p-2 bg-white/5 text-gray-400 rounded-lg hover:bg-red-600/20 hover:text-red-400 transition-colors"
                    title="Delete"
                >
                    <FaTrash size={14} />
                </button>
            </div>
        </div>
    );
};

export default DocumentCard;
