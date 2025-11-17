import React from 'react';
import { formatDate } from '../../utils/dateHelpers';

const StatusCard = ({ opportunity, onStatusChange }) => {
  const categoryColors = {
    internship: 'bg-indigo-100 text-indigo-800',
    hackathon: 'bg-pink-100 text-pink-800',
  };

  const handleStatusChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus !== opportunity.status) {
      onStatusChange(opportunity.id, newStatus);
    }
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-md p-4 mb-3 hover:shadow-lg hover:border-gray-600 transition-all">
      {/* Title */}
      <h4 className="font-semibold text-white mb-2">{opportunity.title}</h4>

      {/* Category Badge */}
      <span
        className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${
          categoryColors[opportunity.category] || 'bg-gray-700 text-gray-300'
        }`}
      >
        {opportunity.category}
      </span>

      {/* Deadline */}
      <p className="text-sm text-gray-400 mb-3">
        <span className="font-medium">Deadline:</span> {formatDate(opportunity.deadline)}
      </p>

      {/* Status Dropdown */}
      <div>
        <label htmlFor={`status-${opportunity.id}`} className="block text-xs text-gray-400 mb-1">
          Update Status
        </label>
        <select
          id={`status-${opportunity.id}`}
          value={opportunity.status}
          onChange={handleStatusChange}
          className="w-full px-2 py-1 text-sm bg-gray-700 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="applied">Applied</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interviewed">Interviewed</option>
          <option value="selected">Selected</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
    </div>
  );
};

export default StatusCard;
