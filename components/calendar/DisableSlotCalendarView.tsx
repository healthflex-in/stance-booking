import React from 'react';
import { AppointmentCalendarViewProps } from './types';
import StanceHealthLoader from '../loader/StanceHealthLoader';
import { useAppointmentState } from './hooks/useAppointmentState';
import { useConsultantIndices } from './hooks/useConsultantIndices';
import { useAppointmentsFilter } from './hooks/useAppointmentsFilter';
import DisableWeeklyCalenderView from './DisableWeeklyCalendarView';

/**
 * Main calendar view component that orchestrates the calendar UI
 * Using multiple hooks to separate data management from UI rendering
 */
export default function DisableSlotCalendarView({
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
        selectedAppointment,
        handleAppointmentClick,
        handleCloseDrawer,
        handleEditSuccess,
        handleEditClick
    } = useAppointmentState();

    // Render function for calendar view based on viewMode
    const renderCalendarView = () => {
        const commonProps = {
            currentDate,
            consultantsData,
            appointments: filteredAppointments,
            onEmptySlotClick,
            consultantIndices,
            consultantColorMap,
            onAppointmentClick: handleAppointmentClick
        };

        return <DisableWeeklyCalenderView {...commonProps} />;
    };

    return (
        <div className="relative w-full h-full">
            {loading && <StanceHealthLoader data="appointments calendar" />}

            {renderCalendarView()}
        </div>
    );
}
