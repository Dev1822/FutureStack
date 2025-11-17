import React from 'react';
import StatusCard from './StatusCard';

const StatusColumn = ({ status, opportunities, onStatusChange }) => {
  // Status display configuration
  const statusConfig = {
    applied: {
      title: 'Applied',
      color: 'bg-blue-100 border-blue-500',
      headerColor: 'bg-blue-600',
    },
    shortlisted: {
      title: 'Shortlisted',
      color: 'bg-yellow-100 border-yellow-500',
      headerColor: 'bg-yellow-500',
    },
    interviewed: {
      title: 'Interviewed',
      color: 'bg-purple-100 border-purple-500',
      headerColor: 'bg-purple-600',
    },
    selected: {
      title: 'Selected',
      color: 'bg-green-100 border-green-500',
      headerColor: 'bg-green-600',
    },
    rejected: {
      title: 'Rejected',
      color: 'bg-red-100 border-red-500',
      headerColor: 'bg-red-600',
    },
  };

  const config = statusConfig[status] || {
    title: status,
    color: 'bg-gray-100 border-gray-500',
    headerColor: 'bg-gray-600',
  };

  const count = opportunities.length;

  return (
    <div className="flex-shrink-0 w-80">
      {/* Column Header */}
      <div className={`${config.headerColor} text-white rounded-t-lg p-4`}>
        <h3 className="font-semibold text-lg flex items-center justify-between">
          <span>{config.title}</span>
          <span className="bg-white bg-opacity-30 px-2 py-1 rounded-full text-sm">
            {count}
          </span>
        </h3>
      </div>

      {/* Column Content */}
      <div className={`${config.color} border-2 border-t-0 rounded-b-lg p-4 min-h-[400px] max-h-[600px] overflow-y-auto bg-opacity-10`}>
        {opportunities.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No opportunities</p>
        ) : (
          opportunities.map((opportunity) => (
            <StatusCard
              key={opportunity.id}
              opportunity={opportunity}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default StatusColumn;
