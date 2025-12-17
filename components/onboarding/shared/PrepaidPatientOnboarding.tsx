'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { User, X } from 'lucide-react';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { CREATE_PATIENT, PATIENT_EXISTS, PATIENT_BY_PHONE, GET_CENTERS } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';

interface PrepaidPatientOnboardingProps {
  centerId: string;
  onComplete: (patientId: string, isNewUser: boolean) => void;
  onBack?: () => void;
}

interface FormData {
  phone: string;
  firstName: string;
  lastName: string;
  email: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  dob: string;
  bio: string;
}

export default function PrepaidPatientOnboarding({
  centerId,
  onComplete,
  onBack,
}: PrepaidPatientOnboardingProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showWelcomeBackModal, setShowWelcomeBackModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: 'MALE',
    dob: '',
    bio: '',
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [isVerifying, setIsVerifying] = useState(false);

  const { data: centersData } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  const [checkPatientExists] = useLazyQuery(PATIENT_EXISTS, {
    fetchPolicy: 'network-only',
  });

  const [getPatientByPhone] = useLazyQuery(PATIENT_BY_PHONE, {
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (centersData?.centers) {
      const defaultCenter = centersData.centers.find(
        (center: any) => center._id === centerId
      );
      
      if (defaultCenter?.organization?._id) {
        localStorage.setItem('organizationId', defaultCenter.organization._id);
      }
      
      if (defaultCenter?._id) {
        localStorage.setItem('centerId', defaultCenter._id);
      }
    }
  }, [centersData, centerId]);

  useEffect(() => {
    if (showWelcomeBackModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showWelcomeBackModal]);

  const [createPatient, { loading: creating }] = useMutation(CREATE_PATIENT, {
    onCompleted: (data) => {
      toast.success('Patient created successfully');
      onComplete(data.createPatient._id, true);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create patient');
    },
  });

  const handlePhoneVerification = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      setFormErrors({ phone: 'Phone number must be 10 digits' });
      return;
    }

    setIsVerifying(true);
    try {
      const { data } = await checkPatientExists({
        variables: { phone: formData.phone },
      });
      
      if (data?.patientExists) {
        const { data: patientData } = await getPatientByPhone({
          variables: { phone: formData.phone },
        });
        
        const patient = patientData?.patientByPhone;
        if (patient) {
          // Existing user - show welcome back modal
          setIsNewUser(false);
          setIsPhoneVerified(true);
          setShowWelcomeBackModal(true);
          setIsVerifying(false);
          return;
        }
      }
      
      // New user - show form
      setIsNewUser(true);
      setIsPhoneVerified(true);
      setIsVerifying(false);
      toast.success('Phone number verified! Please fill in your details.');
    } catch (error) {
      console.error('Error checking patient existence:', error);
      setIsVerifying(false);
      toast.error('Error verifying phone number. Please try again.');
    }
  };



  const validateForm = () => {
    const errors: any = {};

    if (!formData.firstName || !formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.phone || formData.phone.length !== 10) {
      errors.phone = 'Phone number must be 10 digits';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRepeatUserContinue = async () => {
    setIsNavigating(true);
    setShowWelcomeBackModal(false);
    try {
      const { data: patientData } = await getPatientByPhone({
        variables: { phone: formData.phone },
      });
      
      const patient = patientData?.patientByPhone;
      if (patient) {
        // Always use online for prepaid
        onComplete(patient._id, false);
      } else {
        setIsNavigating(false);
        toast.error('Patient not found. Please try again.');
      }
    } catch (error) {
      console.error('Error getting patient:', error);
      setIsNavigating(false);
      toast.error('Error getting patient details. Please try again.');
    }
  };

  const handleContinue = async () => {
    if (!isPhoneVerified) {
      await handlePhoneVerification();
      return;
    }

    if (isNewUser) {
      if (validateForm()) {
        await handleSubmit();
      }
    } else {
      setShowWelcomeBackModal(true);
    }
  };

  const handleSubmit = async () => {
    const dobDate = formData.dob ? new Date(formData.dob) : null;
    const dobTimestamp = dobDate ? Math.floor(dobDate.getTime() / 1000) : null;

    const input = {
      phone: formData.phone,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || undefined,
      gender: formData.gender,
      bio: formData.bio || '',
      dob: dobTimestamp,
      centers: [centerId],
      category: 'WEBSITE',
      patientType: 'OP_Patient',
      cohort: 'SURGICAL',
    };

    try {
      await createPatient({ variables: { input } });
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Failed to create patient. Please try again.');
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div 
        className="relative h-36 w-full flex-shrink-0"
        style={{
          backgroundImage: 'url(/indra.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20"></div>
      </div>
      
      <div className="flex-shrink-0 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-[#DDFE71]" />
            </div>
            <h6 className="text-sm font-semibold text-gray-900">
              Book Prepaid Session
            </h6>
          </div>
          <img 
            src="/stance-logo.png" 
            alt="Stance Health" 
            className="h-16 w-auto"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <p className="text-gray-600 text-sm mb-6">
            {!isPhoneVerified 
              ? 'Enter your phone number to get started'
              : 'Complete your profile details'
            }
          </p>
          <div className="mb-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      updateFormData('phone', digitsOnly);
                      if (isPhoneVerified) {
                        setIsPhoneVerified(false);
                        setIsNewUser(false);
                      }
                    }}
                    disabled={isPhoneVerified}
                    className={`w-full p-3 pr-20 border-2 rounded-xl ${
                      formErrors.phone ? 'border-red-300' : isPhoneVerified ? 'border-green-300 bg-green-50' : 'border-gray-200'
                    } focus:border-blue-500 outline-none ${isPhoneVerified ? 'cursor-not-allowed' : ''}`}
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                  {formData.phone.length === 10 && !isPhoneVerified && (
                    <button
                      onClick={handlePhoneVerification}
                      disabled={isVerifying}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded text-xs font-medium text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                      style={{ backgroundColor: isVerifying ? '#9CA3AF' : '#DDFE71' }}
                    >
                      {isVerifying ? 'Verifying...' : 'Verify'}
                    </button>
                  )}
                </div>
                {formErrors.phone && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                )}
                {isPhoneVerified && (
                  <p className="text-green-600 text-xs mt-1">✓ Phone number verified</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name *
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    disabled={!isPhoneVerified}
                    className={`w-full p-3 border-2 rounded-xl ${
                      formErrors.firstName ? 'border-red-300' : 'border-gray-200'
                    } focus:border-blue-500 outline-none ${!isPhoneVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="First name"
                  />
                  {formErrors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    disabled={!isPhoneVerified}
                    className={`w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none ${!isPhoneVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  disabled={!isPhoneVerified}
                  className={`w-full p-3 border-2 rounded-xl ${
                    formErrors.email ? 'border-red-300' : 'border-gray-200'
                  } focus:border-blue-500 outline-none ${!isPhoneVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="your.email@example.com"
                />
                {formErrors.email && (
                  <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateFormData('gender', option.value)}
                      disabled={!isPhoneVerified}
                      className={`p-3 border-2 rounded-xl transition-all ${
                        formData.gender === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      } ${!isPhoneVerified ? 'bg-gray-100 cursor-not-allowed opacity-50' : ''}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => updateFormData('dob', e.target.value)}
                  disabled={!isPhoneVerified}
                  className={`w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none ${!isPhoneVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio / Notes (Optional)
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateFormData('bio', e.target.value)}
                  disabled={!isPhoneVerified}
                  className={`w-full h-32 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none ${!isPhoneVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Add any additional information..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        <button
          onClick={handleContinue}
          disabled={isVerifying || creating || isNavigating || (!isPhoneVerified && formData.phone.length !== 10)}
          className="w-full py-4 rounded-2xl font-semibold text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
          style={{ backgroundColor: (isVerifying || creating || isNavigating || (!isPhoneVerified && formData.phone.length !== 10)) ? '#9CA3AF' : '#DDFE71' }}
        >
          {isVerifying ? 'Verifying...' : creating ? 'Creating Profile...' : isNavigating ? 'Loading...' : 'Continue'}
        </button>
      </div>

      {isNavigating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <StanceHealthLoader message="Loading..." />
          </div>
        </div>
      )}

      {showWelcomeBackModal && (
        <div 
          className={`${isInDesktopContainer ? 'absolute' : 'fixed'} inset-0 bg-black bg-opacity-50 z-[100] flex items-end`}
          onClick={() => !isNavigating && setShowWelcomeBackModal(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Welcome Back!</h3>
              <button
                onClick={() => !isNavigating && setShowWelcomeBackModal(false)}
                className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isNavigating}
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="px-5 py-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-gray-600 text-sm">
                  We found your account. Click continue to book your prepaid session.
                </p>
              </div>

              <button
                onClick={handleRepeatUserContinue}
                disabled={isNavigating}
                className="w-full py-3 rounded-xl font-semibold text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ backgroundColor: isNavigating ? '#9CA3AF' : '#DDFE71' }}
              >
                {isNavigating ? 'Loading...' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
