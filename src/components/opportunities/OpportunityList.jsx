import React from 'react';
import OpportunityCard from './OpportunityCard';

const OpportunityList = ({ opportunities, onEdit, onDelete }) => {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">No opportunities found</p>
        <p className="text-gray-500 text-sm mt-2">Add your first opportunity to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {opportunities.map((opportunity) => (
        <OpportunityCard
          key={opportunity.id}
          opportunity={opportunity}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default OpportunityList;
