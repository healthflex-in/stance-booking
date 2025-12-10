'use client';

import React from 'react';
import { PrepaidSlotSelection } from '../prepaid';

interface RepeatUserIncenterSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack?: () => void;
}

export default function RepeatUserIncenterSlotSelection({
  centerId,
  serviceDuration,
  onSlotSelect,
  onBack = () => {},
}: RepeatUserIncenterSlotSelectionProps) {
  return (
    <PrepaidSlotSelection
      centerId={centerId}
      serviceDuration={serviceDuration}
      onSlotSelect={onSlotSelect}
      onBack={onBack}
    />
  );
}
