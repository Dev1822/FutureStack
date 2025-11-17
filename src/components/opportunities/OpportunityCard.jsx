import React from 'react';
import { FaEdit, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';
import Card from '../common/Card';
import Button from '../common/Button';
import { getDaysRemaining, isOverdue, formatDate } from '../../utils/dateHelpers';

const OpportunityCard = ({ opportunity, onEdit, onDelete }) => {
  const daysRemaining = getDaysRemaining(opportunity.deadline);
  const overdue = isOverdue(opportunity.deadline);

  // Status badge colors
  const statusColors = {
    applied: 'bg-blue-100 text-blue-800',
    shortlisted: 'bg-yellow-100 text-yellow-800',
    interviewed: 'bg-purple-100 text-purple-800',
    selected: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
  };

  // Category badge colors
  const categoryColors = {
    internship: 'bg-indigo-100 text-indigo-800',
    hackathon: 'bg-pink-100 text-pink-800',
  };

  return (
    <Card hover className="p-4">
      <div className="flex flex-col h-full">
        {/* Header with badges */}
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex-1 mr-2">
            {opportunity.title}
          </h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              categoryColors[opportunity.category] || 'bg-gray-700 text-gray-300'
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
            className={`text-sm font-medium ${
              overdue ? 'text-red-400' : 'text-gray-300'
            }`}
          >
            {overdue ? `Overdue by ${Math.abs(daysRemaining)} days` : `${daysRemaining} days remaining`}
          </p>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              statusColors[opportunity.status] || 'bg-gray-700 text-gray-300'
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
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center mb-4"
          >
            <FaExternalLinkAlt className="mr-1" size={12} />
            View Opportunity
          </a>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 mt-auto">
          <Button
            variant="primary"
            onClick={() => onEdit(opportunity.id)}
            className="flex-1 flex items-center justify-center"
          >
            <FaEdit className="mr-1" />
            Edit
          </Button>
          <Button
            variant="danger"
            onClick={() => onDelete(opportunity.id)}
            className="flex-1 flex items-center justify-center"
          >
            <FaTrash className="mr-1" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default OpportunityCard;
