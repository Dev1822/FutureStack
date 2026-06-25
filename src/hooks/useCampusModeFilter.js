import { useCallback, useState } from 'react';
import { filterByCampusMode } from '../utils/opportunityHelpers';

const DEFAULT_FILTER = 'all';

/**
 * Shared campus-mode filter state for opportunity list pages.
 */
export function useCampusModeFilter(initialFilter = DEFAULT_FILTER) {
  const [campusModeFilter, setCampusModeFilter] = useState(initialFilter);

  const resetCampusModeFilter = useCallback(() => {
    setCampusModeFilter(initialFilter);
  }, [initialFilter]);

  const applyCampusModeFilter = useCallback(
    (opportunities) => filterByCampusMode(opportunities, campusModeFilter),
    [campusModeFilter]
  );

  return {
    campusModeFilter,
    setCampusModeFilter,
    resetCampusModeFilter,
    isCampusFilterActive: campusModeFilter !== DEFAULT_FILTER,
    applyCampusModeFilter,
  };
}
