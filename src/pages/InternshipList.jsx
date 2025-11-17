import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaSearch, FaPlus } from 'react-icons/fa';
import OpportunityList from '../components/opportunities/OpportunityList';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import { opportunityService } from '../services/api';

const InternshipList = () => {
  const navigate = useNavigate();
  const [opportunities, setOpportunities] = useState([]);
  const [filteredOpportunities, setFilteredOpportunities] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [opportunityToDelete, setOpportunityToDelete] = useState(null);

  // Fetch opportunities on mount
  useEffect(() => {
    fetchOpportunities();
  }, []);

  // Apply filters whenever search query, status filter, or opportunities change
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, statusFilter, opportunities]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const response = await opportunityService.getAll();
      // Filter for internships only
      const internships = response.filter(
        (opp) => opp.category === 'internship'
      );
      setOpportunities(internships);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Failed to load internships. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...opportunities];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (opp) =>
          opp.title.toLowerCase().includes(query) ||
          (opp.description && opp.description.toLowerCase().includes(query))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((opp) => opp.status === statusFilter);
    }

    setFilteredOpportunities(filtered);
  };

  const handleEdit = (id) => {
    navigate(`/edit/${id}`);
  };

  const handleDeleteClick = (id) => {
    setOpportunityToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!opportunityToDelete) return;

    try {
      await opportunityService.delete(opportunityToDelete);
      setOpportunities((prev) =>
        prev.filter((opp) => opp.id !== opportunityToDelete)
      );
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

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6">
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
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-col sm:flex-row w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-auto"
              >
                <option value="all">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewed">Interviewed</option>
                <option value="selected">Selected</option>
                <option value="rejected">Rejected</option>
              </select>

              {/* Clear Filters Button */}
              {(searchQuery || statusFilter !== 'all') && (
                <Button variant="secondary" onClick={clearFilters} className="w-full sm:w-auto">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-3 text-sm text-gray-400">
            Showing {filteredOpportunities.length} of {opportunities.length}{' '}
            internships
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-400">Loading internships...</p>
          </div>
        ) : (
          /* Opportunity List */
          <OpportunityList
            opportunities={filteredOpportunities}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={handleDeleteCancel}
          title="Confirm Delete"
        >
          <div>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this internship? This action cannot
              be undone.
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
      </div>
    </div>
  );
};

export default InternshipList;
