import React from 'react';
import { toast } from 'sonner';
import { useMutation } from '@apollo/client';
import { AppointmentEvent, AppointmentStatus, CancellationReason } from '@/gql/graphql';
import { UPDATE_APPOINTMENT, CREATE_APPOINTMENT } from '@/gql/queries';

/**
 * Custom hook to manage appointment selection and editing state
 * This separates appointment state management from UI components
 */
export function useAppointmentState() {
  // UI state management
  const [isEditingEnabled, setIsEditingEnabled] = React.useState(false);
  const [isRescheduling, setIsRescheduling] = React.useState(false);
  const [isDuplicating, setIsDuplicating] = React.useState(false);
  const [selectedAppointment, setSelectedAppointment] = React.useState<AppointmentEvent | null>(null);

  // Mutations
  const [updateAppointment, { loading: isCancelling }] = useMutation(UPDATE_APPOINTMENT, {
    onCompleted: () => {
      toast.success('Appointment status updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update appointment status: ' + error.message);
    },
  });
  const [createAppointment] = useMutation(CREATE_APPOINTMENT);

  // Event handlers
  const handleAppointmentClick = React.useCallback((appointment: AppointmentEvent) => {
    setSelectedAppointment(appointment);
  }, []);

  const handleCloseDrawer = React.useCallback(() => {
    setSelectedAppointment(null);
    setIsEditingEnabled(false);
    setIsRescheduling(false);
    setIsDuplicating(false);
  }, []);

  const handleEditSuccess = React.useCallback((refetchEvents: () => void) => {
    setIsEditingEnabled(false);
    setIsRescheduling(false);
    setIsDuplicating(false);
    setSelectedAppointment(null);
    refetchEvents();
  }, []);

  const handleEditClick = React.useCallback(() => {
    setIsEditingEnabled(true);
  }, []);

  const handleCancelAppointment = React.useCallback(async (cancellationReason: string, cancellationNote: string, refetchEvents: () => void) => {
    if (!selectedAppointment) return;

    try {
      await updateAppointment({
        variables: {
          id: selectedAppointment.appointment._id,
          input: {
            status: AppointmentStatus.Cancelled,
            cancellationReason,
            cancellationNote,
          },
        },
      });

      setSelectedAppointment(null);
      refetchEvents();
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }, [selectedAppointment, updateAppointment]);

  const handleRescheduleClick = React.useCallback(() => {
    if (!selectedAppointment) return;

    // Build the reschedule history for the NEW appointment
    const rescheduledFrom = selectedAppointment.appointment.rescheduledFrom || [];
    const allPreviousIds = [...rescheduledFrom.map((a: any) => a._id), selectedAppointment.appointment._id];

    // Store the reschedule data for linking after new appointment is created
    (window as any).__rescheduleData = {
      oldAppointmentId: selectedAppointment.appointment._id,
      allPreviousIds,
    };

    // Open the reschedule drawer
    setIsRescheduling(true);
    setIsEditingEnabled(true);
  }, [selectedAppointment]);

  const handleDuplicateClick = React.useCallback(() => {
    setIsDuplicating(true);
    setIsEditingEnabled(true);
  }, []);

  const handleRescheduleSuccess = React.useCallback(async (newAppointmentId: string, refetchEvents: () => void) => {
    try {
      const rescheduleData = (window as any).__rescheduleData;
      if (!rescheduleData) return;

      // Cancel the old appointment with RESCHEDULED reason
      await updateAppointment({
        variables: {
          id: rescheduleData.oldAppointmentId,
          input: {
            status: AppointmentStatus.Cancelled,
            cancellationReason: CancellationReason.Rescheduled,
            rescheduledTo: newAppointmentId,
          },
        },
      });

      // Update the new appointment with reschedule history
      await updateAppointment({
        variables: {
          id: newAppointmentId,
          input: {
            rescheduledFrom: rescheduleData.allPreviousIds,
          },
        },
      });

      // Clean up
      delete (window as any).__rescheduleData;
      setIsRescheduling(false);
      setIsEditingEnabled(false);
      setSelectedAppointment(null);
      refetchEvents();
    } catch (error) {
      console.error('Error completing reschedule:', error);
      throw error;
    }
  }, [updateAppointment]);

  return {
    isEditingEnabled,
    isRescheduling,
    isDuplicating,
    selectedAppointment,
    isCancelling,
    handleAppointmentClick,
    handleCloseDrawer,
    handleEditSuccess,
    handleEditClick,
    handleCancelAppointment,
    handleRescheduleClick,
    handleDuplicateClick,
    handleRescheduleSuccess,
  };
}
