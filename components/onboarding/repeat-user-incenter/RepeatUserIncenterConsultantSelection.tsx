'use client';

import React from 'react';
import { PrepaidConsultantSelection } from '../prepaid';

interface RepeatUserIncenterConsultantSelectionProps {
  centerId: string;
  onConsultantSelect: (consultantId: string) => void;
}

export default function RepeatUserIncenterConsultantSelection({
  centerId,
  onConsultantSelect,
}: RepeatUserIncenterConsultantSelectionProps) {
  return (
    <PrepaidConsultantSelection
      centerId={centerId}
      onConsultantSelect={onConsultantSelect}
    />
  );
}
