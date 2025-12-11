'use client';

import React from 'react';
import { PrepaidConsultantSelection } from '../prepaid';

interface RepeatUserOfflineConsultantSelectionProps {
  centerId: string;
  onConsultantSelect: (consultantId: string) => void;
}

export default function RepeatUserOfflineConsultantSelection({
  centerId,
  onConsultantSelect,
}: RepeatUserOfflineConsultantSelectionProps) {
  return (
    <PrepaidConsultantSelection
      centerId={centerId}
      onConsultantSelect={onConsultantSelect}
    />
  );
}
