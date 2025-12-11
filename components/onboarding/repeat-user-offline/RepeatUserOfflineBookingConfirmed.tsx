'use client';

import React from 'react';
import { PrepaidBookingConfirmed } from '../prepaid';

interface RepeatUserOfflineBookingConfirmedProps {
  bookingData: any;
}

export default function RepeatUserOfflineBookingConfirmed({ bookingData }: RepeatUserOfflineBookingConfirmedProps) {
  return <PrepaidBookingConfirmed bookingData={bookingData} />;
}
