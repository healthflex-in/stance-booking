import { AppointmentEvent, User, Service, Center, AvailabilityEvent } from '@/gql/graphql';

// Use User type from GraphQL schema directly
export type ConsultantData = User;

export interface AppointmentCalendarViewProps {
  // Date and view configuration
  currentDate: Date;
  viewMode: 'day' | 'week';
  loading: boolean;

  // Data arrays - using GraphQL types directly
  appointments: AppointmentEvent[];
  availabilityEvents: AvailabilityEvent[];
  consultantsData?: User[]; // Consultants are Users with Consultant profileData

  // Selection filters
  selectedCenterIds: string[];
  selectedConsultantIds?: string[];

  // Display configuration
  consultantColorMap: { [key: string]: string };

  // Event handlers
  refetchEvents: () => void;
  onEmptySlotClick?: (date: Date, consultantId?: string) => void;
}

/**
 * Common props shared between calendar view components (Daily and Weekly)
 */
export interface CalendarViewCommonProps {
  currentDate: Date;
  consultantsData: User[]; // Using GraphQL User type
  appointments: AppointmentEvent[]; // Using GraphQL type
  onEmptySlotClick?: (date: Date, consultantId?: string) => void;
  consultantIndices: { [key: string]: number };
  consultantColorMap: { [key: string]: string };
  onAppointmentClick: (appointment: AppointmentEvent) => void;
}

// Use GraphQL types directly - no need for custom interfaces
// PatientInfo = User (with Patient profileData)
// ConsultantInfo = User (with Consultant profileData) 
// CenterInfo = Center
// TreatmentInfo = Service

// Component prop interfaces moved to individual component files

export const EMPTY_BIO_PLACEHOLDER = ",";
