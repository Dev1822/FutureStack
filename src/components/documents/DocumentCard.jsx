// DocumentCard - displays a single document with its details and actions
import React from 'react';
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

const DocumentCard = ({ document, onEdit, onDelete }) => {
    const Icon = typeIcons[document.type] || FaFile;
    const colorClass = typeColors[document.type] || 'text-gray-400';

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
                    <h3 className="text-white font-medium truncate">{document.name}</h3>
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
