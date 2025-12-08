import { FormData, FormErrors } from '@/types/StaffFormData';
import { AvailabilityStatus } from '@/gql/graphql';
import { generateRRule, convertTimeToMinutes } from '@/utils/staff-new-schedule';

export const validateForm = (formData: FormData): FormErrors => {
  const errors: FormErrors = {};

  if (!formData.centerId) {
    errors.centerId = 'Please select a centre';
  }

  if (formData.hostType === 'CONSULTANT' && !formData.consultantId) {
    errors.consultantId = 'Please select a consultant';
  }

  if (
    formData.scheduleType === 'recurring' &&
    formData.repeatDays.length === 0 &&
    !formData.endDate
  ) {
    errors.repeatDays = 'Please select at least one day or specify an end date';
  }

  if (!formData.startTime) {
    errors.startTime = 'Please select start time';
  }

  if (!formData.endTime) {
    errors.endTime = 'Please select end time';
  }

  if (!formData.title) {
    errors.title = 'Please enter a title';
  }

  return errors;
};

export const prepareEventInput = (formData: FormData) => {
  const recurrenceRule = generateRRule(formData);

  const eventInput = {
    title: formData.title,
    description: formData.description,
    eventType: 'AVAILABILITY',
    host:
      formData.hostType === 'CONSULTANT'
        ? formData.consultantId
        : formData.centerId,
    hostType: formData.hostType === 'CONSULTANT' ? 'USER' : 'CENTER',
    center: formData.centerId, // Always pass the center ID
    attendees: [],
    recurrenceRule,
  };

  const availabilityInput = {
    startTime: convertTimeToMinutes(formData.startTime),
    endTime: convertTimeToMinutes(formData.endTime),
    isAvailable: formData.availabilityStatus === AvailabilityStatus.Available,
    availabilityStatus: formData.availabilityStatus,
  };

  return { eventInput, availabilityInput };
};

export const getInitialFormData = (defaultCenterId: string): FormData => ({
  centerId: defaultCenterId,
  hostType: 'CENTER',
  consultantId: '',
  frequency: '1',
  frequencyUnit: 'Week',
  repeatDays: [],
  attendees: [],
  endType: 'never',
  endAfter: '12',
  endDate: '',
  startTime: '',
  endTime: '',
  title: '',
  description: '',
  availabilityStatus: AvailabilityStatus.Available,
  scheduleType: 'recurring',
  startDate: new Date().toISOString().split('T')[0],
}); 