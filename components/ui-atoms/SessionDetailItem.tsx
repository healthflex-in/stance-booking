import React from 'react';
import { ChevronRight } from 'lucide-react';

interface SessionDetailItemProps {
  label: string;
  value: string;
  onClick?: () => void;
}

export default function SessionDetailItem({
  label,
  value,
  onClick,
}: SessionDetailItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left py-4 border-b border-dashed border-[rgba(28,26,75,0.1)] last:border-b-0"
      type="button"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-[rgba(28,26,75,0.6)] mb-1">
            {label}
          </div>
          <div className="text-sm font-medium text-[#1C1A4B]">{value}</div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#1C1A4B]" />
      </div>
    </button>
  );
}

