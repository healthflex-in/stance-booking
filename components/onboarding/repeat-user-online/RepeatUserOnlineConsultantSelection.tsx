'use client';

import React from 'react';
import { PrepaidConsultantSelection } from '../prepaid';

interface RepeatUserOnlineConsultantSelectionProps {
  centerId: string;
  onConsultantSelect: (consultantId: string) => void;
}

export default function RepeatUserOnlineConsultantSelection({
  centerId,
  onConsultantSelect,
}: RepeatUserOnlineConsultantSelectionProps) {
  return (
    <PrepaidConsultantSelection
      centerId={centerId}
      onConsultantSelect={onConsultantSelect}
    />
  );
}
