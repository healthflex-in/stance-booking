'use client';

import React from 'react';
import { PrepaidSlotSelection } from '../prepaid';

interface NewUserOfflineSlotSelectionProps {
  centerId: string;
  serviceDuration: number;
  onSlotSelect: (consultantId: string, slot: any) => void;
  onBack?: () => void;
}

export default function NewUserOfflineSlotSelection({
  centerId,
  serviceDuration,
  onSlotSelect,
  onBack = () => {},
}: NewUserOfflineSlotSelectionProps) {
  return (
    <PrepaidSlotSelection
      centerId={centerId}
      serviceDuration={serviceDuration}
      onSlotSelect={onSlotSelect}
      onBack={onBack}
    />
  );
}
