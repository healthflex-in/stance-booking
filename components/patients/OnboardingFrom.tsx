'use client'

import React from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLazyQuery, useMutation, useQuery } from "@apollo/client";

import { Input } from "../ui-atoms/Input";
import { Button } from "../ui-atoms/Button";
import { Select } from "../ui-atoms/Select";
import { RadioGroup } from "../ui-atoms/RadioGroup";
import { Card, CardContent, CardHeader } from "../ui-atoms/Card";
import { CREATE_PATIENT, GET_CENTERS, GET_CONSULTANTS, GET_PATIENTS, PATIENT_EXISTS } from "@/gql/queries";
import { PatientCategory, PatientCohort, Gender, PatientType, ReferralType, User, Center } from "@/gql/graphql";

/**
 * Category options
 */
const categoryOptions = [
  { value: '', label: 'Select Category' },
  { value: PatientCategory.Referral, label: 'Referral' },
  { value: PatientCategory.Organic, label: 'Organic' },
  { value: PatientCategory.Doctor, label: 'Doctor' },
  { value: PatientCategory.Advocate, label: 'Advocate' },
  { value: PatientCategory.Advertisement, label: 'Advertisement' },
  { value: PatientCategory.Website, label: 'Website' },
]

/**
 * Cohort options
 */
const cohortOptions = [
  { value: '', label: 'Select Cohort' },
  { value: PatientCohort.Anxious, label: 'Anxious' },
  { value: PatientCohort.Performer, label: 'Performer' },
  { value: PatientCohort.Preventive, label: 'Preventive' },
]

type Props = {
  location: string;
  handleChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

interface FormData {
  firstName: string
  lastName: string
  patientType: PatientType
  gender: Gender
  phone: string
  email: string
  dob: string
  consultant: string | null
  category: PatientCategory | ''
  bio: string
  status: string
  cohort: PatientCohort | null
  location: string
  referral: {
    user: string
    name: string
    type: ReferralType | ''
  }
}

export default function OnboardingForm({ location, handleChange }: Props) {
  const router = useRouter();

  const [formData, setFormData] = React.useState<FormData>({
    firstName: '',
    lastName: '',
    status: 'ACTIVE',
    location: location || '',
    patientType: PatientType.OpPatient,
    gender: Gender.Male,
    phone: '',
    email: '',
    cohort: null,
    bio: '',
    dob: '',
    category: PatientCategory.Website,
    consultant: null,
    referral: { type: '', user: '', name: '' },
  });
  const [formErrors, setFormErrors] = React.useState<{
    phone?: string
    email?: string
    lastName?: string
    category?: string;
    firstName?: string
    referralType?: string;
  }>({})

  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'network-only',
    onError: (error) => {
      console.error('Error loading centers:', error)
      toast.error('Failed to load centers')
    },
  })

  const centerOptions = React.useMemo(() => {
    if (!centersData?.centers) return []
    return centersData.centers.map((center: Center) => ({
      value: center._id,
      label: center.name,
    }))
  }, [centersData])

  const [checkPatientExists] = useLazyQuery(PATIENT_EXISTS)

  // Fetch patients for referral
  const { data: patientsData, loading: patientsLoading } = useQuery(
    GET_PATIENTS, {
    fetchPolicy: 'network-only',
    variables: { userType: 'PATIENT', centerId: formData.location },
  })

  const {
    data: consultantsData,
    loading: consultantsLoading,
  } = useQuery(GET_CONSULTANTS, {
    variables: {
      search: '',
      userType: 'CONSULTANT',
      pagination: { limit: 25 },
      centerId: formData.location,
      sort: { field: 'FIRST_NAME', order: 'ASC' },
    },
    skip: !formData.location,
    fetchPolicy: 'network-only',
  });

  const consultantOptions = React.useMemo(() => {
    if (!consultantsData?.users) return []
    return consultantsData.users.data.map((consultant: User) => ({
      value: consultant._id,
      label: `${consultant.profileData?.firstName || ''} ${consultant.profileData?.lastName || ''}`.trim() || consultant.email,
    }))
  }, [consultantsData])

  // Process patients data for the select component
  const patientOptions = React.useMemo(() => {
    if (!patientsData?.users) return []
    return patientsData?.users.data.map((patient: User) => ({
      value: patient._id,
      label: `${patient.profileData?.firstName || ''} ${patient.profileData?.lastName || ''}`.trim() || patient.email,
    }))
  }, [patientsData])

  const calculateAge = (dob: string): number => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }

    return age
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '')
    setFormData((prev) => ({ ...prev, phone: digitsOnly }))

    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: undefined }))
    }
  }

  const [mutatePatient, { loading }] = useMutation(CREATE_PATIENT, {
    onCompleted: (data) => {
      toast.success('Patient created successfully')
      // onSuccess?.({
      //     patientId: data.createPatient._id,
      //     centerId: formData.location,
      router.push(`/onboarding-patient/success?patient_id=${data.createPatient._id}&&center_id=${formData.location}`);
      // })
      // onClose?.()

    },
    onError: (error) => {
      console.error(
        `Error create creating patient:`,
        error,
      )
      toast.error(
        `Failed to create patient: ${error.message}`,
      )
    },
  })

  const handleFormLog = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof formErrors = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'First Name is required'
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (formData.phone.length !== 10) {
      errors.phone = 'Phone number must be 10 digits'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address'
    }

    if (!formData.category) {
      errors.category = 'Category is required'
    }

    if (formData.category === PatientCategory.Referral && (!formData.referral.type || formData.referral.type.trim() === '')) {
      errors.referralType = 'Referral type is required'
    }



    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const patientTypeMap = {
      [PatientType.OpPatient]: PatientType.OpPatient,
      [PatientType.HomePatient]: PatientType.HomePatient,
    }

    const input = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      centers: formData.location,
      patientType: patientTypeMap[formData.patientType],
      gender: formData.gender,
      phone: formData.phone,
      email: formData.email,
      cohort: formData.cohort,
      bio: formData.bio,
      dob: formData.dob,
      category: formData.category,
      consultant: formData.consultant,
      ...(formData.category === PatientCategory.Referral &&
        formData.referral.type && {
        referral: {
          type: formData.referral.type,
          ...(formData.referral.type !== ReferralType.Other && {
            user: formData.referral.user,
          }),
          name: formData.referral.name || 'External',
        },
      }),
    }



    try {
      const phone = input.phone;
      const { data: existsData } = await checkPatientExists({ variables: { phone } })

      if (existsData?.patientExists) {
        toast.success('Patient already exists')
        return
      }
      mutatePatient({ variables: { input } })
    } catch (err) {
      console.error('Error creating patient:', err)
    }
  }

  const handleLocationChange = (value: string | React.ChangeEvent<HTMLSelectElement>) => {
    let selectedCenterId: string;
    if (typeof value === 'string') {
      selectedCenterId = value;
    } else {
      selectedCenterId = value.target.value;
    }
    setFormData({ ...formData, location: selectedCenterId });

    // Find the selected center and store its organization ID in localStorage
    const selectedCenter = centersData?.centers?.find(
      (center: Center) => center._id === selectedCenterId
    );
    if (selectedCenter?.organization?._id) {
      localStorage.setItem('organizationId', selectedCenter.organization._id);
    } else {
      localStorage.removeItem('organizationId');
    }

    if (typeof value !== 'string') {
      handleChange(value);
    } else {
      // If handleChange expects a ChangeEvent, you may need to create a synthetic event or skip this
    }
  };

  const onLocationrenderSection = (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          className="w-full"
          value={formData.firstName}
          error={formErrors.firstName}
          disabled={centersLoading || loading}
          onChange={(e) => {
            setFormData({ ...formData, firstName: e.target.value })
            setFormErrors({ ...formErrors, firstName: "" })
          }}
        />
        <Input
          label="Last Name"
          value={formData.lastName}
          disabled={centersLoading || loading}
          error={formErrors.lastName}
          onChange={(e) => {
            setFormData({ ...formData, lastName: e.target.value })
            setFormErrors({ ...formErrors, lastName: "" })
          }}
        />
      </div>
      <div className="flex items-center gap-5">
        <RadioGroup
          label="Patient Type"
          disabled={centersLoading || loading}
          value={formData.patientType}
          options={[
            { value: PatientType.OpPatient, label: 'OP Patient' },
            { value: PatientType.HomePatient, label: 'Home Patient' },
          ]}
          onChange={(value) => {
            setFormData({ ...formData, patientType: value as PatientType })
          }}
        />
        <RadioGroup
          label="Gender"
          value={formData.gender}
          disabled={centersLoading || loading}
          options={[
            { value: Gender.Male, label: 'Male' },
            { value: Gender.Female, label: 'Female' },
          ]}
          onChange={(value) => {
            setFormData({ ...formData, gender: value as Gender })
          }}
        />
      </div>
      <div className="flex">
        <div className="w-2/3 pr-2">
          <Input
            type="date"
            value={formData.dob}
            label="Date of Birth"
            placeholder="dd/mm/yyyy"
            disabled={centersLoading || loading}
            max={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              setFormData({ ...formData, dob: e.target.value })
            }}
          />
        </div>
        <div className="w-1/3 flex items-end pb-2 justify-end">
          <div className="text-sm text-gray-500">
            {formData.dob
              ? `Age: ${calculateAge(formData.dob)} years`
              : 'Age: --'}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Phone Number</label>
          <div className="flex gap-2">
            <Input
              type="tel"
              maxLength={10}
              pattern="[0-9]*"
              inputMode="numeric"
              value={formData.phone}
              error={formErrors.phone}
              onChange={handlePhoneChange}
              disabled={centersLoading || loading}
              className="flex-1"
            />
            {formData.phone.length === 10 && (
              <Button
                type="button"
                onClick={() => {
                  // Add phone verification logic here if needed
                  toast.success('Phone number verified!');
                }}
                className="whitespace-nowrap"
              >
                Verify Number
              </Button>
            )}
          </div>
        </div>
        <Input
          type="email"
          label="Email Address"
          value={formData.email}
          disabled={centersLoading || loading}

          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value })
          }}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Cohort"
          options={cohortOptions}
          value={formData.cohort || ''}
          disabled={centersLoading || loading}
          onChange={(e) => {
            const value = typeof e === 'string' ? e : e.target.value
            setFormData({ ...formData, cohort: value ? value as PatientCohort : null })
          }}
        />
        <Select
          label="Category"
          value={formData.category}
          options={categoryOptions}
          error={formErrors.category}
          disabled={centersLoading || loading}
          onChange={(e) => {
            const value = typeof e === 'string' ? e : e.target.value
            setFormData({ ...formData, category: value as PatientCategory | '' })
            setFormErrors({ ...formErrors, category: "" })
          }}
        />
      </div>

      {formData.category === PatientCategory.Referral && (
        <>
          <Select
            label="Referral Type"
            value={formData.referral.type}
            error={formErrors.referralType}
            onChange={(e) => {
              const value = typeof e === 'string' ? e : e.target.value
              setFormData({
                ...formData,
                referral: {
                  type: value as ReferralType | '',
                  user: '',
                  name: '',
                },
              })
              setFormErrors({ ...formErrors, referralType: '' })
            }}
            options={[
              { value: '', label: 'Select Referral Type' },
              { value: ReferralType.Patient, label: 'Patient' },
              { value: ReferralType.Consultant, label: 'Consultant' },
              { value: ReferralType.Other, label: 'Other' },
            ]}
          />
          {formData.referral.type === ReferralType.Patient && (
            <Select
              label="Referral Patient"
              value={formData.referral.user}
              onChange={(e) => {
                const value =
                  typeof e === 'string' ? e : e.target.value
                setFormData({
                  ...formData,
                  referral: {
                    ...formData.referral,
                    user: value,
                    name:
                      patientOptions.find(
                        (opt: { value: string; label: string }) => opt.value === value,
                      )?.label || '',
                  },
                })
              }}
              options={patientOptions}
              loading={patientsLoading}
            />
          )}
          {formData.referral.type === ReferralType.Consultant && (
            <Select
              label="Referral Consultant"
              value={formData.referral.user}
              onChange={(e) => {
                const value =
                  typeof e === 'string' ? e : e.target.value
                setFormData({
                  ...formData,
                  referral: {
                    ...formData.referral,
                    user: value,
                    name:
                      consultantOptions.find(
                        (opt: { value: string; label: string }) => opt.value === value,
                      )?.label || '',
                  },
                })
              }}
              options={consultantOptions}
              loading={consultantsLoading}
            />
          )}
          {formData.referral.type === ReferralType.Other && (
            <Input
              label="Referral Source"
              value={formData.referral.name}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  referral: {
                    ...formData.referral,
                    name: e.target.value,
                  },
                })
              }
              required
            />
          )}
        </>
      )}

      <Select
        label="Consultant"
        options={consultantOptions}
        loading={consultantsLoading}
        value={formData.consultant || ''}
        disabled={centersLoading || consultantsLoading || loading}
        onChange={(e) => {
          const value = typeof e === 'string' ? e : e.target.value
          setFormData({ ...formData, consultant: value })
        }}
      />
      <div className="col-span-2">
        <label className="text-sm font-medium text-gray-700 block mb-1">
          Bio / Notes
        </label>
        <textarea
          rows={3}
          value={formData.bio}
          disabled={centersLoading || loading}
          placeholder="Enter patient bio or notes"
          className="w-full rounded-lg border border-gray-300 p-2"
          onChange={(e) => {
            setFormData({ ...formData, bio: e.target.value })
          }}
        />
      </div>
      <div>
        <Button type="submit">
          Book Your First Appointment
        </Button>
      </div>
    </>
  )

  return (
    <div className="flex flex-col items-center w-full p-6">
      <div className="w-full flex flex-col items-center gap-5">
        <Card className="w-1/2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Onboarding Patients</h2>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFormLog} className="flex flex-col gap-5">
              <Select
                value={location}
                // label="Location"
                options={centerOptions}
                loading={centersLoading}
                onChange={handleLocationChange}
                disabled={centersLoading || loading}
              />
              {formData.location ? onLocationrenderSection : null}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
