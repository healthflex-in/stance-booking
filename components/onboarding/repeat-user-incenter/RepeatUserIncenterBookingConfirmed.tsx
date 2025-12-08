'use client';

import React from 'react';
import { PrepaidBookingConfirmed } from '../prepaid';

interface RepeatUserIncenterBookingConfirmedProps {
  bookingData: any;
}

export default function RepeatUserIncenterBookingConfirmed({ bookingData }: RepeatUserIncenterBookingConfirmedProps) {
  return <PrepaidBookingConfirmed bookingData={bookingData} />;
}
