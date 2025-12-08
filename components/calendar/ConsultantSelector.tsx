'use client';

import React, { useEffect } from 'react';

import { User } from '@/gql/graphql';
import { useConsultantSelection } from './hooks/useConsultantSelection';

export type ConsultantSelectorProps = {
  centerId: string[];

  onSelectionChange: (selectedIds: string[]) => void;
  onConsultantsDataChange?: (consultants: User[]) => void;
  onConsultantColorsChange?: (colorMap: { [key: string]: string }) => void;
}

/**
 * ConsultantSelector component - UI for selecting consultants
 * Data management is handled by the useConsultantSelection hook
 */
export default function ConsultantSelector({
  centerId,
  onSelectionChange,
  onConsultantsDataChange,
  onConsultantColorsChange,
}: ConsultantSelectorProps) {
  const {
    colorMap,
    toggleAll,
    selectedIds,
    allSelected,
    consultants,
    toggleConsultant,
    consultantsLoading,
    selectedConsultantsData,
  } = useConsultantSelection(centerId);

  // Notify parent components when selections change
  useEffect(() => {
    onSelectionChange(selectedIds);
  }, [selectedIds, onSelectionChange]);

  // Notify parent about color mapping
  useEffect(() => {
    if (onConsultantColorsChange) {
      onConsultantColorsChange(colorMap);
    }
  }, [colorMap, onConsultantColorsChange]);

  // Notify parent about selected consultants data
  useEffect(() => {
    if (onConsultantsDataChange) {
      onConsultantsDataChange(selectedConsultantsData);
    }
  }, [selectedConsultantsData, onConsultantsDataChange]);

  // Consultant row component - extracted for better performance
  const ConsultantRow = React.memo(({
    id,
    name,
    color,
    isSelected
  }: {
    id: string;
    name: string;
    color: string;
    isSelected: boolean
  }) => (
    <div
      className="flex items-center gap-3 py-1 cursor-pointer"
      onClick={() => toggleConsultant(id)}
    >
      <input
        type="checkbox"
        checked={isSelected}
        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
        onChange={() => {}} // Handled by onClick on parent div
      />
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-sm text-gray-700">{name}</span>
    </div>
  ));
  ConsultantRow.displayName = 'ConsultantRow';

  return (
    <div className="space-y-6 border-r border-secondary p-5">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[12px] font-bold leading-[20px] text-[var(--text-secondary)] opacity-70">CONSULTANTS</h2>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={allSelected}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary/20"
              onChange={toggleAll}
            />
            <span className="text-xs text-gray-700">Select All</span>
          </div>
        </div>
        <div className="space-y-2">
          {consultantsLoading ? (
            <div className="py-4 text-center text-gray-500">Loading consultants...</div>
          ) : consultants.length === 0 ? (
            <div className="py-4 text-center text-gray-500">No consultants found</div>
          ) : (
            <>
              {consultants.map((consultant) => (
                <ConsultantRow
                  key={consultant.id}
                  id={consultant.id}
                  name={consultant.name}
                  color={consultant.color}
                  isSelected={consultant.isSelected}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
