import { useState, useMemo } from 'react';
import { Button } from '../ui-atoms/Button';
import { useAppointmentForm } from './hooks/useAppointmentForm';
import { Card, CardContent, CardHeader } from '../ui-atoms/Card';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import PublicRazorpayPayment from '../payment/PublicRazorpayPayment';
import { AppointmentMedium } from '@/gql/graphql';
import {
  MediumSelection,
  NotesFormSection,
  DateTimeSelection,
  TreatmentSelection,
  ConsultantSelection,
} from './components/AppointmentFormComponents';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDateTime?: Date | null;
  initialConsultantId?: string | null;
  formTitle?: string;
  onSuccess?: () => void;
  centerId: string;
  patientId: string;
}

export default function NewAppointmentModal({
  isOpen,
  onClose,
  initialDateTime,
  initialConsultantId,
  formTitle,
  onSuccess,
  centerId,
  patientId,
}: NewAppointmentModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // All hooks must be called unconditionally
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);

  // Check if we need Razorpay (only for onboarding route)
  const needsPayment = useMemo(() => {
    const isOnboardingPath = pathname === '/onboarding-patient/slots';
    const hasPatientId = searchParams.get('patient_id');
    const hasCenterId = searchParams.get('center_id');
    return isOnboardingPath && hasPatientId && hasCenterId;
  }, [pathname, searchParams]);



  const {
    formData,
    formErrors,
    warningMessage,
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
  } = useAppointmentForm(
    centerId,
    onSuccess,
    onClose,
    initialDateTime,
    null,
    initialConsultantId,
    isOpen
  );

  const handleConsultantChange = (value: string) => {
    setFormData((prev) => ({ ...prev, consultantId: value }));
  };

const selectedTreatment = useMemo(() => {
  return treatmentOptions.find((t) => t.value === formData.treatment);
}, [formData.treatment, treatmentOptions]);

if (!isOpen) return null;


  const handleTreatmentChange = (value: string) => {
    setFormData((prev) => ({ ...prev, treatment: value }));
  };

  const handleStartDateChange = (value: string) => {
    setFormData((prev) => ({ ...prev, startDateTime: value }));
  };

  const handleMediumChange = (value: 'in-person' | 'online') => {
    setFormData((prev) => ({ ...prev, medium: value }));
  };

  const handleNotesChange = (value: string) => {
    setFormData((prev) => ({ ...prev, notes: value }));
  };



  const handleSubmit = async () => {
    formData.patientId = patientId;

    if (!validateForm()) {
      return;
    }

    if (needsPayment) {
      if (paymentProcessed) {
        console.log('⚠️ Payment already processed, not starting new payment flow');
        return;
      }
      setIsProcessingPayment(true);
      return; // Stop here and let the payment component handle the rest
    }

    // Only create appointment directly if no payment is needed
    // For payment flow, appointment will be created after successful payment
    const startTime = new Date(formData.startDateTime).toISOString();
    const endTime = new Date(formData.endDateTime).toISOString();
    const isValidConsultantId = /^[a-fA-F0-9]{24}$/.test(formData.consultantId);
    const consultantField = {
      consultant: isValidConsultantId ? formData.consultantId : null,
    };

    const createInput = {
      patient: patientId,
      ...consultantField,
      treatment: formData.treatment,
      medium: formData.medium === 'in-person' ? AppointmentMedium.InPerson : AppointmentMedium.Online,
      notes: formData.notes,
      center: centerId,
      event: {
        startTime: startTime,
        endTime: endTime,
      },
    };

    try {
      const appointment_id = await createAppointment(createInput);
      onClose();
    } catch (error) {
      console.error('Appointment creation error:', error);
      setPaymentError('Failed to create appointment. Please try again.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[20] flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <Card
        className="bg-white h-fit w-full max-w-2xl rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {formTitle && (
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">{formTitle}</h2>
              <Button variant="ghost" onClick={onClose}>
                ✕
              </Button>
            </div>
          </CardHeader>
        )}

        <CardContent>
          {needsPayment && isProcessingPayment ? (
            <PublicRazorpayPayment
              amount={selectedTreatment?.price || 0}
              patientDetails={{ name: 'Patient Name', email: 'patient@example.com' }}
              patientId={patientId}
              centerId={centerId}
              onPaymentSuccess={async (paymentId) => {
                // Prevent multiple appointment creation calls
                if (paymentCompleted) {
                  console.log('⚠️ Payment already processed, skipping appointment creation');
                  return;
                }
                setPaymentCompleted(true);
                
                console.log('🎉 Payment successful, creating appointment...');
                
                // Only create appointment after successful payment
                const startTime = new Date(formData.startDateTime).toISOString();
                const endTime = new Date(formData.endDateTime).toISOString();
                const isValidConsultantId = /^[a-fA-F0-9]{24}$/.test(formData.consultantId);
                const consultantField = {
                  consultant: isValidConsultantId ? formData.consultantId : null,
                };
                
                const createInput = {
                  patient: patientId,
                  ...consultantField,
                  treatment: formData.treatment,
                  medium: formData.medium === 'in-person' ? AppointmentMedium.InPerson : AppointmentMedium.Online,
                  notes: formData.notes,
                  center: centerId,
                  event: {
                    startTime: startTime,
                    endTime: endTime,
                  },
                  // Note: paymentId is handled separately, not part of appointment creation
                };
                try {
                  const appointment_id = await createAppointment(createInput);
                  console.log('✅ Appointment created successfully:', appointment_id);
                  onClose();
                  router.push(`/onboarding-patient/thanks?appointment_id=${appointment_id}`);
                } catch (error) {
                  console.error('Error creating appointment after payment:', error);
                  setPaymentError('Payment completed but appointment creation failed. Please contact support.');
                  router.push('/onboarding-patient/failure');
                }
              }}
              onPaymentFailure={(error) => {
                setPaymentProcessed(true);
                setIsProcessingPayment(false);
                // Sanitize error message to prevent XSS
                const errorMsg = 'Payment process failed';
                router.push(`/onboarding-patient/failure?error=${encodeURIComponent(errorMsg)}`);
              }}
            />
          ) : (
            <div className="space-y-6 z-20">
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

          {/* Show payment error only for onboarding route */}
          {paymentError && needsPayment && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{paymentError}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="glow"
              className="w-full"
              onClick={handleSubmit}
              disabled={
                Boolean(savingAppointment) ||
                (Boolean(needsPayment) && Boolean(isProcessingPayment))
              }
            >
              {needsPayment && isProcessingPayment
                ? 'Processing Payment...'
                : savingAppointment
                ? 'Saving Appointment'
                : 'Create Appointment'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={onClose}
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
