// Documents page - main library view for all user documents
// Follows the same design patterns as InternshipList and other pages
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaFile, FaFilePdf, FaLink, FaEdit, FaTrash, FaDownload, FaBriefcase } from 'react-icons/fa';
import SEO from '../components/seo/SEO';

import { documentService } from '../services/api';
import DocumentUpload from '../components/documents/DocumentUpload';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';

const typeLabels = {
    resume: 'Resume',
    cover_letter: 'Cover Letter',
    portfolio: 'Portfolio',
    other: 'Other'
};

const typeIcons = {
    resume: FaFilePdf,
    cover_letter: FaFile,
    portfolio: FaLink,
    other: FaFile
};

const typeColors = {
    resume: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    cover_letter: 'bg-green-500/10 text-green-400 border border-green-500/20',
    portfolio: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    other: 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
};

const Documents = () => {
    const [documents, setDocuments] = useState([]);
    const [filteredDocuments, setFilteredDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [editDocument, setEditDocument] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Fetch documents
    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);
            const data = await documentService.getAll();
            setDocuments(data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    // Apply filters
    useEffect(() => {
        let filtered = [...documents];

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(doc =>
                doc.name.toLowerCase().includes(query) ||
                (doc.notes && doc.notes.toLowerCase().includes(query))
            );
        }

        if (typeFilter !== 'all') {
            filtered = filtered.filter(doc => doc.type === typeFilter);
        }

        setFilteredDocuments(filtered);
    }, [searchQuery, typeFilter, documents]);

    // Handle file upload
    const handleUpload = async (file, metadata) => {
        try {
            setActionLoading(true);
            await documentService.upload(file, metadata);
            toast.success('Document uploaded successfully!');
            setIsUploadOpen(false);
            fetchDocuments();
        } catch (error) {
            console.error('Error uploading document:', error);
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to upload document. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle external link creation
    const handleCreateExternal = async (data) => {
        try {
            setActionLoading(true);
            await documentService.create(data);
            toast.success('Link added successfully!');
            setIsUploadOpen(false);
            fetchDocuments();
        } catch (error) {
            console.error('Error creating document:', error);
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to add link. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle edit
    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editDocument) return;

        try {
            setActionLoading(true);
            await documentService.update(editDocument.id, {
                name: editDocument.name,
                type: editDocument.type,
                version: editDocument.version,
                notes: editDocument.notes
            });
            toast.success('Document updated!');
            setEditDocument(null);
            fetchDocuments();
        } catch (error) {
            console.error('Error updating document:', error);
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to update document. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    // Handle delete
    const confirmDelete = async () => {
        if (!deleteConfirm) return;

        try {
            setActionLoading(true);
            await documentService.delete(deleteConfirm.id);
            toast.success('Document deleted!');
            setDeleteConfirm(null);
            fetchDocuments();
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to delete document. Please try again.');
        } finally {
            setActionLoading(false);
        }
    };

    const clearFilters = () => {
        setSearchQuery('');
        setTypeFilter('all');
    };

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
        <div className="min-h-screen bg-black text-white p-4 sm:p-6">
            <SEO
                title="Documents"
                description="Manage your resumes, cover letters, and portfolio links"
                noindex={true}
            />
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Documents</h1>
                        <p className="text-sm sm:text-base text-gray-400">
                            Manage your resumes, cover letters, and portfolio links
                        </p>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setIsUploadOpen(true)}
                        className="flex items-center w-full sm:w-auto justify-center"
                    >
                        <FaPlus className="mr-2" />
                        Add Document
                    </Button>
                </div>

                {/* Search and Filter Bar */}
                <div className="bg-[#0A0A0A] rounded-xl p-4 mb-6 border border-white/10">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name or notes..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>

                        {/* Type Filter */}
                        <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="px-4 py-2.5 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-auto"
                            >
                                <option value="all" style={{ backgroundColor: '#111827', color: 'white' }}>All Types</option>
                                <option value="resume" style={{ backgroundColor: '#111827', color: 'white' }}>Resumes</option>
                                <option value="cover_letter" style={{ backgroundColor: '#111827', color: 'white' }}>Cover Letters</option>
                                <option value="portfolio" style={{ backgroundColor: '#111827', color: 'white' }}>Portfolio</option>
                                <option value="other" style={{ backgroundColor: '#111827', color: 'white' }}>Other</option>
                            </select>

                            {/* Clear Filters Button */}
                            {(searchQuery || typeFilter !== 'all') && (
                                <Button variant="secondary" onClick={clearFilters} className="w-full sm:w-auto">
                                    Clear
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Results Count + Storage Info */}
                    <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="text-sm text-gray-400">
                            Showing {filteredDocuments.length} of {documents.length} documents
                        </span>
                        <span className="text-sm text-gray-500">
                            {documents.length}/20 documents used • Max 5MB per file
                        </span>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                        <p className="text-gray-400">Loading documents...</p>
                    </div>
                ) : filteredDocuments.length > 0 ? (
                    /* Documents Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredDocuments.map(doc => {
                            const Icon = typeIcons[doc.type] || FaFile;
                            const usageCount = doc.opportunity_documents?.length || 0;

                            return (
                                <Card key={doc.id} hover className="p-5">
                                    <div className="flex flex-col h-full">
                                        {/* Header with icon and type badge */}
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center ${typeColors[doc.type]?.split(' ')[1] || 'text-gray-400'}`}>
                                                    <Icon size={20} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-lg font-semibold text-white truncate">{doc.name}</h3>
                                                    {doc.version && (
                                                        <span className="text-sm text-gray-500">{doc.version}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${typeColors[doc.type] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                                {typeLabels[doc.type] || 'Other'}
                                            </span>
                                        </div>

                                        {/* Metadata */}
                                        <div className="flex items-center gap-3 text-sm text-gray-400 mb-3">
                                            {doc.file_size && <span>{formatSize(doc.file_size)}</span>}
                                            <span>{formatDate(doc.created_at)}</span>
                                            {doc.is_external && (
                                                <span className="text-purple-400">External</span>
                                            )}
                                        </div>

                                        {/* Notes preview */}
                                        {doc.notes && (
                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{doc.notes}</p>
                                        )}

                                        {/* Usage badge */}
                                        {usageCount > 0 && (
                                            <div className="flex items-center gap-1.5 text-sm text-blue-400 mb-4">
                                                <FaBriefcase size={12} />
                                                <span>Used in {usageCount} {usageCount === 1 ? 'opportunity' : 'opportunities'}</span>
                                            </div>
                                        )}

                                        {/* Action Buttons */}
                                        <div className="flex gap-2 mt-auto pt-2">
                                            {doc.file_url && (
                                                <a
                                                    href={doc.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-1 px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black transform active:scale-95 flex items-center justify-center gap-2 text-sm bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500 hover:text-white hover:border-blue-500 shadow-lg shadow-blue-900/10 hover:shadow-blue-900/30 focus:ring-blue-500"
                                                >
                                                    {doc.is_external ? <FaLink size={14} /> : <FaDownload size={14} />}
                                                    {doc.is_external ? 'Open' : 'Download'}
                                                </a>
                                            )}
                                            <Button
                                                variant="secondary"
                                                onClick={() => setEditDocument(doc)}
                                                className="flex items-center justify-center text-sm"
                                            >
                                                <FaEdit size={14} />
                                            </Button>
                                            <Button
                                                variant="danger"
                                                onClick={() => setDeleteConfirm(doc)}
                                                className="flex items-center justify-center text-sm"
                                            >
                                                <FaTrash size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : documents.length > 0 ? (
                    <div className="text-center py-16 sm:py-20">
                        <FaSearch className="mx-auto h-16 w-16 text-gray-600 mb-4" />
                        <p className="text-gray-400 text-lg font-medium mb-2">No documents match your search</p>
                        <p className="text-gray-500 text-sm">Try adjusting your filters</p>
                    </div>
                ) : (
                    <div className="text-center py-16 sm:py-20">
                        <div className="mb-4">
                            <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <p className="text-gray-400 text-lg font-medium mb-2">No documents yet</p>
                        <p className="text-gray-500 text-sm mb-6">Upload your resumes, cover letters, and portfolio links</p>
                        <Button
                            variant="primary"
                            onClick={() => setIsUploadOpen(true)}
                        >
                            <FaPlus className="inline mr-2" />
                            Add Your First Document
                        </Button>
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <DocumentUpload
                isOpen={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                onUpload={handleUpload}
                onCreateExternal={handleCreateExternal}
                isLoading={actionLoading}
            />

            {/* Edit Modal */}
            <Modal
                isOpen={!!editDocument}
                onClose={() => setEditDocument(null)}
                title="Edit Document"
            >
                {editDocument && (
                    <form onSubmit={handleSaveEdit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">Name</label>
                            <input
                                type="text"
                                value={editDocument.name}
                                onChange={(e) => setEditDocument({ ...editDocument, name: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">Type</label>
                            <select
                                value={editDocument.type}
                                onChange={(e) => setEditDocument({ ...editDocument, type: e.target.value })}
                                className="w-full px-3 py-2.5 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="resume">Resume</option>
                                <option value="cover_letter">Cover Letter</option>
                                <option value="portfolio">Portfolio</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">Version</label>
                            <input
                                type="text"
                                value={editDocument.version || ''}
                                onChange={(e) => setEditDocument({ ...editDocument, version: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-200 mb-1">Notes</label>
                            <textarea
                                value={editDocument.notes || ''}
                                onChange={(e) => setEditDocument({ ...editDocument, notes: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setEditDocument(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={actionLoading}
                                className="flex-1"
                            >
                                {actionLoading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Confirm Delete"
            >
                {deleteConfirm && (
                    <div>
                        <p className="text-gray-300 mb-6">
                            Are you sure you want to delete <strong className="text-white">{deleteConfirm.name}</strong>? This action cannot be undone.
                            {deleteConfirm.opportunity_documents?.length > 0 && (
                                <span className="block mt-2 text-yellow-400">
                                    This document is linked to {deleteConfirm.opportunity_documents.length} opportunity(s).
                                </span>
                            )}
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </Button>
                            <Button variant="danger" onClick={confirmDelete} disabled={actionLoading}>
                                {actionLoading ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default Documents;
