import React from 'react';

import { AppointmentEvent, AvailabilityEvent } from '@/gql/graphql';
import NewAppointmentDrawer from './NewAppointmentDrawer';
import AppointmentDetailsDrawer from './AppointmentDetailsDrawer';

interface AppointmentDrawersProps {
  selectedAppointment: AppointmentEvent | null;
  isEditingEnabled: boolean;
  isRescheduling?: boolean;
  isDuplicating?: boolean;
  centerId?: string;
  availabilityEvents?: AvailabilityEvent[];
  onClose: () => void;
  onEdit: () => void;
  onSuccess: () => void;
  onCancel?: (cancellationReason: string, cancellationNote: string) => void;
  onReschedule?: () => void;
  onDuplicate?: () => void;
  onRescheduleSuccess?: (newAppointmentId: string) => void;
  isCancelling?: boolean;
}

/**
 * Component responsible for rendering the appropriate drawer
 * based on application state
 */
export default function AppointmentDrawers({
  selectedAppointment,
  isEditingEnabled,
  isRescheduling = false,
  isDuplicating = false,
  centerId,
  availabilityEvents = [],
  onClose,
  onEdit,
  onSuccess,
  onCancel,
  onReschedule,
  onDuplicate,
  onRescheduleSuccess,
  isCancelling = false,
}: AppointmentDrawersProps) {
  if (selectedAppointment && !isEditingEnabled) {
    return (
      <AppointmentDetailsDrawer
        editable={true}
        isOpen={!!selectedAppointment}
        appointment={selectedAppointment}
        onClose={onClose}
        onEdit={onEdit}
        onCancel={onCancel}
        onReschedule={onReschedule}
        onDuplicate={onDuplicate}
        isCancelling={isCancelling}
      />
    );
  }

  if (isEditingEnabled) {
    return (
      <NewAppointmentDrawer
        isOpen={true}
        closeButtonText={'Cancel'}
        initialDateTime={new Date()}
        centerId={centerId || ''}
        appointmentToEdit={selectedAppointment}
        availabilityEvents={availabilityEvents}
        isRescheduling={isRescheduling}
        isDuplicating={isDuplicating}
        onClose={onClose}
        onSuccess={onSuccess}
        onRescheduleSuccess={onRescheduleSuccess}
        onCancel={onCancel}
        onReschedule={onReschedule}
        onDuplicate={onDuplicate}
        isCancelling={isCancelling}
      />
    );
  }

  return null;
}
