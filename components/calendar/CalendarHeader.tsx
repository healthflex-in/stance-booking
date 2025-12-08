import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { formatDate } from './utils/dateTimeFormatters';

interface CalendarHeaderProps {
  startDate: Date;
  endDate: Date;
  onPrevious: () => void;
  onNext: () => void;
  viewMode: 'day' | 'week';
}

export default function CalendarHeader({ startDate, endDate, onPrevious, onNext, viewMode }: CalendarHeaderProps) {
  const getDateRange = () => {
    if (viewMode === 'day') {
      return startDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }

    const startMonth = startDate.toLocaleDateString('en-US', { month: 'long' }).slice(0, 3);
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'long' }).slice(0, 3);
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = startDate.getFullYear();

    if (startMonth === endMonth) {
      return `${startDay} ${startMonth} - ${endDay} ${startMonth} ${year}`;
    }
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${year}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 bg-white rounded-lg border border-gray-200 p-2 min-w-[320px]">
      <div
        onClick={onPrevious}
        className="cursor-pointer"
      >
        <ChevronLeft className="h-5 w-5 bg-active border border-light border-1 rounded-sm mr-[20px]" />
      </div>
      <div className="text-center min-w-[200px]">
        {getDateRange()}
      </div>
      <div
        onClick={onNext}
        className="cursor-pointer"
      >
        <ChevronRight className="h-5 w-5 bg-active border border-light border-1 rounded-sm ml-[20px]" />
      </div>
    </div>
  );
}
