import React from 'react';

interface TimeSlotButtonProps {
  time: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export default function TimeSlotButton({
  time,
  selected,
  onSelect,
  disabled = false,
}: TimeSlotButtonProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={`w-full h-[48px] rounded-[12px] border-2 text-sm font-medium transition-all ${
        selected
          ? 'bg-[#132644] border-[#132644] text-white shadow-md'
          : 'bg-white border-[rgba(28,26,75,0.12)] text-[#1C1A4B] hover:border-[rgba(28,26,75,0.25)] hover:bg-gray-50'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      type="button"
    >
      {time}
    </button>
  );
}
