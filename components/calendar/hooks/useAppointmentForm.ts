import React from 'react';
import { toast } from 'sonner';
import { RRule } from 'rrule';
import { useMutation, useQuery } from '@apollo/client';

import { useDebounce } from '@/hooks';
import { AppointmentEvent, UserType, PaginationDirection, UserSortField, SortOrder, User, Service, Center, AppointmentMedium, AvailabilityEvent, AppointmentStatus } from '@/gql/graphql';
import { formatDateTimeForInput, formatDate, formatTime } from '@/components/calendar/utils/dateTimeFormatters';
import { GET_PATIENTS, GET_SERVICES, GET_CONSULTANTS, CREATE_APPOINTMENT, UPDATE_APPOINTMENT, GET_CENTERS, GET_AVAILABILITY_EVENTS } from '@/gql/queries';

// Using GraphQL types directly - no custom interfaces needed

interface FormData {
  patientId: string;
  consultantId: string;
  treatment: string;
  startDateTime: string;
  endDateTime: string;
  medium: 'in-person' | 'online';
  notes: string;
  centerId: string;
}

interface FormErrors {
  patientId?: string;
  consultantId?: string;
  treatment?: string;
  startDateTime?: string;
  endDateTime?: string;
  general?: string;
  centerId?: string;
}

interface WhatsAppData {
  message: string;
  phoneNumber: string;
}

// Using GraphQL input types directly
interface CreateAppointmentInput {
  patient: string;
  consultant?: string | null;
  treatment: string;
  medium: AppointmentMedium;
  notes: string;
  center: string;
  category?: string;
  status?: string;
  visitType?: string;
  event: {
    startTime: string;
    endTime: string;
  };
}

interface UpdateAppointmentInput {
  consultant?: string | null;
  treatment: string;
  medium: AppointmentMedium;
  notes: string;
  status?: string;
  event: {
    startTime: string;
    endTime: string;
  };
}

interface UseAppointmentFormResult {
  formData: FormData;
  formErrors: FormErrors;
  warningMessage?: string;
  unavailabilityWarning?: string;
  patientType: 'existing' | 'new';
  showWhatsAppDialog: boolean;
  pendingClose: boolean;
  whatsappData: WhatsAppData;
  patientOptions: { value: string; label: string; disabled?: boolean }[];
  consultantOptions: { value: string; label: string; disabled?: boolean }[];
  treatmentOptions: {
    value: string;
    label: string;
    disabled?: boolean;
    duration?: number;
    price?: number;
  }[];
  patientsLoading: boolean;
  consultantsLoading: boolean;
  servicesLoading: boolean;
  savingAppointment: boolean;
  updatingAppointment: boolean;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  setFormErrors: React.Dispatch<React.SetStateAction<FormErrors>>;
  setPatientType: React.Dispatch<React.SetStateAction<'existing' | 'new'>>;
  setShowWhatsAppDialog: React.Dispatch<React.SetStateAction<boolean>>;
  setPendingClose: React.Dispatch<React.SetStateAction<boolean>>;
  setWhatsappData: React.Dispatch<React.SetStateAction<WhatsAppData>>;
  validateForm: () => boolean;
  handleNewPatientSuccess: (
    newPatientId: string,
    newCenterId: string
  ) => Promise<void>;
  createAppointment: (input: CreateAppointmentInput) => Promise<string | null>;
  updateAppointment: (input: UpdateAppointmentInput, id: string) => void;
  refetchPatients: () => Promise<unknown>;
  isDateInPast: (dateTimeStr: string) => boolean;
  resetForm: () => void;
  handlePatientsSearch: (query: string) => void;
  handlePatientsScroll: () => void;
  handlePatientSelection: () => void;
  patientsSearchValue: string;
  patientsHasMore: boolean;
}

/**
 * Custom hook for appointment form management
 */
export function useAppointmentForm(
  centerId: string,
  onSuccess?: () => void,
  onClose?: () => void,
  initialDateTime?: Date | null,
  appointmentToEdit?: AppointmentEvent | null,
  initialConsultantId?: string | null,
  isOpen?: boolean,
  availabilityEvents: AvailabilityEvent[] = []
): UseAppointmentFormResult {
  const [selectedPatientData, setSelectedPatientData] = React.useState<{ id: string, label: string } | null>(null);

  // Create stable reference for initial form state
  const createInitialFormState = React.useCallback((): FormData => ({
    notes: '',
    patientId: '',
    treatment: '',
    endDateTime: '',
    medium: 'in-person',
    centerId: centerId || '',
    consultantId: initialConsultantId || '',
    startDateTime: formatDateTimeForInput(initialDateTime || new Date()),
  }), [initialDateTime, initialConsultantId, centerId]);

  const [pendingClose, setPendingClose] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<FormErrors>({});
  const [showWhatsAppDialog, setShowWhatsAppDialog] = React.useState(false);
  const [formData, setFormData] = React.useState<FormData>(createInitialFormState);
  const [patientType, setPatientType] = React.useState<'existing' | 'new'>('existing');
  const [whatsappData, setWhatsappData] = React.useState<WhatsAppData>({
    message: '',
    phoneNumber: '',
  });

  // Search state for patients infinite scroll
  const [patientsSearch, setPatientsSearch] = React.useState('');
  const [lastSearchTerm, setLastSearchTerm] = React.useState('');
  const debouncedPatientsSearch = useDebounce(patientsSearch, 500);

  // Reset form function using React.useCallback to prevent recreating on every render
  const resetForm = React.useCallback(() => {
    const newFormState = createInitialFormState();
    setFormData(newFormState);
    setFormErrors({});
    setPatientType('existing');
    setPatientsSearch('');
  }, [createInitialFormState]);

  // Reset form when drawer closes
  React.useEffect(() => {
    if (isOpen === false) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  // When appointmentToEdit changes, update the form data
  React.useEffect(() => {
    if (appointmentToEdit) {
      const patient = appointmentToEdit.appointment?.patient;
      const consultant = appointmentToEdit.appointment?.consultant;

      const medium: FormData['medium'] =
        appointmentToEdit.appointment?.medium === AppointmentMedium.Online ? 'online' : 'in-person';

      setFormData({
        medium,
        centerId: centerId || '',
        patientId: patient?._id || '',
        consultantId: consultant?._id || '',
        notes: appointmentToEdit.appointment?.notes || '',
        treatment: appointmentToEdit.appointment?.treatment?._id || '',
        startDateTime: formatDateTimeForInput(new Date(appointmentToEdit.startTime)),
        endDateTime: formatDateTimeForInput(new Date(appointmentToEdit.endTime)),
      });
    } else if (initialDateTime && !appointmentToEdit) {
      setFormData((prev) => ({
        ...prev,
        endDateTime: '',
        startDateTime: formatDateTimeForInput(initialDateTime),
        consultantId: initialConsultantId || prev.consultantId,
      }));
    }
  }, [appointmentToEdit, initialDateTime, initialConsultantId, centerId]);

  // Queries - Updated to use paginated API with infinite scroll
  const {
    data: patientsData,
    loading: patientsLoading,
    fetchMore: fetchMorePatients,
    refetch: refetchPatients,
  } = useQuery(GET_PATIENTS, {
    variables: {
      userType: UserType.Patient,
      centerId: formData.centerId ? [formData.centerId] : [],
      ...(debouncedPatientsSearch.trim() && { search: debouncedPatientsSearch.trim() }),
      pagination: {
        limit: 50,
        direction: PaginationDirection.Forward,
      },
      sort: {
        order: SortOrder.Desc,
        field: UserSortField.CreatedAt,
      },
    },
    skip: !formData.centerId,
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  // Reset to first page when search changes
  // Only refetch when search term changes and is not empty
  React.useEffect(() => {
    if (formData.centerId && debouncedPatientsSearch.trim() && debouncedPatientsSearch !== lastSearchTerm) {
      setLastSearchTerm(debouncedPatientsSearch);
      refetchPatients({
        userType: UserType.Patient,
        centerId: formData.centerId ? [formData.centerId] : [],
        search: debouncedPatientsSearch.trim(),
        pagination: {
          limit: 50,
          direction: PaginationDirection.Forward,
        },
        sort: {
          order: SortOrder.Desc,
          field: UserSortField.CreatedAt,
        },
      });
    }
  }, [debouncedPatientsSearch, formData.centerId, refetchPatients, lastSearchTerm]);

  const {
    data: consultantsData,
    loading: consultantsLoading,
  } = useQuery(GET_CONSULTANTS, {
    variables: {
      userType: UserType.Consultant,
      centerId: formData.centerId ? [formData.centerId] : [],
      pagination: {
        limit: 100, // Get all consultants for the dropdown
        direction: PaginationDirection.Forward,
      },
      sort: {
        order: SortOrder.Desc,
        field: UserSortField.CreatedAt,
      },
    },
    fetchPolicy: 'cache-first',
  });

  const { data: servicesData, loading: servicesLoading } = useQuery(
    GET_SERVICES,
    {
      variables: {
        centerId: formData.centerId,
      },
      skip: !formData.centerId,
      fetchPolicy: 'network-only',
    }
  );



  React.useEffect(() => {
    if (formData.patientId && patientsData?.users?.data) {
      const selectedPatient = patientsData.users.data.find((p: User) => p._id === formData.patientId);
      if (selectedPatient) {
        setSelectedPatientData({
          id: selectedPatient._id,
          label: `${selectedPatient.profileData?.firstName || ''} ${selectedPatient.profileData?.lastName || ''}`.trim() || selectedPatient.email,
        });
      }
    } else if (!formData.patientId) {
      setSelectedPatientData(null);
    }
  }, [formData.patientId, patientsData]);

  // Infinite scroll handlers
  const handlePatientsSearch = React.useCallback((query: string) => {
    setPatientsSearch(query);
  }, []);

  const handlePatientSelection = React.useCallback(() => {
    // Store the selected patient data before clearing search
    if (formData.patientId && patientsData?.users?.data) {
      const selectedPatient = patientsData.users.data.find((p: User) => p._id === formData.patientId);
      if (selectedPatient) {
        setSelectedPatientData({
          id: selectedPatient._id,
          label: `${selectedPatient.profileData?.firstName || ''} ${selectedPatient.profileData?.lastName || ''}`.trim() || selectedPatient.email,
        });
      }
    }
  }, [formData.patientId, patientsData]);

  const handlePatientsScroll = React.useCallback(async () => {
    const pagination = patientsData?.users?.pagination;
    if (pagination?.hasNext && pagination.nextCursor && !patientsLoading) {
      try {
        await fetchMorePatients({
          variables: {
            pagination: {
              cursor: pagination.nextCursor,
              limit: 50,
              direction: PaginationDirection.Forward,
            },
          },
          updateQuery: (prev, { fetchMoreResult }) => {
            if (!fetchMoreResult?.users?.data) return prev;

            return {
              ...prev,
              users: {
                ...fetchMoreResult.users,
                data: [
                  ...(prev.users?.data || []),
                  ...fetchMoreResult.users.data,
                ],
              },
            };
          },
        });
      } catch (error) {
        console.error('Error fetching more patients:', error);
      }
    }
  }, [patientsData, patientsLoading, fetchMorePatients]);

  // Updated function signature and implementation
  const createAppointmentMessage = (
    patientName: string,
    consultantName: string,
    treatment: string,
    date: string,
    time: string,
    centerNameParam: string,
    centerLocationParam: string
  ): string => {
    const safeName = patientName?.trim() || 'Patient';
    const safeConsultant = consultantName?.trim() || 'Doctor';
    const safeDate = date?.trim() || 'Date TBD';
    const safeTime = time?.trim() || 'Time TBD';
    const safeCenterName = centerNameParam?.trim() || 'Our Center';
    const safeCenterLocation =
      centerLocationParam?.trim() || 'Please contact us for directions';

    return `Dear ${safeName}, Your appointment with ${safeConsultant} at ${safeCenterName} has been booked successfully for ${safeDate} at ${safeTime}
Visit us: ${safeCenterLocation}`;
  };

  const { data: centersData } = useQuery(GET_CENTERS, { fetchPolicy: 'cache-first' });

  // Find the specific center from the list of all centers
  const centerData = React.useMemo(() => {
    if (!centersData?.centers || !centerId) return null;

    const foundCenter = centersData.centers.find(
      (center: Center) => center._id === centerId
    );
    return foundCenter ? { center: foundCenter } : null;
  }, [centersData, centerId]);

  // Create appointment mutation
  const [createAppointmentMutation, { loading: savingAppointment }] = useMutation(
    CREATE_APPOINTMENT,
    {
      onCompleted: (data) => {
        toast.success('Appointment created successfully');

        try {
          const patient = getPatientData(formData.patientId, (patientsData?.users?.data || []) as User[]);
          const consultantName = getConsultantName(formData.consultantId, (consultantsData?.users?.data || []) as User[]);
          const treatmentName = getTreatmentName(formData.treatment, (servicesData?.services || []) as Service[]);
          const date = formatDate(new Date(formData.startDateTime).getTime());
          const time = formatTime(new Date(formData.startDateTime).getTime());

          const centerName = centerData?.center?.name || 'Our Center';
          const centerLocation = centerData?.center?.location || 'Please contact us for directions';

          const messageText = createAppointmentMessage(
            patient.name,
            consultantName,
            treatmentName,
            date,
            time,
            centerName,
            centerLocation
          );

          // Get phone from created appointment's patient data if available
          const phoneNumber = data?.createAppointment?.patient?.phone || patient.phone || '';

          if (messageText && messageText.trim().length > 0) {
            setWhatsappData({
              message: messageText,
              phoneNumber: phoneNumber,
            });
            setPendingClose(true);
            setShowWhatsAppDialog(true);
          } else {
            onSuccess?.();
            onClose?.();
          }
        } catch (error) {
          console.error('Error creating WhatsApp message:', error);
          onSuccess?.();
          onClose?.();
        }
      },
      onError: (error) => {
        toast.error('Failed to create appointment: ' + error.message);
      },
    });

  // Update appointment mutation
  const [updateAppointmentMutation, { loading: updatingAppointment }] =
    useMutation(UPDATE_APPOINTMENT, {
      onCompleted: () => {
        toast.success('Appointment updated successfully');
        onSuccess?.();
        onClose?.();
      },
      onError: (error) => {
        toast.error('Failed to update appointment: ' + error.message);
      },
    });

  // Format options for select components - Updated to use paginated data structure
  const patientOptions = React.useMemo(() => {
    if (!patientsData?.users?.data) return [{ value: '', label: 'Select Patient', disabled: true }];

    const baseOptions = [
      { value: '', label: 'Select Patient', disabled: true },
      ...patientsData.users.data.map((patient: User) => ({
        value: patient._id,
        label:
          `${patient.profileData?.firstName || ''} ${patient.profileData?.lastName || ''}`.trim() || patient.email,
      })),
    ];

    // If we have a selected patient that's not in the current options, add it
    if (selectedPatientData && !baseOptions.find(opt => opt.value === selectedPatientData.id)) {
      baseOptions.splice(1, 0, {
        value: selectedPatientData.id,
        label: selectedPatientData.label,
      });
    }

    return baseOptions;
  }, [patientsData, selectedPatientData]);

  const consultantOptions = React.useMemo(() => {
    if (!consultantsData?.users?.data) return [{ value: '', label: 'Select Consultant', disabled: true }];

    return [
      { value: '', label: 'Select Consultant', disabled: true },
      ...consultantsData.users.data.map((consultant: User) => ({
        value: consultant._id,
        label:
          `${consultant.profileData?.firstName || ''} ${consultant.profileData?.lastName || ''
            }`.trim() || consultant.email,
      })),
    ];
  }, [consultantsData]);

  const treatmentOptions = React.useMemo(() => {
    if (!servicesData?.services)
      return [{ value: '', label: 'Select Treatment', disabled: true }];

    return [
      { value: '', label: 'Select Treatment', disabled: true },
      ...servicesData.services.map((service: Service) => ({
        value: service._id,
        label: service.name || 'Unknown Service',
        duration: service.duration,
        price: service.price,
      })),
    ];
  }, [servicesData]);

  // Utility functions
  const isDateInPast = (dateTimeStr: string): boolean => {
    const selectedDate = new Date(dateTimeStr);
    const currentDate = new Date();
    return selectedDate < currentDate;
  };

  // Add a warning message if the appointment is in the past, but do not block submission
  const warningMessage = React.useMemo(() => {
    if (formData.startDateTime && isDateInPast(formData.startDateTime)) {
      return 'Warning: The selected start date and time is in the past.';
    }
    return undefined;
  }, [formData.startDateTime]);

  // Add unavailability warning message - only for individual consultant
  const unavailabilityWarning = React.useMemo(() => {
    if (!formData.endDateTime || !formData.consultantId || !availabilityEvents || !availabilityEvents.length) return undefined;
    
    const appointmentDate = new Date(formData.startDateTime);
    const startTime = new Date(formData.startDateTime);
    const endTime = new Date(formData.endDateTime);
    const startTimeNum = startTime.getHours() * 100 + startTime.getMinutes();
    const endTimeNum = endTime.getHours() * 100 + endTime.getMinutes();
    
    // Filter events for the specific appointment date
    const relevantEvents = availabilityEvents.filter(event => {
      // Skip deleted events
      if (event.isActive === false) return false;
      
      // ONLY individual consultant events - ignore ALL center events
      if (event.hostType === 'CENTER') return false;
      if (event.hostType !== 'USER') return false;
      
      // Only check events where the HOST is the selected consultant
      if (event.host._id !== formData.consultantId) return false;
      
      // ONLY unavailable events - skip available ones
      if (event.isAvailable === true) return false;
      if (event.availabilityStatus === 'AVAILABLE') return false;
      
      // Check if event applies to the appointment date
      if (event.recurrenceRule?.rrule) {
        try {
          const cleanRule = event.recurrenceRule.rrule.replace('RRULE:', '');
          const rruleInstance = RRule.fromString(cleanRule);
          const appointmentDateOnly = new Date(appointmentDate);
          appointmentDateOnly.setHours(0, 0, 0, 0);
          
          // For one-time events
          if (rruleInstance.options.count === 1) {
            if (!event.recurrenceRule.startDate) return false;
            const eventDate = new Date(event.recurrenceRule.startDate);
            eventDate.setHours(0, 0, 0, 0);
            return eventDate.getTime() === appointmentDateOnly.getTime();
          }
          
          // For recurring events
          const occurrences = rruleInstance.between(
            appointmentDateOnly,
            new Date(appointmentDateOnly.getTime() + 24 * 60 * 60 * 1000 - 1),
            true
          );
          return occurrences.length > 0;
        } catch (error) {
          return false;
        }
      } else {
        // For non-recurring events
        const eventDate = new Date(event.recurrenceRule?.startDate || event.startTime || 0);
        const appointmentDateOnly = new Date(appointmentDate);
        appointmentDateOnly.setHours(0, 0, 0, 0);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === appointmentDateOnly.getTime();
      }
    });
    
    // Check for time conflicts with relevant events
    const conflictingEvent = relevantEvents.find(event => {
      return startTimeNum < event.endTime && endTimeNum > event.startTime;
    });
    
    if (conflictingEvent) {
      const eventStartHour = Math.floor(conflictingEvent.startTime / 100);
      const eventStartMin = conflictingEvent.startTime % 100;
      const eventEndHour = Math.floor(conflictingEvent.endTime / 100);
      const eventEndMin = conflictingEvent.endTime % 100;
      const startTimeStr = `${eventStartHour}:${eventStartMin.toString().padStart(2, '0')}`;
      const endTimeStr = `${eventEndHour}:${eventEndMin.toString().padStart(2, '0')}`;
      const eventType = conflictingEvent.availabilityStatus === 'BREAK' ? 'break' : 
                       conflictingEvent.availabilityStatus === 'MEETING' ? 'meeting' : 
                       conflictingEvent.availabilityStatus === 'LEAVE' ? 'leave' : 
                       conflictingEvent.availabilityStatus === 'HOLIDAY' ? 'holiday' : 
                       conflictingEvent.availabilityStatus === 'INTERVIEW' ? 'interview' : 
                       conflictingEvent.availabilityStatus === 'UNAVAILABLE' ? 'unavailable period' : 
                       'meeting';
      return `Warning: There is a ${eventType} from ${startTimeStr} - ${endTimeStr}`;
    }
    
    return undefined;
  }, [formData.endDateTime, formData.consultantId, formData.startDateTime, availabilityEvents]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.patientId) {
      errors.patientId = 'Please select a patient';
    }

    if (!formData.treatment) {
      errors.treatment = 'Please select a treatment';
    }
    if (!formData.startDateTime) {
      errors.startDateTime = 'Please select a start date and time';
    }
    // Do NOT block if in the past; just warn (handled above)
    if (!formData.endDateTime) {
      errors.endDateTime = 'End date and time is required';
    }
    if (!formData.centerId) {
      errors.centerId = 'Please select a centre';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNewPatientSuccess = async (
    newPatientId: string,
    newCenterId: string
  ) => {
    await refetchPatients();

    setPatientType('existing');
    setFormData((prev) => ({
      ...prev,
      patientId: newPatientId,
      centerId: newCenterId,
    }));
  };

  // Helper functions for WhatsApp message - Updated to use paginated data structure
  const getPatientData = (patientId: string, patients: User[]) => {
    if (!patientId || !patients.length) {
      return { name: 'Patient', phone: '' };
    }

    const patient = patients.find((u: User) => u._id === patientId);

    if (!patient) {
      return { name: 'Patient', phone: '' };
    }

    const patientName =
      `${patient.profileData?.firstName || ''} ${patient.profileData?.lastName || ''
        }`.trim() ||
      patient.email ||
      'Patient';

    const phone = patient.phone || '';

    return { name: patientName, phone };
  };

  const getConsultantName = (
    consultantId: string,
    consultants: User[]
  ): string => {
    if (!consultantId || !consultants.length) {
      return 'Consultant';
    }

    const consultant = consultants.find((u: User) => u._id === consultantId);

    if (!consultant) {
      return 'Consultant';
    }

    return (
      `${consultant.profileData?.firstName || ''} ${consultant.profileData?.lastName || ''
        }`.trim() ||
      consultant.email ||
      'Consultant'
    );
  };

  const getTreatmentName = (treatmentId: string, services: Service[]): string => {
    if (!treatmentId || !services.length) {
      return 'Treatment';
    }

    const treatment = services.find((s: Service) => s._id === treatmentId);

    if (!treatment) {
      return 'Treatment';
    }

    return treatment.name || 'Treatment';
  };

  // Public methods
  const createAppointment = async (input: CreateAppointmentInput): Promise<string | null> => {
    try {
      const { data } = await createAppointmentMutation({
        variables: {
          input,
        },
      });

      const appointmentId = data?.createAppointment?._id;
      return appointmentId;
    } catch (error) {
      console.error("Failed to create appointment:", error);
      toast.error('Failed to create appointment');
      return null;
    }
  };

  const updateAppointment = (input: UpdateAppointmentInput, id: string) => {
    const cleanInput = { ...input };
    if ('eventAttendees' in cleanInput) {
      delete (cleanInput as any).eventAttendees;
    }

    updateAppointmentMutation({
      variables: {
        input: cleanInput,
        id,
      },
    });
  };

  // Calculate end date time when start time or treatment changes
  React.useEffect(() => {
    if (formData.startDateTime && formData.treatment) {
      const selectedService = treatmentOptions.find(
        (option) => option.value === formData.treatment && option.duration
      );

      if (selectedService?.duration) {
        const start = new Date(formData.startDateTime);
        const end = new Date(
          start.getTime() + selectedService.duration * 60000
        );

        setFormData((prev) => ({
          ...prev,
          endDateTime: formatDateTimeForInput(end),
        }));
      }
    }
  }, [formData.startDateTime, formData.treatment, treatmentOptions]);

  return {
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
    setFormErrors,
    setPatientType,
    setShowWhatsAppDialog,
    setPendingClose,
    setWhatsappData,
    validateForm,
    handleNewPatientSuccess,
    createAppointment,
    updateAppointment,
    refetchPatients,
    isDateInPast,
    resetForm,
    handlePatientsSearch,
    handlePatientsScroll,
    handlePatientSelection,
    patientsSearchValue: patientsSearch,
    patientsHasMore: patientsData?.users?.pagination?.hasNext || false,
  };
}