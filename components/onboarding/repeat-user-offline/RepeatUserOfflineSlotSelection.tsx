'use client';

import React from 'react';
import { PrepaidSlotSelection } from '../prepaid';

interface RepeatUserOfflineSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack?: () => void;
}

export default function RepeatUserOfflineSlotSelection({
  centerId,
  serviceDuration,
  onSlotSelect,
  onBack = () => {},
}: RepeatUserOfflineSlotSelectionProps) {
  return (
    <PrepaidSlotSelection
      centerId={centerId}
      serviceDuration={serviceDuration}
      onSlotSelect={onSlotSelect}
      onBack={onBack}
    />
  );
}
