'use client';

import React from 'react';
import { PrepaidSlotSelection } from '../prepaid';

interface RepeatUserIncenterSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  onSlotSelect: (consultantId: string, slot: any) => void;
}

export default function RepeatUserIncenterSlotSelection({
  centerId,
  serviceDuration,
  onSlotSelect,
}: RepeatUserIncenterSlotSelectionProps) {
  return (
    <PrepaidSlotSelection
      centerId={centerId}
      serviceDuration={serviceDuration}
      onSlotSelect={onSlotSelect}
      onBack={() => {}}
    />
  );
}
