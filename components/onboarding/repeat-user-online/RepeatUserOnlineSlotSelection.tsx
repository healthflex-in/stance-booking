'use client';

import React from 'react';
import { PrepaidSlotSelection } from '../prepaid';

interface RepeatUserOnlineSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack?: () => void;
}

export default function RepeatUserOnlineSlotSelection({
  centerId,
  serviceDuration,
  onSlotSelect,
  onBack = () => {},
}: RepeatUserOnlineSlotSelectionProps) {
  return (
    <PrepaidSlotSelection
      centerId={centerId}
      serviceDuration={serviceDuration}
      onSlotSelect={onSlotSelect}
      onBack={onBack}
    />
  );
}
