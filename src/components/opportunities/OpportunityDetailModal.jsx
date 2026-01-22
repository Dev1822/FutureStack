/**
 * OpportunityDetailModal - Slide-out drawer showing full opportunity details
 * 
 * Features:
 * - Spacious layout with clear visual sections
 * - Full content display (no truncation)
 * - Attached documents for internships
 * - Fixed footer with Edit/Delete actions
 * - Responsive: drawer layout on all devices
 */
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
    FaTimes,
    FaEdit,
    FaTrash,
    FaExternalLinkAlt,
    FaCalendarAlt,
    FaFileAlt,
    FaStickyNote,
    FaFilePdf,
    FaLink,
    FaFile,
    FaDownload
} from 'react-icons/fa';
import Button from '../common/Button';
import { getDaysRemaining, isOverdue, formatDate } from '../../utils/dateHelpers';
import { supportsDocuments } from '../../utils/opportunityHelpers';
import { documentService } from '../../services/api';

// Status badge color mappings
const statusColors = {
    applied: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    shortlisted: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    interviewed: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    selected: 'bg-green-500/10 text-green-400 border border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

// Category badge color mappings
const categoryColors = {
    internship: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    hackathon: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
};

// Document type icons and colors
const documentTypeConfig = {
    resume: { icon: FaFilePdf, color: 'text-blue-400' },
    cover_letter: { icon: FaFileAlt, color: 'text-green-400' },
    portfolio: { icon: FaLink, color: 'text-purple-400' },
    other: { icon: FaFile, color: 'text-gray-400' }
};

/**
 * @param {Object} props
 * @param {Object} props.opportunity - The opportunity object to display
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Callback when modal is closed
 * @param {Function} props.onEdit - Callback when Edit is clicked (receives opportunity.id)
 * @param {Function} props.onDelete - Callback when Delete is clicked (receives opportunity.id)
 */
const OpportunityDetailModal = ({ opportunity, isOpen, onClose, onEdit, onDelete }) => {
    const [documents, setDocuments] = useState([]);
    const [loadingDocs, setLoadingDocs] = useState(false);

    // Fetch attached documents for internships
    useEffect(() => {
        if (isOpen && supportsDocuments(opportunity?.category) && opportunity?.id) {
            const fetchDocs = async () => {
                try {
                    setLoadingDocs(true);
                    const docs = await documentService.getByOpportunity(opportunity.id);
                    setDocuments(docs);
                } catch (error) {
                    console.error('Error fetching documents:', error);
                    setDocuments([]);
                    toast.error('Failed to load attached documents');
                } finally {
                    setLoadingDocs(false);
                }
            };
            fetchDocs();
        } else {
            setDocuments([]);
        }
    }, [isOpen, opportunity?.id, opportunity?.category]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !opportunity) return null;

    const daysRemaining = getDaysRemaining(opportunity.deadline);
    const overdue = isOverdue(opportunity.deadline);

    return (
        <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer Panel - slides in from right */}
            <div className="fixed inset-y-0 right-0 w-full sm:max-w-lg flex">
                <div className="relative w-full bg-[#0A0A0A] shadow-2xl flex flex-col border-l border-white/10">

                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-white/10">
                        <div className="flex-1 pr-4">
                            <h2 className="text-xl font-bold text-white mb-3">
                                {opportunity.title}
                            </h2>
                            <div className="flex flex-wrap gap-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${categoryColors[opportunity.category] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                    {opportunity.category.charAt(0).toUpperCase() + opportunity.category.slice(1)}
                                </span>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[opportunity.status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                    {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            aria-label="Close"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">

                        {/* Deadline Section */}
                        <section>
                            <div className="flex items-center gap-2 text-gray-400 mb-2">
                                <FaCalendarAlt size={14} />
                                <h3 className="text-sm font-medium uppercase tracking-wide">Deadline</h3>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <p className="text-white font-medium">
                                    {formatDate(opportunity.deadline)}
                                </p>
                                <p className={`text-sm mt-1 ${overdue ? 'text-red-400' : 'text-gray-400'}`}>
                                    {overdue
                                        ? `Overdue by ${Math.abs(daysRemaining)} days`
                                        : `${daysRemaining} days remaining`
                                    }
                                </p>
                            </div>
                        </section>

                        {/* Description Section */}
                        {opportunity.description && (
                            <section>
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <FaFileAlt size={14} />
                                    <h3 className="text-sm font-medium uppercase tracking-wide">Description</h3>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {opportunity.description}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* Attached Documents Section (Internships only) */}
                        {supportsDocuments(opportunity.category) && (
                            <section>
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <FaFilePdf size={14} />
                                    <h3 className="text-sm font-medium uppercase tracking-wide">Attached Documents</h3>
                                </div>
                                <div className="bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                                    {loadingDocs ? (
                                        <div className="p-4 text-center text-gray-500">
                                            <span className="animate-spin inline-block mr-2">⟳</span>
                                            Loading documents...
                                        </div>
                                    ) : documents.length > 0 ? (
                                        <div className="divide-y divide-white/10">
                                            {documents.map((doc) => {
                                                const config = documentTypeConfig[doc.type] || documentTypeConfig.other;
                                                const Icon = config.icon;
                                                return (
                                                    <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <Icon className={config.color} size={18} />
                                                            <div>
                                                                <p className="text-white text-sm font-medium">{doc.name}</p>
                                                                {doc.version && (
                                                                    <p className="text-gray-500 text-xs">{doc.version}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {doc.file_url && (
                                                            <a
                                                                href={doc.file_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm"
                                                            >
                                                                {doc.is_external ? <FaLink size={12} /> : <FaDownload size={12} />}
                                                                {doc.is_external ? 'Open' : 'Download'}
                                                            </a>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            No documents attached
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Notes Section */}
                        {opportunity.notes && (
                            <section>
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <FaStickyNote size={14} />
                                    <h3 className="text-sm font-medium uppercase tracking-wide">Notes</h3>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                                        {opportunity.notes}
                                    </p>
                                </div>
                            </section>
                        )}

                        {/* External Link Section */}
                        {opportunity.link && (
                            <section>
                                <div className="flex items-center gap-2 text-gray-400 mb-2">
                                    <FaExternalLinkAlt size={14} />
                                    <h3 className="text-sm font-medium uppercase tracking-wide">Application Link</h3>
                                </div>
                                <a
                                    href={opportunity.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-white/5 border border-white/10 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-white/10 transition-all"
                                >
                                    <FaExternalLinkAlt size={14} />
                                    Open Job Posting
                                </a>
                            </section>
                        )}
                    </div>

                    {/* Fixed Footer with Actions */}
                    <div className="p-6 border-t border-white/10 bg-[#0A0A0A]">
                        <div className="flex gap-3">
                            <Button
                                variant="primary"
                                onClick={() => onEdit(opportunity.id)}
                                className="flex-1"
                            >
                                <FaEdit className="mr-2" size={14} />
                                Edit
                            </Button>
                            <Button
                                variant="danger"
                                onClick={() => onDelete(opportunity.id)}
                                className="flex-1"
                            >
                                <FaTrash className="mr-2" size={14} />
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OpportunityDetailModal;
