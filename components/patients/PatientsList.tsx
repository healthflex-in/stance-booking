'use client';

import React from 'react';
import { toast } from 'sonner';
import { User, Maybe } from '@/gql/graphql';
import { useRouter } from 'next/navigation';
import {
  Edit,
  Mars,
  Copy,
  Venus,
  Receipt,
  Calendar,
  HelpCircle,
} from 'lucide-react';

import Table from '@/components/ui-atoms/Table';
import { Modal } from '@/components/ui-atoms/Modal';
import { Badge } from '@/components/ui-atoms/Badge';
import { Column } from '@/components/ui-atoms/Table';
import { toTitleCase } from '@/utils/standard-utils';
import {NewInvoiceForm} from '@/components/billing/forms';
import StanceHealthLoader from '../loader/StanceHealthLoader';
import NewAppointmentDrawer from '@/components/calendar/NewAppointmentDrawer';

interface PatientsListProps {
  centerId: string;
  patients: User[];
  loading: boolean;
  error?: Error;
  search: string;
  onSearchChange: (value: string) => void;
}

interface TableRow {
  id: string;
  seqNo: Maybe<string>;
  name: string;
  gender: string;
  phone: string;
  email: Maybe<string>;
  category: string;
  patientType: string;
  cohort: string;
  dob: Maybe<number>;
  status: string;
}

export default function PatientsList({
  centerId,
  patients,
  loading,
  error,
  search,
  onSearchChange,
}: PatientsListProps) {
  const router = useRouter();
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
  const [selectedPatientForInvoice, setSelectedPatientForInvoice] =
    React.useState<User | null>(null);
  const [showAppointmentDrawer, setShowAppointmentDrawer] =
    React.useState(false);
  const [selectedPatientForAppointment, setSelectedPatientForAppointment] =
    React.useState<Maybe<User>>(null);

  // Keep track of previous patients to show during loading
  const [displayPatients, setDisplayPatients] = React.useState<User[]>([]);

  // Check if we have any active search/filters
  const hasActiveFilters = search;

  // Only show loader if loading and no data exists and no active filters
  const shouldShowLoader =
    loading && patients.length === 0 && !hasActiveFilters;

  // Update display patients only when not loading or when we have new data
  React.useEffect(() => {
    if (!loading || patients.length > 0) {
      setDisplayPatients(patients);
    }
  }, [patients, loading]);

  const columns: Column<TableRow>[] = [
    {
      header: 'ID',
      accessor: 'seqNo',
      sortable: true,
      render: (value: string | number | boolean | null, row) => (
        <div className="flex items-center gap-2">
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <div
            className="text-sm text-gray-500 cursor-pointer hover:text-blue-500"
            onClick={() => {
              router.push(`/patients/${row.id}/profile`);
            }}
          >
            {value || '-'}
          </div>
          <Copy
            className="w-4 h-4 text-gray-500 cursor-pointer hover:text-blue-500"
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(String(value)).then(
                () => {
                  toast.success('Copied to clipboard');
                },
                () => {
                  toast.error('Failed to copy');
                }
              );
            }}
          />
        </div>
      ),
    },
    {
      header: 'Name',
      accessor: 'name',
      sortable: true,
      render: (value: string | number | boolean | null, row: TableRow) => {
        const getGenderIcon = (gender: string) => {
          const genderLower = gender.toLowerCase();
          if (genderLower === 'male') {
            return <Mars className="w-4 h-4 text-blue-500" />;
          } else if (genderLower === 'female') {
            return <Venus className="w-4 h-4 text-pink-500" />;
          } else {
            return <HelpCircle className="w-4 h-4 text-gray-500" />;
          }
        };

        const calculateAge = (dob: number | null) => {
          if (!dob) return 'N/A';
          const birthDate = new Date(dob * 1000);
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();

          if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
          ) {
            age--;
          }

          if (age < 0) {
            return birthDate.toLocaleDateString();
          }

          return `${age} years`;
        };

        return (
          // biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
          <div
            className="flex items-center gap-2 cursor-pointer "
            onClick={() => {
              router.push(`/patients/${row.id}/profile`);
            }}
          >
            {getGenderIcon(row.gender)}
            <div>
              <div className="font-medium hover:text-blue-500">{value}</div>
              <div className="text-sm text-gray-500">
                {calculateAge(row.dob)}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Contact',
      accessor: 'phone',
      sortable: true,
      render: (value: string | number | boolean | null, row: TableRow) => (
        <div className="flex flex-col gap-1">
          <a
            className="text-sm text-primary cursor-pointer hover:text-blue-500"
            href={`https://wa.me/91${row.phone}`}
            target="_blank"
            rel="noreferrer"
          >
            {row.phone}
          </a>
          <a
            className="text-sm text-gray-500 cursor-pointer hover:text-blue-500"
            href={`mailto:${row.email}`}
            target="_blank"
            rel="noreferrer"
          >
            {row.email}
          </a>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: 'category',
      sortable: true,
      render: (value: string | number | boolean | null) => (
        <Badge variant="secondary" className="text-xs">
          {toTitleCase(value?.toString() ?? 'N/A')}
        </Badge>
      ),
    },
    {
      header: 'Type & Cohort',
      accessor: 'patientType',
      sortable: true,
      render: (value: string | number | boolean | null, row: TableRow) => (
        <div>
          <div className="font-medium">
            {toTitleCase(value?.toString() ?? 'N/A')}
          </div>
          <div className="text-sm text-gray-500">
            {toTitleCase(row.cohort || 'N/A')}
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (value: string | number | boolean | null) => {
        const status = String(value).toLowerCase();
        let variant:
          | 'default'
          | 'secondary'
          | 'success'
          | 'destructive'
          | 'warning'
          | 'info' = 'destructive';

        if (status === 'lead') {
          variant = 'warning';
        } else if (status === 'active') {
          variant = 'success';
        } else if (status === 'package') {
          variant = 'info';
        }

        return <Badge variant={variant}>{value}</Badge>;
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      sortable: false,
      render: (value: string | number | boolean | null) => {
        const id = String(value);
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/patients/${id}/profile`);
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              title="Edit Patient"
            >
              <Edit className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const patient = displayPatients.find((p) => p._id === id);
                if (patient) {
                  setSelectedPatientForInvoice(patient);
                  setShowInvoiceModal(true);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              title="Create Invoice"
            >
              <Receipt className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                const patient = displayPatients.find((p) => p._id === id);
                if (patient) {
                  setSelectedPatientForAppointment(patient);
                  setShowAppointmentDrawer(true);
                }
              }}
              className="p-1 hover:bg-gray-100 rounded-full"
              title="Create Appointment"
            >
              <Calendar className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        );
      },
    },
  ];

  const tableData: TableRow[] = React.useMemo(() => {
    if (!displayPatients) return [];

    return displayPatients.map((patient) => {
      const profileData = patient.profileData;
      return {
        id: patient._id,
        seqNo: patient.seqNo || null,
        name: `${profileData?.firstName || ''} ${profileData?.lastName || ''
          }`.trim(),
        gender: profileData && 'gender' in profileData ? profileData.gender || '' : '',
        phone: patient.phone || '',
        email: patient.email || null,
        category: profileData && 'category' in profileData ? profileData.category || '' : '',
        patientType: profileData && 'patientType' in profileData ? profileData.patientType || '' : '',
        cohort: profileData && 'cohort' in profileData ? profileData.cohort || '' : '',
        dob: profileData && 'dob' in profileData ? profileData.dob || null : null,
        status: profileData && 'status' in profileData ? profileData.status || 'N/A' : 'N/A',
      };
    });
  }, [displayPatients]);

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-4 pb-4">
          <div className="min-h-[200px] flex items-center justify-center text-red-500 border border-red-200 rounded-lg bg-red-50">
            Error loading patients: {error.message}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {shouldShowLoader ? (
        <div className="px-4 pb-4">
          <div className="min-h-[400px] flex items-center justify-center border border-gray-200 rounded-lg bg-gray-50">
            <StanceHealthLoader data="patients" />
          </div>
        </div>
      ) : displayPatients.length === 0 && !loading ? (
        <div className="px-4 pb-4">
          <div className="min-h-[200px] flex items-center justify-center text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
            No patients found
          </div>
        </div>
      ) : (
        <Table data={tableData} columns={columns} />
      )}
      {showInvoiceModal && selectedPatientForInvoice && (
        <Modal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedPatientForInvoice(null);
          }}
        >
          <NewInvoiceForm
            onClose={() => {
              setShowInvoiceModal(false);
              setSelectedPatientForInvoice(null);
            }}
            centerId={centerId}
            initialData={{
              patient: selectedPatientForInvoice._id,
            }}
            existingData={{
              patient: selectedPatientForInvoice,
            }}
            onSuccess={() => {
              setShowInvoiceModal(false);
              setSelectedPatientForInvoice(null);
            }}
          />
        </Modal>
      )}
      {showAppointmentDrawer && selectedPatientForAppointment && (
        <NewAppointmentDrawer
          isOpen={showAppointmentDrawer}
          onClose={() => {
            setShowAppointmentDrawer(false);
            setSelectedPatientForAppointment(null);
          }}
          centerId={centerId}
          onSuccess={() => {
            setShowAppointmentDrawer(false);
            setSelectedPatientForAppointment(null);
          }}
        />
      )}
    </div>
  );
}
