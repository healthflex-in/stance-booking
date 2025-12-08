import React from 'react';

/**
 * Hook for calculating date ranges for calendar views
 * Centralizes the logic for determining start/end dates based on view mode
 */
export function useDateRange(currentDate: Date, viewMode: 'day' | 'week') {
  return React.useMemo(() => {
    const startDate = new Date(currentDate);
    // Reset time and adjust for local timezone
    startDate.setHours(0, 0, 0, 0);

    if (viewMode === 'week') {
      startDate.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Set to Monday
    } else {
      // For day view, use the current date directly
      startDate.setDate(currentDate.getDate());
    }

    const endDate = new Date(startDate);
    if (viewMode === 'week') {
      endDate.setDate(startDate.getDate() + 6); // Set to Sunday
      endDate.setHours(23, 59, 59, 999);
    } else {
      // For day view, set end date to end of the same day
      endDate.setDate(startDate.getDate());
      endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
  }, [currentDate, viewMode]);
}
