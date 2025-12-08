import React from 'react';

import { AppointmentEvent } from '@/gql/graphql';
import { CalendarViewCommonProps } from './types';
import { getDaysInWeek, isValidTimestamp, timeSlots } from '@/utils/standard-utils';

type WeeklyCalendarViewProps = CalendarViewCommonProps;

const AppointmentBlock: React.FC<{
    appointment: AppointmentEvent;
    onClick: (appointment: AppointmentEvent) => void;
    consultantIndex: number;
    consultantColorMap: { [key: string]: string };
    onEmptySlotClick?: (date: Date) => void;
}> = ({ appointment, onClick, consultantIndex, consultantColorMap, onEmptySlotClick }) => {
    if (!isValidTimestamp(appointment.startTime) || !isValidTimestamp(appointment.endTime)) {
        console.error('Invalid timestamp in appointment:', appointment);
        return null;
    }

    const startTime = new Date(appointment.startTime);
    const formattedTime = startTime.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });

    const patient = appointment.appointment?.patient;
    const consultant = appointment.appointment?.consultant;
    const fullName = patient ? `${patient.profileData?.firstName || ''} ${patient.profileData?.lastName || ''}`.trim() : 'Unknown';
    const trimmedName = fullName.length > 15 ? `${fullName.slice(0, 15)}...` : fullName;

    const bgColor = consultant ? consultantColorMap[consultant._id] || 'bg-gray-100' : 'bg-yellow-100';

    const borderStyle = appointment.isWaitlisted
        ? 'border-2 border-dashed border-red-300'
        : appointment.appointment.visitType === 'FIRST_VISIT'
            ? 'border-4 border-solid border-[#ddfe71]'
            : '';

    return (
        <div className="group relative">
            <div
                className={`${bgColor} ${borderStyle} rounded px-2 py-1 mb-1 cursor-pointer hover:opacity-90 transition-opacity relative`}
                onClick={() => onClick(appointment)}
            >
                <div className="flex items-center justify-between text-xs">
                    <span>{trimmedName}</span>
                    <span>{formattedTime}</span>
                </div>
                {appointment.isWaitlisted && (
                    <div className="text-xs text-red-300 font-medium">Waitlisted</div>
                )}
                {appointment.appointment.visitType === 'FIRST_VISIT' && (
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-md flex items-center justify-center z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-yellow-900" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};

export default function DisableWeeklyCalenderView({
    currentDate,
    appointments,
    consultantIndices,
    consultantColorMap,
    onAppointmentClick,
    onEmptySlotClick,
    consultantsData = [],
}: WeeklyCalendarViewProps) {
    const days = getDaysInWeek(currentDate);

    const handleEmptySlotClick = (day: string, time: string) => {
        if (!onEmptySlotClick) return;
        const [hours, minutes] = time.split(':').map(Number);
        const [year, month, dayOfMonth] = day.split('-').map(Number);
        const date = new Date(year, month - 1, dayOfMonth, hours, minutes);
        onEmptySlotClick(date);
    };

    const mergedAppointmentsByDay: Record<string, AppointmentEvent[]> = {};
    for (const day of days) {
        const dayAppointments = appointments.filter((apt) => {
            if (!isValidTimestamp(apt.startTime)) return false;
            const start = new Date(apt.startTime);
            return (
                start.getFullYear() === day.date.getFullYear() &&
                start.getMonth() === day.date.getMonth() &&
                start.getDate() === day.date.getDate()
            );
        }).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const merged: AppointmentEvent[] = [];
        for (const current of dayAppointments) {
            if (!current.startTime || !current.endTime) continue;
            const currStart = new Date(current.startTime);
            const currEnd = new Date(current.endTime);

            const last = merged[merged.length - 1];
            if (last && new Date(last.endTime).getTime() >= currStart.getTime()) {
                last.endTime = new Date(last.endTime).getTime() > currEnd.getTime() ? last.endTime : current.endTime;
            } else {
                merged.push({ ...current });
            }
        }

        mergedAppointmentsByDay[day.dateString] = merged;
    }

    return (
        <div className="overflow-hidden">
            <div className="w-full">
                <div className="grid grid-cols-[90px_repeat(7,1fr)] border-b border-t">
                    <div className="p-3 border-r bg-primary-light font-medium text-sm text-gray-600 text-center">Time</div>
                    {days.map((day) => (
                        <div
                            key={day.name}
                            className={`p-3 text-center border-r ${day.date.toDateString() === new Date().toDateString()
                                ? 'bg-blue-50'
                                : 'bg-primary-light'
                                }`}
                        >
                            <div className="font-medium text-sm text-gray-700">{day.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{day.dayOfMonth}</div>
                        </div>
                    ))}
                </div>

                <div className="divide-y">
                    {timeSlots.map((time) => (
                        <div key={time} className="grid grid-cols-[90px_repeat(7,1fr)]">
                            <div className="p-3 border-r sm text-gray-600 text-center">
                                {new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true,
                                })}
                            </div>
                            {days.map((day) => {
                                const hour = parseInt(time.split(':')[0]);
                                const cellStartMin = hour * 60;
                                const cellEndMin = cellStartMin + 60;

                                const mergedBlocks = mergedAppointmentsByDay[day.dateString]?.filter(apt => {
                                    const start = new Date(apt.startTime);
                                    const end = new Date(apt.endTime);
                                    const aptStartMin = start.getHours() * 60 + start.getMinutes();
                                    const aptEndMin = end.getHours() * 60 + end.getMinutes();
                                    return aptStartMin < cellEndMin && aptEndMin > cellStartMin;
                                }) || [];

                                return (
                                    <div
                                        key={`${day.dateString}-${time}`}
                                        className="p-2 border-r min-h-[4.5rem] relative"
                                    >
                                        <div className="absolute inset-0 z-10 pointer-events-none">
                                            {mergedBlocks.map((apt, idx) => {
                                                const start = new Date(apt.startTime);
                                                const end = new Date(apt.endTime);

                                                const blockStartMin = Math.max(start.getHours() * 60 + start.getMinutes(), cellStartMin);
                                                const blockEndMin = Math.min(end.getHours() * 60 + end.getMinutes(), cellEndMin);

                                                const topPercent = ((blockStartMin - cellStartMin) / 60) * 100;
                                                const heightPercent = ((blockEndMin - blockStartMin) / 60) * 100;

                                                const timeRange = `${new Date(1970, 0, 1, Math.floor(blockStartMin / 60), blockStartMin % 60).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                })} - ${new Date(1970, 0, 1, Math.floor(blockEndMin / 60), blockEndMin % 60).toLocaleTimeString('en-US', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true,
                                                })}`;

                                                return (
                                                    <div
                                                        key={apt._id || idx}
                                                        className="absolute left-0 right-0 bg-gray-300 text-[11px] text-gray-800 rounded px-2 py-1 overflow-hidden flex items-center justify-center text-center"
                                                        style={{
                                                            top: `${topPercent}%`,
                                                            height: `${heightPercent}%`,
                                                        }}
                                                    >
                                                        {timeRange}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="absolute inset-0 z-20">
                                            {(() => {
                                                const blockedRanges = mergedBlocks.map(apt => {
                                                    const start = new Date(apt.startTime);
                                                    const end = new Date(apt.endTime);
                                                    return [
                                                        Math.max(start.getHours() * 60 + start.getMinutes(), cellStartMin),
                                                        Math.min(end.getHours() * 60 + end.getMinutes(), cellEndMin)
                                                    ];
                                                });

                                                const whiteRanges = [];
                                                let cursor = cellStartMin;
                                                for (const [start, end] of blockedRanges) {
                                                    if (cursor < start) whiteRanges.push([cursor, start]);
                                                    cursor = Math.max(cursor, end);
                                                }
                                                if (cursor < cellEndMin) whiteRanges.push([cursor, cellEndMin]);

                                                return whiteRanges.map(([start, end], idx) => {
                                                    const top = ((start - cellStartMin) / 60) * 100;
                                                    const height = ((end - start) / 60) * 100;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className="absolute left-0 right-0 group hover:bg-gray-100 cursor-pointer"
                                                            style={{ top: `${top}%`, height: `${height}%` }}
                                                            onClick={() => handleEmptySlotClick(day.dateString, time)}
                                                        >
                                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button className="p-1 rounded-full bg-white shadow-sm hover:bg-gray-200">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}