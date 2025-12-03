// Generic grid component to render a collection of opportunities
// - Keeps empty state UX in one place
// - Delegates per-item rendering to OpportunityCard
import React from 'react';
import OpportunityCard from './OpportunityCard';

// opportunities: array of opportunity objects to display
// onEdit, onDelete: callback functions passed down to each card
const OpportunityList = ({ opportunities, onEdit, onDelete }) => {
  if (!opportunities || opportunities.length === 0) {
    return (
      <div className="text-center py-16 sm:py-20">
        <div className="mb-4">
          <svg className="mx-auto h-16 w-16 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-lg font-medium mb-2">No opportunities found</p>
        <p className="text-gray-500 text-sm">Add your first opportunity to get started!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
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
