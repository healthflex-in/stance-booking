import React from 'react';

import DailyCalendarView from './DailyCalendarView';
import WeeklyCalendarView from './WeeklyCalendarView';
import AppointmentDrawers from './AppointmentDrawers';
import { AppointmentCalendarViewProps } from './types';
import StanceHealthLoader from '../loader/StanceHealthLoader';
import { useAppointmentState } from './hooks/useAppointmentState';
import { useConsultantIndices } from './hooks/useConsultantIndices';
import { useAppointmentsFilter } from './hooks/useAppointmentsFilter';

/**
 * Main calendar view component that orchestrates the calendar UI
 * Using multiple hooks to separate data management from UI rendering
 */
export default function AppointmentCalendarView({
  loading,
  viewMode,
  currentDate,
  appointments,
  selectedCenterIds,
  availabilityEvents,
  consultantColorMap,
  consultantsData = [],
  selectedConsultantIds = [],
  refetchEvents,
  onEmptySlotClick,
}: AppointmentCalendarViewProps) {
  // Data processing with custom hooks
  const filteredAppointments = useAppointmentsFilter(appointments, selectedConsultantIds);
  const consultantIndices = useConsultantIndices(appointments);

  // Appointment state management
  const {
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
  } = useAppointmentState();

  // Render function for calendar view based on viewMode
  const renderCalendarView = () => {
    const commonProps = {
      currentDate,
      consultantsData,
      onEmptySlotClick,
      consultantIndices,
      consultantColorMap,
      appointments: filteredAppointments,
      onAppointmentClick: handleAppointmentClick
    };

    if (viewMode === 'day') {
      return (
        <DailyCalendarView
          {...commonProps}
          selectedCenterIds={selectedCenterIds}
          availabilityEvents={availabilityEvents}
          selectedConsultantIds={selectedConsultantIds}
        />
      );
    }

    return <WeeklyCalendarView {...commonProps} />;
  };

  return (
    <div className="relative w-full h-full">
      {loading && <StanceHealthLoader data="appointments calendar" />}

      {renderCalendarView()}

      <AppointmentDrawers
        centerId={selectedCenterIds[0]}
        isEditingEnabled={isEditingEnabled}
        isRescheduling={isRescheduling}
        isDuplicating={isDuplicating}
        selectedAppointment={selectedAppointment}
        availabilityEvents={availabilityEvents}
        onEdit={handleEditClick}
        onClose={handleCloseDrawer}
        onSuccess={() => handleEditSuccess(refetchEvents)}
        onCancel={(cancellationReason, cancellationNote) => handleCancelAppointment(cancellationReason, cancellationNote, refetchEvents)}
        onReschedule={handleRescheduleClick}
        onDuplicate={handleDuplicateClick}
        onRescheduleSuccess={(newAppointmentId) => handleRescheduleSuccess(newAppointmentId, refetchEvents)}
        isCancelling={isCancelling}
      />
    </div>
  );
}
