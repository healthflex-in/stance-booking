import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useHealthFlexAnalytics } from '@/services/analytics';
import { FormData, DayKey, FormErrors } from '@/types/StaffFormData';
import { validateForm, prepareEventInput, getInitialFormData } from '@/utils/schedule-form';
import { GET_CONSULTANTS, CREATE_AVAILABILITY_EVENT, UPDATE_AVAILABILITY_EVENT, GET_AVAILABILITY_EVENTS } from '@/gql/queries';

import { useAuth } from '@/contexts';
import { toast } from 'sonner';

export const useNewScheduleDrawer = (
    isOpen: boolean,
    onSuccess?: () => void,
    editSchedule?: any,
    onUpdate?: (updatedSchedule: any) => void,
    selectedCenterIds: string[] = [],
    preselectedConsultant?: any,
    preselectedStartTime?: string
) => {
  const analytics = useHealthFlexAnalytics();
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>(() =>
      getInitialFormData(process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '')
  );

  const [formErrors, setFormErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (isOpen) {
      // Use the first selected center from parent, or fall back to localStorage/default
      const centerToUse = selectedCenterIds.length > 0 
        ? selectedCenterIds[0] 
        : (() => {
            if (typeof window !== 'undefined') {
              const storedCenterIds = localStorage.getItem('stance-centreID');
              if (storedCenterIds) {
                try {
                  const parsedIds = JSON.parse(storedCenterIds);
                  return Array.isArray(parsedIds) ? parsedIds[0] : parsedIds;
                } catch {
                  return process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '';
                }
              }
            }
            return process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '';
          })();
      
      setFormData((prev) => ({
        ...prev,
        centerId: centerToUse,
        hostType: preselectedConsultant ? 'CONSULTANT' : prev.hostType,
        consultantId: preselectedConsultant?._id || preselectedConsultant?.id || prev.consultantId,
        startTime: preselectedStartTime || prev.startTime,
      }));
    }
  }, [isOpen, selectedCenterIds, preselectedConsultant, preselectedStartTime]);

  const { data: consultantsData, loading: consultantsLoading } = useQuery(
      GET_CONSULTANTS,
      {
        variables: {
          userType: 'CONSULTANT',
          centerId: formData.centerId,
        },
        skip: !formData.centerId || formData.hostType !== 'CONSULTANT',
        fetchPolicy: 'cache-first',
      }
  );

  const { data: availabilityData } = useQuery(
    GET_AVAILABILITY_EVENTS,
    {
      variables: {
        filter: {
          host: formData.consultantId,
          hostType: 'USER',
        },
      },
      skip: !formData.consultantId || formData.hostType !== 'CONSULTANT',
      fetchPolicy: 'cache-first',
    }
  );

  const [createAvailabilityEvent, { loading: creating }] = useMutation(
      CREATE_AVAILABILITY_EVENT,
      {
        onCompleted: (data) => {
          toast.success('Schedule created successfully');
          
          // Track staff schedule save
          analytics.trackStaffScheduleSave(
            data.createAvailabilityEvent._id,
            {
              staffId: formData.hostType === 'CONSULTANT' ? formData.consultantId : 'center',
              centerId: formData.centerId,
              scheduleType: formData.scheduleType
            },
            user?._id || 'unknown'
          );
          
          onSuccess?.();
        },
        onError: (error) => {
          console.error('Error creating availability event:', error);
          toast.error('Failed to create schedule');
        },
      }
  );

  const [updateAvailabilityEvent, { loading: updating }] = useMutation(
    UPDATE_AVAILABILITY_EVENT,
    {
      onCompleted: (data) => {
        toast.success('Schedule updated successfully');
        onUpdate?.(data.updateAvailabilityEvent);
        onSuccess?.();
      },
      onError: (error) => {
        console.error('Error updating availability event:', error);
        toast.error('Failed to update schedule');
      },
    }
  );

  // Populate form when editing
  useEffect(() => {
    if (editSchedule && isOpen) {
      const timeToString = (timeValue: number) => {
        const hours = Math.floor(timeValue / 100);
        const minutes = timeValue % 100;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      };

      const parseRecurrenceRule = (rrule: string) => {
        if (rrule.includes('FREQ=WEEKLY')) {
          const dayMatch = rrule.match(/BYDAY=([A-Z,]+)/);
          if (dayMatch) {
            const dayMap: Record<string, DayKey> = {
              'MO': 'Mon', 'TU': 'Tue', 'WE': 'Wed',
              'TH': 'Thu', 'FR': 'Fri', 'SA': 'Sat', 'SU': 'Sun'
            };
            return dayMatch[1].split(',').map(day => dayMap[day]).filter(Boolean);
          }
        }
        return [];
      };

      setFormData(prev => ({
        ...prev,
        title: editSchedule.title || '',
        description: editSchedule.description || '',
        centerId: editSchedule.host?.centers?.[0]?._id || editSchedule.host?._id || prev.centerId,
        hostType: editSchedule.hostType === 'USER' ? 'CONSULTANT' : 'CENTER',
        consultantId: editSchedule.hostType === 'USER' ? editSchedule.host._id : '',
        startTime: timeToString(editSchedule.startTime),
        endTime: timeToString(editSchedule.endTime),
        availabilityStatus: editSchedule.availabilityStatus || 'AVAILABLE',
        scheduleType: editSchedule.recurrenceRule ? 'recurring' : 'justToday',
        startDate: editSchedule.recurrenceRule?.startDate 
          ? new Date(editSchedule.recurrenceRule.startDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        endDate: editSchedule.recurrenceRule?.endDate
          ? new Date(editSchedule.recurrenceRule.endDate).toISOString().split('T')[0]
          : '',
        repeatDays: editSchedule.recurrenceRule ? parseRecurrenceRule(editSchedule.recurrenceRule.rrule) : [],
        repeatEvery: 1,
        endType: editSchedule.recurrenceRule?.endDate ? 'on' : 'never',
      }));
    }
  }, [editSchedule, isOpen]);

  const handleDayToggle = (day: DayKey) => {
    setFormData((prev) => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
          ? prev.repeatDays.filter((d) => d !== day)
          : [...prev.repeatDays, day],
    }));
    setFormErrors((prev) => ({ ...prev, repeatDays: '' }));
  };

  const handleSubmit = () => {
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    if (editSchedule) {
      // Update existing schedule
      const timeToNumber = (timeStr: string) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 100 + minutes;
      };

      // Prepare recurrence rule for update
      const { eventInput } = prepareEventInput(formData);

      updateAvailabilityEvent({
        variables: {
          id: editSchedule._id,
          event: {
            title: formData.title,
            description: formData.description,
            recurrenceRule: eventInput.recurrenceRule,
          },
          availability: {
            startTime: timeToNumber(formData.startTime),
            endTime: timeToNumber(formData.endTime),
            isAvailable: formData.availabilityStatus === 'AVAILABLE',
            availabilityStatus: formData.availabilityStatus,
          },
        },
      });
    } else {
      // Create new schedule
      const { eventInput, availabilityInput } = prepareEventInput(formData);

      createAvailabilityEvent({
        variables: {
          event: eventInput,
          availability: availabilityInput,
        },
      });
    }
  };

  const consultantOptions = React.useMemo(() => {
    // Handle different possible data structures
    let consultantsList = [];

    if (consultantsData?.users?.data && Array.isArray(consultantsData.users.data)) {
      // Structure: { users: { data: [...] } }
      consultantsList = consultantsData.users.data;
    } else if (consultantsData?.users && Array.isArray(consultantsData.users)) {
      // Structure: { users: [...] }
      consultantsList = consultantsData.users;
    } else if (consultantsData?.data && Array.isArray(consultantsData.data)) {
      // Structure: { data: [...] }
      consultantsList = consultantsData.data;
    } else if (Array.isArray(consultantsData)) {
      // Structure: [...]
      consultantsList = consultantsData;
    }

    // Return default option if no consultants found
    if (!consultantsList || consultantsList.length === 0) {
      return [{ value: '', label: 'Select Consultant', disabled: true }];
    }

    return [
      { value: '', label: 'Select Consultant', disabled: true },
      ...consultantsList.map((consultant: any) => ({
        value: consultant._id,
        label:
            `${consultant.profileData?.firstName || ''} ${
                consultant.profileData?.lastName || ''
            }`.trim() || consultant.email,
      })),
    ];
  }, [consultantsData]);

  return {
    formData,
    setFormData,
    formErrors,
    setFormErrors,
    consultantsLoading,
    creating: creating || updating,
    consultantOptions,
    handleDayToggle,
    handleSubmit,
  };
};
