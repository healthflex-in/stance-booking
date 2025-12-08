'use client';

import React from 'react';
import { PrepaidSlotSelection } from '../prepaid';

interface NewUserOnlineSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  onSlotSelect: (consultantId: string, slot: any) => void;
}

export default function NewUserOnlineSlotSelection({
  centerId,
  serviceDuration,
  onSlotSelect,
}: NewUserOnlineSlotSelectionProps) {
  return (
    <PrepaidSlotSelection
      centerId={centerId}
      serviceDuration={serviceDuration}
      onSlotSelect={onSlotSelect}
      onBack={() => {}}
    />
  );
}
