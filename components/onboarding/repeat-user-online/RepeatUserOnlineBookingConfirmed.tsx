'use client';

import React, { useEffect } from 'react';
import { PrepaidBookingConfirmed } from '../prepaid';
import { BookingAnalytics } from '@/services/booking-analytics';

interface RepeatUserOnlineBookingConfirmedProps {
  bookingData: any;
  analytics: BookingAnalytics;
}

export default function RepeatUserOnlineBookingConfirmed({ bookingData, analytics }: RepeatUserOnlineBookingConfirmedProps) {
  useEffect(() => {
    // Track booking completion
    if (bookingData.appointmentId) {
      analytics.trackBookingComplete(
        bookingData.appointmentId,
        bookingData.patientId,
        bookingData.consultantId,
        bookingData.centerId
      );
    }
  }, [bookingData, analytics]);

  return <PrepaidBookingConfirmed bookingData={{ ...bookingData, isNewUser: false, sessionType: 'online' }} analytics={analytics} />;
}
