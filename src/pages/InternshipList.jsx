/**
 * InternshipList - Page showing internship-type opportunities
 * 
 * Features:
 * - Loads all opportunities from API and filters by category === 'internship'
 * - Client-side search and status filtering
 * - OpportunityDetailModal for viewing full details
 * - Delete confirmation modal
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSearch, FaPlus } from 'react-icons/fa';
import SEO from '../components/seo/SEO';
import OpportunityList from '../components/opportunities/OpportunityList';
import OpportunityDetailModal from '../components/opportunities/OpportunityDetailModal';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import ShareProgressModal from '../components/sharing/ShareProgressModal';
import { opportunityService } from '../services/api';
import { isActiveInternshipStatus } from '../utils/opportunityHelpers';

const InternshipList = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [opportunityToShare, setOpportunityToShare] = useState(null);

  // Fetch opportunities on mount
  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Apply filters when data or filters change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, opportunities]);

  /**
   * Fetch all opportunities and filter for internships only
   */
  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await opportunityService.getAll();
      const internships = response.filter(opp => opp.category === 'internship');
      setOpportunities(internships);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Failed to load internships. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply search and status filters
   */
  const applyFilters = () => {
    let filtered = [...opportunities];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        opp =>
          opp.title.toLowerCase().includes(query) ||
          (opp.description && opp.description.toLowerCase().includes(query))
      );
    }

    if (statusFilter === 'active') {
      filtered = filtered.filter((opp) => isActiveInternshipStatus(opp.status));
    } else if (statusFilter !== 'all') {
      filtered = filtered.filter(opp => opp.status === statusFilter);
    }

    setFilteredOpportunities(filtered);
  };

  // View handlers
  const handleView = (opportunity) => {
    setSelectedOpportunity(opportunity);
  };

  const handleCloseDetail = () => {
    setSelectedOpportunity(null);
  };

  const handleOpportunityUpdated = (updatedOpportunity) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === updatedOpportunity.id ? updatedOpportunity : opp))
    );

    if (!isActiveInternshipStatus(updatedOpportunity.status)) {
      setSelectedOpportunity(null);
      if (updatedOpportunity.status === 'rejected') {
        toast.info('Internship marked as rejected and removed from your active list.');
      }
      return;
    }

    setSelectedOpportunity(updatedOpportunity);
  };

  // Edit handler - closes detail modal and navigates to edit page
  const handleEdit = (id) => {
    setSelectedOpportunity(null);
    navigate(`/edit/${id}`);
  };

  // Prep handler - closes detail modal and navigates to prep page
  const handlePrep = (id) => {
    setSelectedOpportunity(null);
    navigate(`/internships/${id}/prep`);
  };

  // Delete handlers
  const handleDeleteClick = (id) => {
    setSelectedOpportunity(null);
    setOpportunityToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!opportunityToDelete) return;

    try {
      await opportunityService.delete(opportunityToDelete);
      setOpportunities(prev => prev.filter(opp => opp.id !== opportunityToDelete));
      toast.success('Internship deleted successfully!');
      setDeleteModalOpen(false);
      setOpportunityToDelete(null);
    } catch (error) {
      console.error('Error deleting opportunity:', error);
      toast.error('Failed to delete internship. Please try again.');
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setOpportunityToDelete(null);
  };

  const handleShareClick = (opportunity) => {
    setSelectedOpportunity(null);
    setOpportunityToShare(opportunity);
    setShareModalOpen(true);
  };

  const handleShareClose = () => {
    setShareModalOpen(false);
    setOpportunityToShare(null);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('active');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6">
      <SEO
        title="Internships"
        description="Track and manage your internship applications. Filter by status, search opportunities, and keep your job search organized."
        canonical="/internships"
        noindex={true}
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Internships</h1>
            <p className="text-sm sm:text-base text-gray-400">
              Manage and track your internship applications
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate('/add')}
            className="flex items-center w-full sm:w-auto justify-center"
          >
            <FaPlus className="mr-2" />
            Add New
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
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-auto"
              >
                <option value="active" style={{ backgroundColor: '#111827', color: 'white' }}>Active</option>
                <option value="all" style={{ backgroundColor: '#111827', color: 'white' }}>All Statuses</option>
                <option value="applied" style={{ backgroundColor: '#111827', color: 'white' }}>Applied</option>
                <option value="shortlisted" style={{ backgroundColor: '#111827', color: 'white' }}>Shortlisted</option>
                <option value="interviewed" style={{ backgroundColor: '#111827', color: 'white' }}>Interviewed</option>
                <option value="selected" style={{ backgroundColor: '#111827', color: 'white' }}>Selected</option>
                <option value="rejected" style={{ backgroundColor: '#111827', color: 'white' }}>Rejected</option>
                <option value="ghosted" style={{ backgroundColor: '#111827', color: 'white' }}>Ghosted</option>
              </select>

              {(searchQuery || statusFilter !== 'active') && (
                <Button variant="secondary" onClick={clearFilters} className="w-full sm:w-auto">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-400">
            Showing {filteredOpportunities.length} of {opportunities.length} internships
            {statusFilter === 'active' && ' (active only)'}
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading internships...</p>
          </div>
        ) : (
          <OpportunityList
            opportunities={filteredOpportunities}
            onView={handleView}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
            onShare={handleShareClick}
          />
        )}

        {/* Opportunity Detail Modal */}
        <OpportunityDetailModal
          opportunity={selectedOpportunity}
          isOpen={!!selectedOpportunity}
          onClose={handleCloseDetail}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onPrep={handlePrep}
          onOpportunityUpdated={handleOpportunityUpdated}
        />

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={handleDeleteCancel}
          title="Confirm Delete"
        >
          <div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this internship? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={handleDeleteCancel}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </div>
          </div>
        </Modal>

        <ShareProgressModal
          isOpen={shareModalOpen}
          onClose={handleShareClose}
          opportunities={opportunities}
          preselectedOpportunity={opportunityToShare}
        />
      </div>
    </div>
  );
};

export default InternshipList;
