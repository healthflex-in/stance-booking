import React from 'react';

interface SessionTypeCardProps {
  image: string;
  label: string;
  selected: boolean;
  onSelect: () => void;
}

export default function SessionTypeCard({
  image,
  label,
  selected,
  onSelect,
}: SessionTypeCardProps) {
  return (
    <button
      onClick={onSelect}
      className="flex flex-col items-center w-full"
      type="button"
    >
      <div
        className={`w-full h-[100px] rounded-[10px] mb-2 bg-cover bg-center`}
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="flex items-center space-x-2">
        <div
          className={`w-4 h-4 rounded-full border ${
            selected
              ? 'border-[#132644] bg-[#132644] flex items-center justify-center'
              : 'border-[#1C1A4B]'
          }`}
        >
          {selected && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
        <span className="text-sm font-medium text-[#1C1A4B]">{label}</span>
      </div>
    </button>
  );
}

