import { useMemo } from 'react';
import { BookingAnalytics, createBookingAnalytics, BookingFlowType } from '@/services/booking-analytics';

export function useBookingAnalytics(flowType: BookingFlowType): BookingAnalytics {
  const analytics = useMemo(() => createBookingAnalytics(flowType), [flowType]);
  return analytics;
}
