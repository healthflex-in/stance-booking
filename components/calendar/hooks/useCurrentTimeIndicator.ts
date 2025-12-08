import React from 'react';

import { timeSlots } from '@/utils/standard-utils';

/**
 * Custom hook that calculates the current time position for the time indicator
 * Returns the slot index and percentage position within that slot
 */
export function useCurrentTimeIndicator() {
  return React.useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();

    const currentSlotIndex = timeSlots.findIndex((time) => {
      const [slotHour] = time.split(':').map(Number);
      return currentHour === slotHour;
    });

    if (currentSlotIndex === -1) return null;

    const percentage = (currentMinutes / 60) * 100;

    return { slotIndex: currentSlotIndex, percentage };
  }, []);
}
