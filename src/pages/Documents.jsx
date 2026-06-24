// Documents page - main library view for all user documents
// Follows the same design patterns as InternshipList and other pages
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch } from 'react-icons/fa';
import SEO from '../components/seo/SEO';

import { documentService } from '../services/api';
import DocumentUpload from '../components/documents/DocumentUpload';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import DocumentCard from '../components/documents/DocumentCard';
import {
    analyzeFileFromUrl,
    getAtsAnalysisErrorMessage,
    inferResumeFileName,
    isAtsEligible
} from '../utils/atsScorer';




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
    const [checkingAtsId, setCheckingAtsId] = useState(null);

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
            const { ats_score, ats_analyzed_at, ats_analysis, ...uploadMetadata } = metadata;
            const uploadedDocument = await documentService.upload(file, uploadMetadata);

            if (ats_score !== undefined && uploadedDocument?.id) {
                await documentService.update(uploadedDocument.id, {
                    ats_score,
                    ats_analyzed_at,
                    ats_analysis
                });
            }
            toast.success('Document uploaded successfully!');
            setIsUploadOpen(false);
            fetchDocuments();
            return true;
        } catch (error) {
            console.error('Error uploading document:', error);
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to upload document. Please try again.');
            return false;
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
            return true;
        } catch (error) {
            console.error('Error creating document:', error);
            toast.error(error.response?.data?.message || error.response?.data?.error || 'Failed to add link. Please try again.');
            return false;
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

    // Handle ATS re-check for existing uploaded resumes
    const handleCheckAts = async (document) => {
        if (!isAtsEligible(document)) return;

        try {
            setCheckingAtsId(document.id);
            const analysis = await analyzeFileFromUrl(
                document.file_url,
                inferResumeFileName(document)
            );
            const updated = await documentService.update(document.id, {
                ats_score: analysis.score,
                ats_analyzed_at: new Date().toISOString(),
                ats_analysis: analysis
            });

            setDocuments(prev => prev.map(doc => (
                doc.id === document.id
                    ? { ...doc, ...updated, file_url: doc.file_url }
                    : doc
            )));
            toast.success(document.ats_score != null ? 'ATS score refreshed!' : 'ATS analysis complete!');
        } catch (error) {
            console.error('Error checking ATS score:', error);
            toast.error(getAtsAnalysisErrorMessage(error));
        } finally {
            setCheckingAtsId(null);
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
                        {filteredDocuments.map(doc => (
                            <DocumentCard
                                key={doc.id}
                                document={doc}
                                onEdit={setEditDocument}
                                onDelete={setDeleteConfirm}
                                onCheckAts={handleCheckAts}
                                isCheckingAts={checkingAtsId === doc.id}
                            />
                        ))}
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
