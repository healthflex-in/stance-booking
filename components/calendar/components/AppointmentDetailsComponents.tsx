import React from 'react';
import { useRouter } from 'next/navigation';
import {
  User as UserIcon,
  Mail,
  Phone,
  Timer,
  MapPin,
  FileText,
  HousePlus,
  Microscope,
  Stethoscope,
  IndianRupee
} from 'lucide-react';

import { EMPTY_BIO_PLACEHOLDER } from '../types';
import { Card } from '@/components/ui-atoms/Card';
import { Patient, Consultant, User, Center, Service } from '@/gql/graphql';

interface PatientInfoSectionProps {
  patient?: User | null;
}

interface ConsultantInfoSectionProps {
  consultant?: User | null;
}

interface CenterInfoSectionProps {
  center?: Center | null;
}

interface TreatmentInfoSectionProps {
  treatment?: Service | null;
}

interface NotesSectionProps {
  notes: string;
}

// Type guards for patient and consultant
export const isPatient = (profileData: unknown): profileData is Patient => {
  return (profileData as { __typename?: string })?.__typename === 'Patient';
};

export const isConsultant = (profileData: unknown): profileData is Consultant => {
  return (profileData as { __typename?: string })?.__typename === 'Consultant';
};

export const PatientInfoSection: React.FC<PatientInfoSectionProps> = ({ patient }) => {
  const router = useRouter();
  
  if (!patient) return null;

  const isPatientType = isPatient(patient.profileData);

  const handlePatientNameClick = () => {
    router.push(`/patients/${patient._id}/timeline`);
  };

  return (
    <Card className="p-4">
      <h3 className="text-base font-medium mb-3 text-gray-700">Patient Information</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <UserIcon className="w-5 h-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p 
              className="font-medium cursor-pointer hover:text-accent hover:underline"
              onClick={handlePatientNameClick}
            >
              {patient.profileData?.firstName} {patient.profileData?.lastName}
            </p>
            {isPatientType && patient.profileData && 'bio' in patient.profileData && patient.profileData.bio && patient.profileData.bio !== EMPTY_BIO_PLACEHOLDER && (
              <div className="mt-1">
                <p className="text-gray-400">{patient.profileData.bio}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-1">
              {isPatientType && patient.profileData && 'gender' in patient.profileData && patient.profileData.gender && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {patient.profileData.gender}
                </span>
              )}
              {isPatientType && patient.profileData && 'category' in patient.profileData && patient.profileData.category && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {patient.profileData.category.toUpperCase()}
                </span>
              )}
            </div>
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{patient.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{patient.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Consultant Information Section

export const ConsultantInfoSection: React.FC<ConsultantInfoSectionProps> = ({ consultant }) => {
  if (!consultant) return null;

  const isConsultantType = isConsultant(consultant.profileData);

  return (
    <Card className="p-4">
      <h3 className="text-base font-medium mb-3 text-gray-700">Consultant Information</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Stethoscope className="w-5 h-5 text-gray-500 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium">
              {consultant.profileData?.firstName} {consultant.profileData?.lastName}
            </p>
            {isConsultantType && consultant.profileData && 'bio' in consultant.profileData && consultant.profileData.bio && consultant.profileData.bio !== EMPTY_BIO_PLACEHOLDER && (
              <div className="mt-1">
                <p className="text-gray-400">{consultant.profileData.bio}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-2 mt-2">
              {isConsultantType && consultant.profileData && 'designation' in consultant.profileData && consultant.profileData.designation && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {consultant.profileData.designation}
                </span>
              )}
              {isConsultantType && consultant.profileData && 'specialization' in consultant.profileData && consultant.profileData.specialization && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  {consultant.profileData.specialization}
                </span>
              )}
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>{consultant.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{consultant.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

// Center Information Section

export const CenterInfoSection: React.FC<CenterInfoSectionProps> = ({ center }) => {
  if (!center) return null;

  return (
    <Card className="p-4">
      <h3 className="text-base font-medium mb-3 text-gray-700">Center Information</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <HousePlus className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium">{center.name}</p>
            <p className="mt-2 text-gray-400">ID: {center.seqNo}</p>
            {center.phone && (
              <div className="flex items-center gap-2 mt-2">
                <Phone className="w-4 h-4" />
                <span>{center.phone}</span>
              </div>
            )}
            {center.address && (
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="w-4 h-4" />
                <span>{center.address.street}, {center.address.city}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Treatment Information Section

export const TreatmentInfoSection: React.FC<TreatmentInfoSectionProps> = ({ treatment }) => {
  if (!treatment) return null;

  return (
    <Card className="p-4">
      <h3 className="text-base font-medium mb-3 text-gray-700">Treatment Information</h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Microscope className="w-5 h-5 text-gray-500 mt-0.5" />
          <div>
            <p className="font-medium">{treatment.name}</p>
            {treatment.internalName && (
              <p className="mt-2 text-gray-400">{treatment.internalName}</p>
            )}
            <div className="flex gap-4 mt-2">
              {treatment.price && (
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  <span>{treatment.price}</span>
                </div>
              )}
              {treatment.duration && (
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4" />
                  <span>{treatment.duration} min</span>
                </div>
              )}
            </div>
            {treatment.description && treatment.description !== null && (
              <p className="text-gray-400 mt-2">{treatment.description}</p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Notes Section

export const NotesSection: React.FC<NotesSectionProps> = ({ notes }) => {
  if (!notes || notes === EMPTY_BIO_PLACEHOLDER) return null;

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <FileText className="w-5 h-5 text-gray-500 mt-0.5" />
        <div>
          <h3 className="text-base font-medium mb-2 text-gray-700">Notes</h3>
          <p className="text-gray-400">{notes}</p>
        </div>
      </div>
    </Card>
  );
};
