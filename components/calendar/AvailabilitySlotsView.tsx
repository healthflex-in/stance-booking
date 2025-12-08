'use client';

import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useAvailableSlots } from '@/hooks/useAvailableSlots';
import { GET_CONSULTANTS } from '@/gql/queries';

interface AvailabilitySlot {
  id: string;
  startTime: Date;
  endTime: Date;
  consultantName: string;
  consultantId: string;
  type: 'online' | 'in-person';
  duration: number;
}

interface AvailabilitySlotsViewProps {
  centerId: string;
  selectedDate: Date;
  serviceDurationInMinutes?: number;
  onSlotSelect: (slot: AvailabilitySlot) => void;
}

export default function AvailabilitySlotsView({
  centerId,
  selectedDate,
  serviceDurationInMinutes = 75,
  onSlotSelect,
}: AvailabilitySlotsViewProps) {
  const [activeTab, setActiveTab] = useState<'physio' | 'sc'>('physio');

  // Fetch consultants to get names and specializations
  const { data: consultantsData } = useQuery(GET_CONSULTANTS, {
    variables: {
      userType: 'CONSULTANT',
      centerId: [centerId],
      pagination: { limit: 100, direction: 'FORWARD' },
    },
    skip: !centerId,
  });

  // Fetch all slots (will be categorized by consultant designation)
  const { availableSlots: physioSlots, loading } = useAvailableSlots({
    centerId,
    date: selectedDate,
    serviceDurationInMinutes,
    consultantId: null,
    isReturningUser: false,
  });

  const availableSlots = useMemo(() => {
    const slots: { physio: AvailabilitySlot[]; sc: AvailabilitySlot[] } = {
      physio: [],
      sc: [],
    };

    if (!consultantsData?.users?.data) return slots;

    const consultants = consultantsData.users.data;
    const consultantMap = new Map<string, { name: string; specialization: string; designation: string }>(
      consultants.map((c: any) => {
        const firstName = c.profileData?.firstName || '';
        const lastName = (c.profileData?.lastName || '').trim();
        const fullName = `${firstName} ${lastName}`.trim();
        
        return [
          c._id,
          {
            name: fullName || 'Consultant',
            specialization: c.profileData?.specialization || '',
            designation: c.profileData?.designation || '',
          },
        ];
      })
    );

    // Process all slots and categorize by designation
    physioSlots.forEach((slot) => {
      const consultant = consultantMap.get(slot.consultantId);
      if (!consultant) return;

      const startTime = new Date(slot.startTime);
      const endTime = new Date(slot.endTime);
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const type = duration <= 30 ? 'online' : 'in-person';

      const slotData: AvailabilitySlot = {
        id: `${slot.startTime}-${slot.endTime}-${slot.consultantId}`,
        startTime,
        endTime,
        consultantName: consultant?.name || 'Consultant',
        consultantId: slot.consultantId,
        type,
        duration,
      };

      // Categorize by designation
      if (consultant.designation === 'Physiotherapist') {
        slots.physio.push(slotData);
      } else if (consultant.designation === 'S&C Coach') {
        slots.sc.push(slotData);
      }
    });

    // Sort by time
    slots.physio.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    slots.sc.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return slots;
  }, [physioSlots, consultantsData]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const renderSlots = (slots: AvailabilitySlot[]) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (slots.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No available slots for this date</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {slots.map((slot) => (
          <button
            key={slot.id}
            onClick={() => onSlotSelect(slot)}
            className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">
                {formatTime(slot.startTime)}
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  slot.type === 'online'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {slot.type === 'online' ? '20 min' : '45 min'}
              </span>
            </div>
            <div className="text-xs text-gray-600 truncate">
              {slot.consultantName}
            </div>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <Clock className="w-3 h-3 mr-1" />
              {slot.type === 'online' ? 'Online' : 'In-Person'}
            </div>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('physio')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'physio'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Physiotherapy
            {availableSlots.physio.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                {availableSlots.physio.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sc')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'sc'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Strength & Conditioning
            {availableSlots.sc.length > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                {availableSlots.sc.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Slots Grid */}
      <div className="p-6">
        {activeTab === 'physio' && renderSlots(availableSlots.physio)}
        {activeTab === 'sc' && renderSlots(availableSlots.sc)}
      </div>
    </div>
  );
}
