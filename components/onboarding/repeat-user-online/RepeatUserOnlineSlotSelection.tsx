'use client';

import React from 'react';
import { PrepaidSlotSelection } from '../prepaid';

interface RepeatUserOnlineSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  designation?: string;
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack?: () => void;
}

export default function RepeatUserOnlineSlotSelection({
  centerId,
  serviceDuration,
  designation,
  onSlotSelect,
  onBack = () => {},
}: RepeatUserOnlineSlotSelectionProps) {
  return (
    <PrepaidSlotSelection
      centerId={centerId}
      serviceDuration={serviceDuration}
      designation={designation}
      isNewUser={false}
      useCenter={true}
      onSlotSelect={onSlotSelect}
      onBack={onBack}
    />
  );
}
