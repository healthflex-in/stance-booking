'use client';
import React from 'react';
import { CalendarPlus2 } from 'lucide-react';

import { Button } from '@/components/ui-atoms/Button';
import { Drawer } from '@/components/ui-atoms/Drawer';
import { useAppointmentForm } from './hooks/useAppointmentForm';
import WhatsAppShareDialog from '../ui-atoms/WhatsAppShareDialog';
import NewPatientForm from '@/components/patients/NewPatientForm';
import {
  MediumSelection,
  PatientSelection,
  NotesFormSection,
  DateTimeSelection,
  TreatmentSelection,
  ConsultantSelection
} from './components/AppointmentFormComponents';

import { AppointmentEvent, AppointmentMedium, AvailabilityEvent } from '@/gql/graphql';
import CancelAppointmentModal from './CancelAppointmentModal';

type AppointmentToEdit = AppointmentEvent;

interface NewAppointmentDrawerProps {
  isOpen: boolean;
  centerId: string;
  appointmentToEdit?: AppointmentEvent | null;
  closeButtonText?: string;
  initialDateTime?: Date | null;
  initialConsultantId?: string | null;
  availabilityEvents?: AvailabilityEvent[];
  isRescheduling?: boolean;
  isDuplicating?: boolean;
  onRescheduleSuccess?: (newAppointmentId: string) => void;
  onCancel?: (cancellationReason: string, cancellationNote: string) => void;
  onReschedule?: () => void;
  onDuplicate?: () => void;
  isCancelling?: boolean;

  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewAppointmentDrawer({
  isOpen,
  onClose,
  centerId,
  onSuccess,
  initialDateTime,
  appointmentToEdit,
  initialConsultantId,
  availabilityEvents = [],
  isRescheduling = false,
  isDuplicating = false,
  onRescheduleSuccess,
  onCancel,
  onReschedule,
  onDuplicate,
  isCancelling = false,
}: NewAppointmentDrawerProps) {
  const [showCancelModal, setShowCancelModal] = React.useState(false);

  // Use the appointment form hook to handle all data management
  const {
    formData,
    formErrors,
    warningMessage,
    unavailabilityWarning,
    patientType,
    showWhatsAppDialog,
    pendingClose,
    whatsappData,
    patientOptions,
    consultantOptions,
    treatmentOptions,
    patientsLoading,
    consultantsLoading,
    servicesLoading,
    savingAppointment,
    updatingAppointment,
    setFormData,
    setPatientType,
    setShowWhatsAppDialog,
    validateForm,
    handleNewPatientSuccess,
    createAppointment,
    updateAppointment,
    handlePatientsSearch,
    handlePatientsScroll,
    handlePatientSelection,
    patientsSearchValue,
    patientsHasMore,
  } = useAppointmentForm(
    centerId,
    onSuccess,
    onClose,
    initialDateTime,
    appointmentToEdit,
    initialConsultantId,
    isOpen,
    availabilityEvents
  );

  // Handle closing the drawer - prevent closing if WhatsApp dialog should show
  const handleDrawerClose = () => {
    if (!showWhatsAppDialog) {
      onClose();
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (patientType === 'existing') {
      if (!validateForm()) {
        return;
      }

      let startTime: string;
      let endTime: string;
      try {
        startTime = new Date(formData.startDateTime).toISOString();
        endTime = new Date(formData.endDateTime).toISOString();
      } catch (error) {
        console.error('Invalid date format:', error);
        return;
      }
      const isValidConsultantId = /^[a-fA-F0-9]{24}$/.test(formData.consultantId);
      const consultantField = { consultant: isValidConsultantId ? formData.consultantId : null };

      if (appointmentToEdit && !isRescheduling && !isDuplicating) {
        const updateInput = {
          ...consultantField,
          treatment: formData.treatment,
          medium: formData.medium === 'in-person' ? AppointmentMedium.InPerson : AppointmentMedium.Online,
          notes: formData.notes,
          event: {
            startTime: startTime,
            endTime: endTime,
          },
        };

        updateAppointment(updateInput, appointmentToEdit.appointment._id);
      } else {
        const createInput = {
          patient: formData.patientId,
          ...consultantField,
          treatment: formData.treatment,
          medium: formData.medium === 'in-person' ? AppointmentMedium.InPerson : AppointmentMedium.Online,
          notes: formData.notes,
          center: formData.centerId,
          visitType: isRescheduling ? appointmentToEdit?.appointment.visitType : undefined,
          event: {
            startTime: startTime,
            endTime: endTime,
          },
        };

        const newAppointmentId = await createAppointment(createInput);
        
        if (isRescheduling && newAppointmentId && onRescheduleSuccess) {
          // Store the reschedule callback to be called after WhatsApp dialog closes
          (window as any).__pendingRescheduleSuccess = () => onRescheduleSuccess(newAppointmentId);
        }
      }
    }
  };

  // Handle field changes
  const handlePatientChange = (value: string) => {
    setFormData(prev => ({ ...prev, patientId: value }));
  };

  const handleCenterChange = (value: string[]) => {
    if (value.length > 0) {
      setFormData(prev => ({ ...prev, centerId: value[0] }));
    }
  };

  const handleConsultantChange = (value: string) => {
    setFormData(prev => ({ ...prev, consultantId: value }));
  };

  const handleTreatmentChange = (value: string) => {
    setFormData(prev => ({ ...prev, treatment: value }));
  };

  const handleStartDateChange = (value: string) => {
    setFormData(prev => ({ ...prev, startDateTime: value }));
  };

  const handleMediumChange = (value: 'in-person' | 'online') => {
    setFormData(prev => ({ ...prev, medium: value }));
  };

  const handleNotesChange = (value: string) => {
    setFormData(prev => ({ ...prev, notes: value }));
  };

  return (
    <>
      <Drawer
        isOpen={isOpen && !showWhatsAppDialog} // Hide drawer when WhatsApp dialog is showing
        onClose={handleDrawerClose}
        title={
          isRescheduling ? 'Reschedule Appointment' : 
          isDuplicating ? 'Duplicate Appointment' :
          appointmentToEdit ? 'Edit Appointment' : 'Create New Appointment'
        }
        titleIcon={<CalendarPlus2 className="w-6 h-6" />}
        width="w-[520px]"
        footerAction={
          appointmentToEdit && !isRescheduling && !isDuplicating ? (
            appointmentToEdit.appointment.status === 'CANCELLED' ? (
              onDuplicate && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-2 text-sm !bg-orange-200 !text-black !border-orange-300 hover:!bg-orange-300"
                  onClick={onDuplicate}
                >
                  Duplicate
                </Button>
              )
            ) : appointmentToEdit.appointment.status === 'PAID' ? (
              // Hide Cancel, Reschedule, and Update buttons when status is PAID
              onDuplicate && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full py-2 text-sm !bg-orange-200 !text-black !border-orange-300 hover:!bg-orange-300"
                  onClick={onDuplicate}
                >
                  Duplicate
                </Button>
              )
            ) : (
              <div className="flex gap-2 w-full">
                {onCancel && (
                  <Button
                    type="button"
                    variant="destructive"
                    className="flex-1 py-2 text-sm"
                    onClick={() => setShowCancelModal(true)}
                    disabled={savingAppointment || updatingAppointment || isCancelling}
                  >
                    Cancel
                  </Button>
                )}
                {onReschedule && (
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex-1 py-2 text-sm !bg-purple-200 !text-black hover:!bg-purple-300"
                    onClick={onReschedule}
                    disabled={savingAppointment || updatingAppointment || isCancelling}
                  >
                    Reschedule
                  </Button>
                )}
                {onDuplicate && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 py-2 text-sm !bg-orange-200 !text-black !border-orange-300 hover:!bg-orange-300"
                    onClick={onDuplicate}
                    disabled={savingAppointment || updatingAppointment || isCancelling}
                  >
                    Duplicate
                  </Button>
                )}
                <Button
                  type="button"
                  variant="glow"
                  className="flex-1 py-2 text-sm"
                  onClick={handleSubmit}
                  disabled={savingAppointment || updatingAppointment}
                >
                  {updatingAppointment ? 'Updating...' : 'Update'}
                </Button>
              </div>
            )
          ) : (
            <Button
              type="button"
              variant="glow"
              className="w-full"
              onClick={handleSubmit}
              disabled={savingAppointment || updatingAppointment}
            >
              {savingAppointment || updatingAppointment
                ? isRescheduling ? 'Rescheduling...' : isDuplicating ? 'Duplicating...' : 'Creating...'
                : isRescheduling ? 'Reschedule Appointment'
                : isDuplicating ? 'Duplicate Appointment'
                : 'Create Appointment'}
            </Button>
          )
        }
      >
        <div className="mb-2">
          {formErrors.general && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
              {formErrors.general}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="mb-6">
            {/* Radio button toggle between existing and new patient */}
            <div className="mb-6">
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  className={`px-4 py-2 rounded-md ${patientType === 'existing'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100'
                    }`}
                  onClick={() => setPatientType('existing')}
                >
                  Existing Patient
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded-md ${patientType === 'new'
                      ? 'bg-primary text-white'
                      : 'bg-gray-100'
                    }`}
                  onClick={() => setPatientType('new')}
                >
                  New Patient
                </button>
              </div>
            </div>

            {patientType === 'existing' ? (
              <PatientSelection
              formErrors={formErrors}
              centerId={formData.centerId}
              patientId={formData.patientId}
                patientOptions={patientOptions}
                patientsLoading={patientsLoading}
                patientsHasMore={patientsHasMore}
                onCenterChange={handleCenterChange}
                onPatientChange={handlePatientChange}
                onPatientsSearch={handlePatientsSearch}
                onPatientsScroll={handlePatientsScroll}
                patientsSearchValue={patientsSearchValue}
                disabled={isRescheduling}
              />
            ) : (
              <div className="mt-4">
                <NewPatientForm
                  formType="mini"
                  centerId={centerId}
                  formTitle="Add Patient"
                  onClose={() => setPatientType('existing')}
                  onSuccess={({ patientId, centerId }) =>
                    handleNewPatientSuccess(patientId, centerId)
                  }
                />
              </div>
            )}
          </div>

          {patientType === 'existing' && (
            <div className="space-y-6">
              <ConsultantSelection
                consultantId={formData.consultantId}
                consultantOptions={consultantOptions}
                consultantsLoading={consultantsLoading}
                formErrors={formErrors}
                onConsultantChange={handleConsultantChange}
              />

              <TreatmentSelection
                treatmentId={formData.treatment}
                treatmentOptions={treatmentOptions}
                treatmentsLoading={servicesLoading}
                formErrors={formErrors}
                onTreatmentChange={handleTreatmentChange}
              />

              <DateTimeSelection
                startDateTime={formData.startDateTime}
                endDateTime={formData.endDateTime}
                formErrors={formErrors}
                onStartDateChange={handleStartDateChange}
                warningMessage={warningMessage}
                unavailabilityWarning={unavailabilityWarning}
                disabled={!!appointmentToEdit && !isRescheduling && !isDuplicating}
              />

              <MediumSelection
                medium={formData.medium as 'in-person' | 'online'}
                onMediumChange={handleMediumChange}
              />

              <NotesFormSection
                notes={formData.notes}
                onNotesChange={handleNotesChange}
              />
            </div>
          )}
        </div>
      </Drawer>

      <WhatsAppShareDialog
        isOpen={showWhatsAppDialog}
        onClose={() => {
          setShowWhatsAppDialog(false);
          
          // Check if there's a pending reschedule success callback
          const pendingCallback = (window as any).__pendingRescheduleSuccess;
          if (pendingCallback) {
            delete (window as any).__pendingRescheduleSuccess;
            pendingCallback();
          } else if (pendingClose) {
            onSuccess?.();
            onClose();
          }
        }}
        message={whatsappData.message}
        phoneNumber={whatsappData.phoneNumber}
        title={isRescheduling ? "Send Rescheduled Appointment Details" : "Send Appointment Details"}
      />

      {onCancel && (
        <CancelAppointmentModal
          isOpen={showCancelModal}
          onClose={() => setShowCancelModal(false)}
          onConfirm={(cancellationReason, cancellationNote) => {
            onCancel(cancellationReason, cancellationNote);
            setShowCancelModal(false);
          }}
          isLoading={isCancelling}
        />
      )}
    </>
  );
}
