'use client';

import React from 'react';
import { PrepaidBookingConfirmed } from '../prepaid';

interface RepeatUserOnlineBookingConfirmedProps {
  bookingData: any;
}

export default function RepeatUserOnlineBookingConfirmed({ bookingData }: RepeatUserOnlineBookingConfirmedProps) {
  return <PrepaidBookingConfirmed bookingData={{ ...bookingData, isNewUser: false }} />;
}
