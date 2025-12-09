import React from 'react';

interface DateOption {
  id: number;
  day: string;
  date: string;
  month: string;
  slots: number | string;
  fullDate: Date;
}

interface DateSelectorProps {
  dates: DateOption[];
  selectedDate: string;
  onDateSelect: (date: DateOption) => void;
  isLoading?: boolean;
}

export default function DateSelector({
  dates,
  selectedDate,
  onDateSelect,
  isLoading = false,
}: DateSelectorProps) {
  return (
    <div className="flex overflow-x-auto space-x-3 pb-2 scrollbar-hide">
      {dates.map((dateOption) => {
        const isSelected = selectedDate === `${dateOption.day}, ${dateOption.date} ${dateOption.month}`;
        const hasSlots = typeof dateOption.slots === 'number' && dateOption.slots > 0;
        
        return (
          <button
            key={dateOption.id}
            onClick={() => onDateSelect(dateOption)}
            disabled={isLoading && !isSelected}
            className={`flex-shrink-0 min-w-[130px] h-[56px] rounded-[10px] px-4 transition-all ${
              isSelected
                ? 'bg-[#2F2F32] text-white'
                : 'bg-[#F0F0F0] text-[rgba(28,26,75,0.4)]'
            }`}
            type="button"
          >
            <div className="flex flex-col items-center justify-center h-full">
              <span className={`text-sm font-semibold mb-1 ${isSelected ? 'text-white' : 'text-[rgba(28,26,75,0.4)]'}`}>
                {dateOption.day}, {dateOption.date} {dateOption.month}
              </span>
              <span
                className={`text-[11px] font-medium ${
                  isSelected
                    ? 'text-[rgba(255,255,255,0.7)]'
                    : hasSlots
                    ? 'text-[rgba(28,26,75,0.2)]'
                    : 'text-[rgba(28,26,75,0.2)]'
                }`}
              >
                {typeof dateOption.slots === 'number'
                  ? `${dateOption.slots} slots available`
                  : dateOption.slots}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

