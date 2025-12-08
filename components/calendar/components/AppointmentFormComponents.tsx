import React from 'react';

import { Input, Select, RadioGroup, CentreSelector } from '@/components/ui-atoms';

/**
 * Patient Selection Form Section
 */
interface PatientSelectionProps {
  patientId: string;
  centerId: string;
  patientsLoading: boolean;
  patientsHasMore?: boolean;
  patientsSearchValue?: string;
  formErrors: { patientId?: string };
  patientOptions: { value: string; label: string; disabled?: boolean }[];
  disabled?: boolean;

  onPatientsScroll?: () => void;
  onPatientChange: (value: string) => void;
  onCenterChange: (value: string[]) => void;
  onPatientsSearch?: (query: string) => void;
}

export const PatientSelection: React.FC<PatientSelectionProps> = ({
  patientId,
  centerId,
  formErrors,
  patientOptions,
  patientsLoading,
  patientsHasMore,
  patientsSearchValue,
  disabled = false,

  onCenterChange,
  onPatientChange,
  onPatientsSearch,
  onPatientsScroll,
}) => {
  return (
    <div className="mb-4">
      <div className="mb-4">
        <CentreSelector
          value={[centerId]}
          choiceType="single"
          onChange={(value) => onCenterChange(value)}
          className="w-full"
        />
      </div>
      <Select
        error=""
        value={patientId}
        label="Select Patient"
        onChange={(e) => {
          const value = typeof e === 'string' ? e : e.target.value;
          onPatientChange(value);
        }}
        options={patientOptions}
        loading={patientsLoading}
        hasMore={patientsHasMore}
        onSearch={onPatientsSearch}
        onScroll={onPatientsScroll}
        searchValue={patientsSearchValue}
        disabled={disabled}
      />
      <div className="h-1 mt-1">
        {formErrors.patientId && (
          <p className="text-xs text-red-500">{formErrors.patientId}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Consultant Selection Form Section
 */
interface ConsultantSelectionProps {
  consultantId: string;
  consultantOptions: { value: string; label: string; disabled?: boolean }[];
  consultantsLoading: boolean;
  formErrors: { consultantId?: string };
  onConsultantChange: (value: string) => void;
  disabled?: boolean;
}

export const ConsultantSelection: React.FC<ConsultantSelectionProps> = ({
  consultantId,
  consultantOptions,
  consultantsLoading,
  formErrors,
  onConsultantChange,
  disabled = false,
}) => {
  return (
    <div className="mb-6">
      <Select
        label="Select Consultant"
        value={consultantId}
        onChange={(e) => {
          const value = typeof e === 'string' ? e : e.target.value;
          onConsultantChange(value);
        }}
        options={consultantOptions}
        loading={consultantsLoading}
        error=""
        disabled={disabled}
      />
      <div className="h-1 mt-1">
        {formErrors.consultantId && (
          <p className="text-xs text-red-500">{formErrors.consultantId}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Treatment Selection Form Section
 */
interface TreatmentSelectionProps {
  treatmentId: string;
  treatmentOptions: { value: string; label: string; disabled?: boolean; duration?: number }[];
  treatmentsLoading: boolean;
  formErrors: { treatment?: string };
  onTreatmentChange: (value: string) => void;
  disabled?: boolean;
}

export const TreatmentSelection: React.FC<TreatmentSelectionProps> = ({
  treatmentId,
  treatmentOptions,
  treatmentsLoading,
  formErrors,
  onTreatmentChange,
  disabled = false,
}) => {
  return (
    <div className="mb-6">
      <Select
        label="Select Treatment"
        value={treatmentId}
        onChange={(e) => {
          const value = typeof e === 'string' ? e : e.target.value;
          onTreatmentChange(value);
        }}
        options={treatmentOptions}
        loading={treatmentsLoading}
        error=""
        disabled={disabled}
      />
      <div className="h-1 mt-1">
        {formErrors.treatment && (
          <p className="text-xs text-red-500">{formErrors.treatment}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Date Time Selection Form Section
 */
interface DateTimeSelectionProps {
  startDateTime: string;
  endDateTime: string;
  formErrors: { startDateTime?: string; endDateTime?: string };
  onStartDateChange: (value: string) => void;
  warningMessage?: string;
  unavailabilityWarning?: string;
  disabled?: boolean;
}

export const DateTimeSelection: React.FC<DateTimeSelectionProps> = ({
  startDateTime,
  endDateTime,
  formErrors,
  onStartDateChange,
  warningMessage,
  unavailabilityWarning,
  disabled = false,
}) => {
  return (
    <>
      <div className="mb-6">
        <Input
          type="datetime-local"
          label="Start Date and Time"
          value={startDateTime}
          onChange={(e) => onStartDateChange(e.target.value)}
          required
          error={formErrors.startDateTime}
          disabled={disabled}
        />
        <div className="h-1 mt-1">
          {!formErrors.startDateTime && warningMessage && (
            <p className="text-xs text-yellow-600">{warningMessage}</p>
          )}
        </div>
      </div>
      <div className="mb-6">
        <Input
          type="datetime-local"
          label="End Date and Time"
          value={endDateTime}
          disabled
          error=""
        />
        <div className="h-1 mt-1">
          {formErrors.endDateTime && (
            <p className="text-xs text-red-500">{formErrors.endDateTime}</p>
          )}
          {!formErrors.endDateTime && unavailabilityWarning && (
            <p className="text-xs text-orange-600">{unavailabilityWarning}</p>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Medium Selection Form Section
 */
interface MediumSelectionProps {
  medium: 'in-person' | 'online';
  onMediumChange: (value: 'in-person' | 'online') => void;
}

export const MediumSelection: React.FC<MediumSelectionProps> = ({ medium, onMediumChange }) => {
  return (
    <div className="space-y-2 mb-6">
      <RadioGroup
        label="Medium"
        options={[
          { value: 'in-person', label: 'In-person' },
          { value: 'online', label: 'Online' },
        ]}
        value={medium}
        onChange={(value) => onMediumChange(value as 'in-person' | 'online')}
      />
    </div>
  );
};

/**
 * Notes Form Section
 */
interface NotesFormSectionProps {
  notes: string;
  onNotesChange: (value: string) => void;
}

export const NotesFormSection: React.FC<NotesFormSectionProps> = ({ notes, onNotesChange }) => {
  return (
    <div className="relative">
      <label className="text-sm font-medium text-gray-700 block mb-1">
        Notes/Remarks
      </label>
      <textarea
        className="w-full rounded-lg border border-gray-300 p-2 min-h-[100px]"
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Enter any additional notes..."
      />
    </div>
  );
};
