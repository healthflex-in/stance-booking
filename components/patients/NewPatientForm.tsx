'use client'
import React from 'react'
import { toast } from 'sonner'
import { useMutation, useQuery, useLazyQuery } from '@apollo/client'

import {
  GET_CENTERS,
  GET_PATIENTS,
  CREATE_PATIENT,
  UPDATE_PATIENT,
  GET_CONSULTANTS,
} from '@/gql/queries'
import {
  Input,
  Select,
  Button,
  RadioGroup,
  Card,CardHeader, CardContent,
  MultiSelect, MultiSelectOption
} from '@/components/ui-atoms';
import {
  Gender,
  PatientType,
  PatientCategory,
  PatientCohort,
  PatientStatus,
  ReferralType,
} from '@/gql/graphql';
import { useDebounce } from '@/hooks';
import { useHealthFlexAnalytics } from '@/services/analytics';
import { useAuth } from '@/contexts';

interface NewPatientFormProps {
  onClose?: () => void
  centerId?: string
  onSuccess?: (result: { patientId: string; centerId: string }) => void
  formType?: 'full' | 'mini'
  mode?: 'create' | 'update'
  formTitle?: string
  initialData?: {
    firstName: string
    lastName: string
    patientType: PatientType
    gender: Gender
    phone: string
    email: string
    dob: string
    consultant?: string | null
    category: PatientCategory
    bio: string
    status?: PatientStatus
    cohort?: PatientCohort | null
    centers?: string[]
    referral?: {
      type: ReferralType
      user?: string
      name: string
    }
  }
  patientId?: string
  hideActions?: boolean
  onSubmitExternal?: () => void
}

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
  status: PatientStatus
  cohort: PatientCohort | null
  centers: string[]
  referral: {
    type: ReferralType | ''
    user: string
    name: string
  }
}

export default React.forwardRef(function NewPatientForm(
  {
    onClose,
    centerId,
    onSuccess,
    formType = 'full',
    mode = 'create',
    formTitle,
    initialData,
    patientId,
    hideActions = false,
    onSubmitExternal,
  }: NewPatientFormProps,
  ref,
) {
  const analytics = useHealthFlexAnalytics();
  const { user } = useAuth();
  const formRef = React.useRef<HTMLFormElement>(null)

  React.useImperativeHandle(ref, () => ({
    submit: () => {
      if (formRef.current) {
        formRef.current.requestSubmit()
      }
    },
  }))

  const [fieldErrors, setFieldErrors] = React.useState<{
    firstName?: string
    phone?: string
  }>({})

  const [formErrors, setFormErrors] = React.useState<{
    firstName?: string
    phone?: string
    email?: string
    category?: string
    referralType?: string
  }>({})

  const [hasUserModifications, setHasUserModifications] = React.useState(false)
  


  const [formData, setFormData] = React.useState<FormData>(() => {
    if (initialData) {
      return {
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        patientType: initialData.patientType || PatientType.OpPatient,
        gender: initialData.gender || Gender.Male,
        phone: initialData.phone || '',
        email: initialData.email || '',
        dob: initialData.dob || '',
        consultant: initialData.consultant || null,
        category: initialData.category || '',
        bio: initialData.bio || '',
        status: initialData.status || PatientStatus.Active,
        cohort: initialData.cohort || null,
        centers: initialData.centers || [],
        referral: {
          type: initialData.referral?.type || '',
          user: initialData.referral?.user || '',
          name: initialData.referral?.name || '',
        },
      }
    }
    return {
      firstName: '',
      lastName: '',
      patientType: PatientType.OpPatient,
      gender: Gender.Male,
      phone: '',
      email: '',
      dob: '',
      consultant: null,
      category: '',
      bio: '',
      status: PatientStatus.Active,
      cohort: null,
      centers: centerId ? [centerId] : [],
      referral: {
        type: '',
        user: '',
        name: '',
      },
    }
  })

  // Update form data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName || '',
        lastName: initialData.lastName || '',
        patientType: initialData.patientType || PatientType.OpPatient,
        gender: initialData.gender || Gender.Male,
        phone: initialData.phone || '',
        email: initialData.email || '',
        dob: initialData.dob || '',
        consultant: initialData.consultant || null,
        category: initialData.category || '',
        bio: initialData.bio || '',
        status: initialData.status || PatientStatus.Active,
        cohort: initialData.cohort || null,
        centers: initialData.centers || [],
        referral: {
          type: (initialData.referral?.type as ReferralType) || '',
          user: initialData.referral?.user || '',
          name: initialData.referral?.name || '',
        },
      });
    }
  }, [initialData])

  // Update centers when centerId prop changes (only for create mode)
  React.useEffect(() => {
    if (mode === 'create' && centerId && formData.centers.length === 0) {
      setFormData(prev => ({
        ...prev,
        centers: [centerId]
      }));
    }
  }, [centerId, formData.centers.length, mode]);





  // Fetch consultants
  const {
    data: consultantsData,
    error: consultantsError,
    loading: consultantsLoading,
  } = useQuery(GET_CONSULTANTS, {
    variables: {
      userType: 'CONSULTANT',
      centerId: formData.centers,
    },
    fetchPolicy: 'cache-first', // Optimization: fetch only if not in cache
  })

  // Update consultant when both initialData and consultantsData are available
  React.useEffect(() => {
    if (initialData?.consultant && consultantsData?.users.length>0) {
      // Check if the consultant exists in the consultants list
      const consultantExists = consultantsData.users.some(
        (consultant: { _id: string }) => consultant._id === initialData.consultant,
      )

      if (consultantExists) {
        setFormData((prevData) => {
          const newData = {
            ...prevData,
            consultant: initialData.consultant || null,
          }
          return newData
        })
      } else {
        console.warn(
          `Consultant with ID ${initialData.consultant} not found in consultants list`,
        )

        // Try to find the consultant by name or other attributes if ID doesn't match
        const consultantByName = consultantsData.users.find(
          (consultant: { _id: string; profileData?: { firstName?: string; lastName?: string } }) =>
            `${consultant.profileData?.firstName || ''} ${consultant.profileData?.lastName || ''}`.trim() ===
            initialData.consultant,
        )

        if (consultantByName) {
          setFormData((prevData) => ({
            ...prevData,
            consultant: consultantByName._id,
          }))
        }
      }
    }
  }, [initialData, consultantsData])

  const idEdited = React.useMemo(() => JSON.stringify(formData) !== JSON.stringify(initialData), [formData, initialData])

  // Patients search state for infinite scroll
  const [patientsSearch, setPatientsSearch] = React.useState('')
  const debouncedPatientsSearch = useDebounce(patientsSearch, 500)

  // Fetch patients for referral with infinite scroll (lazily)
  const [
    fetchPatients,
    { data: patientsData, loading: patientsLoading, fetchMore: fetchMorePatients, refetch: refetchPatients },
  ] = useLazyQuery(GET_PATIENTS, {
    variables: {
      userType: 'PATIENT',
      centerId: formData.centers,
      ...(debouncedPatientsSearch.trim() && { search: debouncedPatientsSearch.trim() }),
      pagination: {
        limit: 50,
      },
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  })

  // Reset to first page when search changes
  React.useEffect(() => {
    if (debouncedPatientsSearch !== patientsSearch) {
      refetchPatients({
        userType: 'PATIENT',
        centerId: formData.centers,
        ...(debouncedPatientsSearch.trim() && { search: debouncedPatientsSearch.trim() }),
        pagination: { limit: 50 },
      })
    }
  }, [debouncedPatientsSearch])

  // Process patients data for the select component
  const patientOptions = React.useMemo(() => {
    const options = []
    
    // Add existing referral patient if it exists and not in the list
    if (formData.referral.user && formData.referral.name) {
      const existingOption = {
        value: formData.referral.user,
        label: formData.referral.name,
      }
      options.push(existingOption)
    }
    
    // Add patients from API data
    if (patientsData?.users?.data) {
      const apiOptions = patientsData.users.data
        .filter((patient: { _id: string }) => patient._id !== formData.referral.user) // Avoid duplicates
        .map((patient: { _id: string; profileData?: { firstName?: string; lastName?: string }; email?: string }) => ({
          value: patient._id,
          label:
            `${patient.profileData?.firstName || ''} ${patient.profileData?.lastName || ''}`.trim() ||
            patient.email,
        }))
      options.push(...apiOptions)
    }
    
    return options
  }, [patientsData, formData.referral.user, formData.referral.name])

  // Infinite scroll handler for patients
  const handlePatientsScroll = React.useCallback(async () => {
    const pagination = patientsData?.users?.pagination
    if (pagination?.hasNext && pagination.nextCursor && !patientsLoading) {
      try {
        await fetchMorePatients({
          variables: {
            pagination: {
              limit: 50,
              cursor: pagination.nextCursor,
            },
          },
          updateQuery: (prev: any, { fetchMoreResult }: { fetchMoreResult?: any }) => {
            if (!fetchMoreResult?.users?.data) return prev

            return {
              ...prev,
              users: {
                ...fetchMoreResult.users,
                data: [
                  ...(prev.users?.data || []),
                  ...fetchMoreResult.users.data,
                ],
              },
            }
          },
        })
      } catch (error) {
        console.error('Error fetching more patients:', error)
      }
    }
  }, [patientsData, patientsLoading, fetchMorePatients])

  // Process consultants data for the select component
  const consultantOptions = React.useMemo(() => {
    if (!consultantsData?.users) return []
    return consultantsData.users.data.map((consultant: { _id: string; profileData?: { firstName?: string; lastName?: string }; email?: string }) => ({
      value: consultant._id,
      label:
        `${consultant.profileData?.firstName || ''} ${consultant.profileData?.lastName || ''}`.trim() ||
        consultant.email,
    }))
  }, [consultantsData])

  // Create/Update patient mutation
  const [mutatePatient, { loading }] = useMutation(
    mode === 'create' ? CREATE_PATIENT : UPDATE_PATIENT,
    {
      onCompleted: (data) => {
        toast.success(
          mode === 'create'
            ? 'Patient created successfully'
            : 'Patient updated successfully',
        )

        // Track patient creation or edit
        if (mode === 'create') {
          analytics.trackPatientCreate(
            data.createPatient._id,
            {
              centerId: formData.centers[0] || centerId || 'unknown',
              source: formType === 'mini' ? 'onboarding' : 'dashboard'
            },
            user?._id || 'unknown'
          );
        } else {
          analytics.trackPatientEdit(
            patientId!,
            { updated: true },
            user?._id || 'unknown',
            true
          );
        }

        // Clear form localStorage on success
        if (typeof window !== 'undefined') {
          localStorage.removeItem('patient-form-centers');
        }
        
        // Don't close the form immediately, keep the centers visible
        onSuccess?.(
          mode === 'create'
            ? {
              patientId: data.createPatient._id,
              centerId: formData.centers[0], // Ensure at least one center is selected
            }
            : { patientId: patientId!, centerId: formData.centers[0] }, // Use formData.centers
        )
        // Don't call onClose() to keep form open with saved data
      },
      onError: (error) => {
        console.error(
          `Error ${mode === 'create' ? 'creating' : 'updating'} patient:`,
          error,
        )
        toast.error(
          `Failed to ${mode === 'create' ? 'create' : 'update'} patient: ${error.message}`,
        )
      },
    },
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

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

    // Convert date string to timestamp (seconds since epoch)
    const dobDate = formData.dob ? new Date(formData.dob) : null
    const dobTimestamp = dobDate ? Math.floor(dobDate.getTime() / 1000) : null

    const patientTypeMap = {
      [PatientType.OpPatient]: PatientType.OpPatient,
      [PatientType.HomePatient]: PatientType.HomePatient,
    }

    const input = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      centers: formData.centers,
      ...(formData.consultant ? { consultant: formData.consultant } : {}),
      ...(formData.cohort ? { cohort: formData.cohort } : {}),
      patientType: patientTypeMap[formData.patientType],
      gender: formData.gender,
      ...(formData.dob && {
        dob: dobTimestamp,
      }),
      ...(mode === 'create' && {
        phone: formData.phone,
        ...(formData.email && { email: formData.email }),
      }),
      ...(formData.category && {
        category: formData.category,
      }),
      ...(formType === 'full' && {
        bio: formData.bio,
      }),
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

    if (mode === 'create') {
      mutatePatient({ variables: { input } })
    } else {
      mutatePatient({ variables: { patientId, input } })
    }
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '')
    setFormData((prev) => ({ ...prev, phone: digitsOnly }))

    if (fieldErrors.phone) {
      setFieldErrors((prev) => ({ ...prev, phone: undefined }))
    }
  }

  const { data: centersData, loading: centersLoading, error: centersError } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-and-network',
    onError: (error) => {
      console.error('Error loading centers:', error)
      toast.error('Failed to load centers')
    },
  })

  const centerOptions: MultiSelectOption[] = React.useMemo(() => {
    if (!centersData?.centers) {
      return []
    }
    return centersData.centers.map((center: { _id: string; name: string }) => ({
      value: center._id,
      label: center.name,
    }));
  }, [centersData])

  // Category options
  const categoryOptions = [
    { value: '', label: 'Select Category' },
    { value: PatientCategory.Referral, label: 'Referral' },
    { value: PatientCategory.Organic, label: 'Organic' },
    { value: PatientCategory.Doctor, label: 'Doctor' },
    { value: PatientCategory.Advocate, label: 'Advocate' },
    { value: PatientCategory.Advertisement, label: 'Advertisement' },
    { value: PatientCategory.Website, label: 'Website' },
  ]

  // Cohort options
  const cohortOptions = [
    { value: '', label: 'Select Cohort' },
    { value: PatientCohort.Anxious, label: 'Anxious' },
    { value: PatientCohort.Performer, label: 'Performer' },
    { value: PatientCohort.Preventive, label: 'Preventive' },
  ]

  const calculateAge = (dob: string): number => {
    if (!dob) return 0
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--
    }

    return age
  }

  return (
    <Card className={`w-full mx-auto`}>
      {formTitle && (
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{formTitle}</h2>
            {/* <Button variant="ghost" onClick={onClose}>✕</Button> */}
          </div>
        </CardHeader>
      )}
      <CardContent>
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className={`${formType === 'mini' ? 'space-y-4' : 'space-y-6'}`}
        >
          <div className="mb-4">
            <MultiSelect
              label="Centers"
              options={centerOptions}
              value={formData.centers}
              onChange={(values) => {
                setFormData(prev => ({ ...prev, centers: values }))
                setHasUserModifications(true)
                // Persist to localStorage for form state (only in create mode)
                if (mode === 'create' && typeof window !== 'undefined') {
                  localStorage.setItem('patient-form-centers', JSON.stringify(values))
                }
              }}
              loading={centersLoading}
              placeholder="Select centers"
              className="w-full"
            />
          </div>

          <div
            className={`grid grid-cols-2 ${formType === 'mini' ? 'gap-3' : 'gap-4'}`}
          >
            <Input
              label="First Name"
              value={formData.firstName}
              onChange={(e) => {
                setFormData({ ...formData, firstName: e.target.value })
                setFormErrors((prev) => ({ ...prev, firstName: undefined }))
              }}
              error={formErrors.firstName}
            />
            <Input
              label="Last Name"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>

          {formType === 'full' ? (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <RadioGroup
                  label="Patient Type"
                  options={[
                    { value: PatientType.OpPatient, label: 'OP Patient' },
                    { value: PatientType.HomePatient, label: 'Home Patient' },
                  ]}
                  value={formData.patientType}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      patientType: value as PatientType,
                    })
                  }
                />
              </div>
              <div>
                <RadioGroup
                  label="Gender"
                  options={[
                    { value: Gender.Male, label: 'Male' },
                    { value: Gender.Female, label: 'Female' },
                  ]}
                  value={formData.gender}
                  onChange={(value) =>
                    setFormData({
                      ...formData,
                      gender: value as Gender,
                    })
                  }
                />
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <RadioGroup
                    label="Patient Type"
                    options={[
                      { value: PatientType.OpPatient, label: 'OP Patient' },
                      { value: PatientType.HomePatient, label: 'Home Patient' },
                    ]}
                    value={formData.patientType}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        patientType: value as PatientType,
                      })
                    }
                  />
                </div>
                <div>
                  <RadioGroup
                    label="Gender"
                    options={[
                      { value: Gender.Male, label: 'Male' },
                      { value: Gender.Female, label: 'Female' },
                    ]}
                    value={formData.gender}
                    onChange={(value) =>
                      setFormData({
                        ...formData,
                        gender: value as Gender,
                      })
                    }
                  />
                </div>
              </div>
            </>
          )}

          {formType === 'full' ? (
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '')
                  setFormData((prev) => ({ ...prev, phone: digitsOnly }))
                  setFormErrors((prev) => ({ ...prev, phone: undefined }))
                }}
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                error={formErrors.phone}
              />
              <Input
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  setFormErrors((prev) => ({ ...prev, email: undefined }))
                }}
                error={formErrors.email}
              />
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                type="tel"
                label="Phone Number"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={10}
                inputMode="numeric"
                pattern="[0-9]*"
                disabled={mode === 'update'}
                error={fieldErrors.phone}
              />
              <Input
                type="email"
                label="Email Address"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                disabled={mode === 'update'}
              />
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => {
                  const value = typeof e === 'string' ? e : e.target.value
                  setFormData({ ...formData, category: value as PatientCategory | '' })
                  setFormErrors((prev) => ({ ...prev, category: undefined }))
                }}
                options={categoryOptions}
                error={formErrors.category}
              />
            </div>
          )}

          {formType === 'full' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Consultant"
                  value={formData.consultant || ''}
                  onChange={(e) => {
                    const value = typeof e === 'string' ? e : e.target.value
                    setFormData({ ...formData, consultant: value || null })
                  }}
                  options={consultantOptions}
                  loading={consultantsLoading}
                />
                <Select
                  label="Category"
                  value={formData.category}
                  onChange={(e) => {
                    const value = typeof e === 'string' ? e : e.target.value
                    setFormData({ ...formData, category: value as PatientCategory | '' })
                    setFormErrors((prev) => ({ ...prev, category: undefined }))
                  }}
                  options={categoryOptions}
                  error={formErrors.category}
                />
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
                        setFormErrors((prev) => ({ ...prev, referralType: undefined }))
                      }}
                      options={[
                        { value: '', label: 'Select Referral Type' },
                        { value: ReferralType.Patient, label: 'Patient' },
                        { value: ReferralType.Consultant, label: 'Consultant' },
                        { value: ReferralType.Other, label: 'Other' },
                      ]}
                    />
                    {formData.referral.type === ReferralType.Patient && (
                      <div onFocus={() => { if (!patientsData) { fetchPatients(); } }}>
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
                                    (opt: {
                                      value: string
                                      label: string
                                    }) => opt.value === value,
                                  )?.label || '',
                              },
                            })
                          }}
                          options={[
                            { value: '', label: 'Select Referral Patient' },
                            ...patientOptions
                          ]}
                          loading={patientsLoading}
                          onSearch={setPatientsSearch}
                          onScroll={handlePatientsScroll}
                          searchValue={patientsSearch}
                          hasMore={patientsData?.users?.pagination?.hasNext || false}
                        />
                      </div>
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
                                  (opt: {
                                    value: string
                                    label: string
                                  }) => opt.value === value,
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
                  label="Cohort"
                  value={formData.cohort || ''}
                  onChange={(e) => {
                    const value = typeof e === 'string' ? e : e.target.value
                    setFormData({ ...formData, cohort: (value as PatientCohort) || null })
                  }}
                  options={cohortOptions}
                />
                <div className="flex">
                  <div className="w-2/3 pr-2">
                    <Input
                      type="date"
                      label="Date of Birth"
                      value={formData.dob}
                      onChange={(e) =>
                        setFormData({ ...formData, dob: e.target.value })
                      }
                      placeholder="dd/mm/yyyy"
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
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
              </div>

              <div className="col-span-2">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Bio / Notes
                </label>
                <textarea
                  className="w-full rounded-lg border border-gray-300 p-2"
                  placeholder="Enter patient bio or notes"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                />
              </div>
            </>
          )}

          {!hideActions && (
            <div
              className={`flex justify-end gap-3 ${formType === 'mini' ? 'pt-6' : 'pt-4 border-t'}`}
            >
              {idEdited && (
                <Button variant="outline" type="button" onClick={() => {
                  if (onClose) {
                    onClose()
                  }
                  if (initialData)
                    setFormData({ ...initialData } as FormData)
                }}>
                  Cancel
                </Button>
              )}

              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
})