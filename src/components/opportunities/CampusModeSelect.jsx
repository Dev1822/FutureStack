import React from 'react';
import { CAMPUS_MODE_FILTER_OPTIONS } from '../../utils/opportunityHelpers';

const selectClassName =
  'px-4 py-2.5 bg-gray-900 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all w-full sm:w-auto';

const CampusModeSelect = ({ value, onChange, className = selectClassName }) => (
  <select
    value={value}
    onChange={onChange}
    className={className}
    aria-label="Filter by campus type"
  >
    {CAMPUS_MODE_FILTER_OPTIONS.map((option) => (
      <option
        key={option.value}
        value={option.value}
        style={{ backgroundColor: '#111827', color: 'white' }}
      >
        {option.label}
      </option>
    ))}
  </select>
);

export default CampusModeSelect;
