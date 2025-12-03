// Small presentational component responsible for displaying a single opportunity
// - Shows title, category, status, deadline, description and external link
// - Parent controls edit/delete behaviour via onEdit / onDelete callbacks
import React from 'react';
import { FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import Card from '../common/Card';
import Button from '../common/Button';
import { getDaysRemaining, isOverdue, formatDate } from '../../utils/dateHelpers';

// opportunity: full opportunity object (id, title, deadline, status, etc.)
// onEdit: function called with opportunity.id when user clicks Edit
// onDelete: function called with opportunity.id when user clicks Delete
const OpportunityCard = ({ opportunity, onEdit, onDelete }) => {
  // Derived information based on deadline, reused from shared date helper utils
  const daysRemaining = getDaysRemaining(opportunity.deadline);
  const overdue = isOverdue(opportunity.deadline);

  // Status badge colors
  const statusColors = {
    applied: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    shortlisted: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    interviewed: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    selected: 'bg-green-500/10 text-green-400 border border-green-500/20',
    rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  // Category badge colors
  const categoryColors = {
    internship: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    hackathon: 'bg-pink-500/10 text-pink-400 border border-pink-500/20',
  };

  return (
    <Card hover className="p-5">
      <div className="flex flex-col h-full">
        {/* Header with badges */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex-1 mr-2 hover:text-blue-400 transition-colors">
            {opportunity.title}
          </h3>
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${categoryColors[opportunity.category] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}
          >
            {opportunity.category}
          </span>
        </div>

        {/* Description */}
        {opportunity.description && (
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {opportunity.description}
          </p>
        )}

        {/* Deadline */}
        <div className="mb-3">
          <p className="text-sm text-gray-400">
            Deadline: <span className="font-medium text-gray-300">{formatDate(opportunity.deadline)}</span>
          </p>
          <p
            className={`text-sm font-medium ${overdue ? 'text-red-400' : 'text-gray-300'
              }`}
          >
            {overdue ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days remaining`}
          </p>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${statusColors[opportunity.status] || 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
              }`}
          >
            {opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
          </span>
        </div>

        {/* Link */}
        {opportunity.link && (
          <a
            href={opportunity.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 hover:underline text-sm flex items-center mb-4 transition-all"
          >
            <FaExternalLinkAlt className="mr-1.5" size={12} />
            View Opportunity
          </a>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto pt-2">
          <Button
            variant="primary"
            onClick={() => onEdit(opportunity.id)}
            className="flex-1 flex items-center justify-center text-sm"
          >
            <FaEdit className="mr-1.5" size={14} />
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={() => onDelete(opportunity.id)}
            className="flex-1 flex items-center justify-center text-sm"
          >
            <FaTrash className="mr-1.5" size={14} />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default OpportunityCard;
