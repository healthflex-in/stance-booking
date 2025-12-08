import { AppointmentStatus, AppointmentVisitType, AppointmentMedium } from '@/gql/graphql';

/**
 * Get CSS classes for appointment status
 */
export const getStatusColor = (status?: AppointmentStatus): string => {
  switch (status) {
    case AppointmentStatus.Booked:
      return 'bg-green-100 text-green-800';
    case AppointmentStatus.Cancelled:
      return 'bg-red-100 text-red-800';
    case AppointmentStatus.Visited:
      return 'bg-blue-100 text-blue-800';
    case AppointmentStatus.Paid:
      return 'bg-yellow-100 text-yellow-800';
    case AppointmentStatus.PrePaid:
      return 'bg-lime-100 text-lime-800';
    case AppointmentStatus.TokenPaid:
      return 'bg-emerald-100 text-emerald-800';
    case AppointmentStatus.TokenPending:
      return 'bg-orange-100 text-orange-800';
    case AppointmentStatus.InvoiceGenerated:
      return 'bg-purple-100 text-purple-800';
    case AppointmentStatus.Waitlisted:
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get CSS classes for visit type
 */
export const getVisitTypeColor = (visitType?: AppointmentVisitType): string => {
  switch (visitType) {
    case AppointmentVisitType.FirstVisit:
      return 'bg-purple-100 text-purple-800';
    case AppointmentVisitType.FollowUp:
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get CSS classes for appointment medium
 */
export const getMediumColor = (medium?: AppointmentMedium): string => {
  switch (medium) {
    case AppointmentMedium.InPerson:
      return 'bg-teal-100 text-teal-800';
    case AppointmentMedium.Online:
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Get human-readable label for visit type
 */
export const getVisitTypeLabel = (visitType?: AppointmentVisitType): string => {
  switch (visitType) {
    case AppointmentVisitType.FirstVisit:
      return 'First Visit';
    case AppointmentVisitType.FollowUp:
      return 'Follow-up';
    default:
      return visitType || '';
  }
};

/**
 * Get human-readable label for appointment medium
 */
export const getMediumLabel = (medium?: AppointmentMedium): string => {
  switch (medium) {
    case AppointmentMedium.InPerson:
      return 'In Person';
    case AppointmentMedium.Online:
      return 'Online';
    default:
      return medium || '';
  }
};
