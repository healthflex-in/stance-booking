'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useLazyQuery, useQuery } from '@apollo/client';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import { CREATE_PATIENT, PATIENT_EXISTS, PATIENT_BY_PHONE, GET_CENTERS } from '@/gql/queries';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';
import SessionTypeSelectionModal from './SessionTypeSelectionModal';

interface SimplifiedPatientOnboardingProps {
  centerId: string;
  onComplete: (patientId: string, isNewUser: boolean, sessionType: 'in-person' | 'online') => void;
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
  referral: {
    type: string;
    user: string;
    name: string;
  };
}

export default function SimplifiedPatientOnboarding({
  centerId,
  onComplete,
  onBack,
}: SimplifiedPatientOnboardingProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [sessionType, setSessionType] = useState<'in-person' | 'online' | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [showSessionTypeModal, setShowSessionTypeModal] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    phone: '',
    firstName: '',
    lastName: '',
    email: '',
    gender: 'MALE',
    dob: '',
    bio: '',
    referral: {
      type: '',
      user: '',
      name: '',
    },
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [trackedFields, setTrackedFields] = useState({
    phone: false,
    firstName: false,
    lastName: false,
    email: false,
    dob: false,
    notes: false
  });
  const mobileAnalytics = useMobileFlowAnalytics();

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
    mobileAnalytics.trackPatientOnboardingStart(centerId);
    mobileAnalytics.trackPatientDetailsStart('', centerId);
    
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source') || urlParams.get('source') || 'direct';
    const campaign = urlParams.get('utm_campaign');
    const medium = urlParams.get('utm_medium');
    
    if (source !== 'direct') {
      mobileAnalytics.trackReferralSource(source, campaign || '', medium || '', '', centerId);
    }
    
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    const deviceType = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    const optimizationScore = window.innerWidth < 768 ? 85 : 95;
    
    mobileAnalytics.trackMobileOptimization(optimizationScore, deviceType, screenSize);
  }, [centerId]);

  useEffect(() => {
    if (centersData?.centers) {
      const defaultCenter = centersData.centers.find(
        (center: any) => center._id === centerId
      );
      
      if (defaultCenter?.organization?._id) {
        localStorage.setItem('organizationId', defaultCenter.organization._id);
        localStorage.setItem('stance-organizationID', defaultCenter.organization._id);
      }
      
      if (defaultCenter?._id) {
        localStorage.setItem('centerId', defaultCenter._id);
        localStorage.setItem('stance-centreID', defaultCenter._id);
      }
    }
  }, [centersData, centerId]);

  const [createPatient, { loading: creating }] = useMutation(CREATE_PATIENT, {
    onCompleted: (data) => {
      toast.success('Patient created successfully');
      mobileAnalytics.trackPatientCreated(data.createPatient._id, centerId, false);
      
      const patientCenter = data.createPatient.profileData?.centers?.[0];
      if (patientCenter?.organization?._id) {
        localStorage.setItem('organizationId', patientCenter.organization._id);
        localStorage.setItem('stance-organizationID', patientCenter.organization._id);
      }
      
      if (patientCenter?._id) {
        localStorage.setItem('centerId', patientCenter._id);
        localStorage.setItem('stance-centreID', patientCenter._id);
      }
      
      if (sessionType) {
        onComplete(data.createPatient._id, true, sessionType);
      }
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
          setIsNewUser(false);
          setIsPhoneVerified(true);
          setShowSessionTypeModal(true);
          return;
        }
      } else {
        setIsNewUser(true);
        setIsPhoneVerified(true);
        toast.success('Phone number verified! Please fill in your details.');
      }
    } catch (error) {
      console.error('Error checking patient existence:', error);
      toast.error('Error verifying phone number. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRepeatUserContinueWithSessionType = async (selectedSessionType: 'in-person' | 'online') => {
    setIsNavigating(true);
    try {
      const { data: patientData } = await getPatientByPhone({
        variables: { phone: formData.phone },
      });
      
      const patient = patientData?.patientByPhone;
      if (patient) {
        setSessionType(selectedSessionType);
        onComplete(patient._id, false, selectedSessionType);
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

  const handleRepeatUserContinue = async () => {
    setShowSessionTypeModal(true);
  };

  const handleCallNow = () => {
    mobileAnalytics.trackSupportRequest('call', 'patient_onboarding_help', formData.phone, centerId);
    window.location.href = 'tel:+919019410049';
  };

  const validateForm = () => {
    const errors: any = {};

    if (!formData.firstName || !formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      mobileAnalytics.trackPatientFormValidationError('firstName', 'required', centerId);
    }
    if (!formData.phone || formData.phone.length !== 10) {
      errors.phone = 'Phone number must be 10 digits';
      mobileAnalytics.trackPatientFormValidationError('phone', 'invalid_length', centerId);
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email address';
      mobileAnalytics.trackPatientFormValidationError('email', 'invalid_format', centerId);
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = async () => {
    if (!isPhoneVerified) {
      await handlePhoneVerification();
      return;
    }
    if (!sessionType) {
      toast.error('Please select a session type');
      return;
    }

    if (validateForm()) {
      await handleSubmit();
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
      referral: formData.referral.type ? formData.referral : undefined,
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

  const renderPhoneInput = () => (
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
            if (digitsOnly.length > 0 && !trackedFields.phone) {
              mobileAnalytics.trackPhoneNumberEntered(centerId);
              setTrackedFields(prev => ({ ...prev, phone: true }));
            }
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
            onClick={() => {
              mobileAnalytics.trackPhoneVerificationClicked(formData.phone, centerId);
              handlePhoneVerification();
            }}
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
  );

  const renderForm = () => (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => {
              updateFormData('firstName', e.target.value);
              if (e.target.value.trim().length > 0 && !trackedFields.firstName) {
                mobileAnalytics.trackFirstNameEntered(centerId);
                setTrackedFields(prev => ({ ...prev, firstName: true }));
              }
            }}
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
            onChange={(e) => {
              updateFormData('lastName', e.target.value);
              if (e.target.value.trim().length > 0 && !trackedFields.lastName) {
                mobileAnalytics.trackLastNameEntered(centerId);
                setTrackedFields(prev => ({ ...prev, lastName: true }));
              }
            }}
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
          onChange={(e) => {
            updateFormData('email', e.target.value);
            if (e.target.value.trim().length > 0 && !trackedFields.email) {
              mobileAnalytics.trackEmailEntered(centerId);
              setTrackedFields(prev => ({ ...prev, email: true }));
            }
          }}
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
              onClick={() => {
                updateFormData('gender', option.value);
                mobileAnalytics.trackGenderSelected(option.value, centerId);
              }}
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
          onChange={(e) => {
            updateFormData('dob', e.target.value);
            if (e.target.value && !trackedFields.dob) {
              mobileAnalytics.trackDateOfBirthEntered(centerId);
              setTrackedFields(prev => ({ ...prev, dob: true }));
            }
          }}
          disabled={!isPhoneVerified}
          className={`w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none ${!isPhoneVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          max={new Date().toISOString().split('T')[0]}
        />
        {formData.dob && isPhoneVerified && (
          <p className="text-sm text-gray-500 mt-1">
            Age:{' '}
            {Math.floor(
              (Date.now() - new Date(formData.dob).getTime()) /
                (365.25 * 24 * 60 * 60 * 1000)
            )}{' '}
            years
          </p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Bio / Notes (Optional)
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => {
            updateFormData('bio', e.target.value);
            if (e.target.value.trim().length > 0 && !trackedFields.notes) {
              mobileAnalytics.trackNotesEntered(centerId);
              setTrackedFields(prev => ({ ...prev, notes: true }));
            }
          }}
          disabled={!isPhoneVerified}
          className={`w-full h-32 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none ${!isPhoneVerified ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          placeholder="Add any additional information about the patient..."
        />
      </div>
    </>
  );

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
              Book Your Appointment
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
              {renderPhoneInput()}
              
              {isPhoneVerified && isNewUser && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Type *
                  </label>
                  <div className="bg-white rounded-xl p-1 border border-gray-200 flex">
                    <button
                      type="button"
                      onClick={() => setSessionType('in-person')}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                        sessionType === 'in-person'
                          ? 'text-black shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      style={{
                        backgroundColor: sessionType === 'in-person' ? '#DDFE71' : 'transparent'
                      }}
                    >
                      In Person
                    </button>
                    <button
                      type="button"
                      onClick={() => setSessionType('online')}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium text-xs transition-all ${
                        sessionType === 'online'
                          ? 'text-black shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                      style={{
                        backgroundColor: sessionType === 'online' ? '#DDFE71' : 'transparent'
                      }}
                    >
                      Online
                    </button>
                  </div>
                </div>
              )}
              
              {renderForm()}
            </div>
          </div>

          {formErrors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{formErrors.general}</p>
            </div>
          )}
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        {!isPhoneVerified ? (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                mobileAnalytics.trackPhoneVerificationClicked(formData.phone, centerId);
                handlePhoneVerification();
              }}
              disabled={isVerifying || !formData.phone || formData.phone.length !== 10}
              className="flex-1 py-4 rounded-2xl font-semibold text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
              style={{ backgroundColor: isVerifying || !formData.phone || formData.phone.length !== 10 ? '#9CA3AF' : '#DDFE71' }}
            >
              {isVerifying ? 'Verifying...' : 'Verify Number'}
            </button>
            <button
              onClick={() => {
                mobileAnalytics.trackCallNowClicked(centerId, 'patient_onboarding');
                handleCallNow();
              }}
              className="flex-1 py-4 border-2 text-black rounded-2xl font-semibold transition-all"
              style={{ borderColor: '#DDFE71', backgroundColor: 'transparent' }}
            >
              Call Now
            </button>
          </div>
        ) : (
          <div className="flex space-x-3">
            {isNewUser ? (
              <button
                onClick={() => {
                  mobileAnalytics.trackContinueButtonClicked('patient_onboarding', centerId, formData.phone);
                  handleContinue();
                }}
                disabled={creating}
                className="flex-1 py-4 rounded-2xl text-sm text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ backgroundColor: creating ? '#9CA3AF' : '#DDFE71' }}
              >
                {creating ? 'Creating Profile...' : 'Continue'}
              </button>
            ) : (
              <button
                onClick={() => {
                  handleRepeatUserContinue();
                }}
                disabled={isNavigating}
                className="flex-1 py-4 rounded-2xl text-sm text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                style={{ backgroundColor: isNavigating ? '#9CA3AF' : '#DDFE71' }}
              >
                {isNavigating ? 'Loading...' : 'Continue'}
              </button>
            )}
            <button
              onClick={() => {
                mobileAnalytics.trackCallNowClicked(centerId, 'patient_onboarding');
                handleCallNow();
              }}
              className="flex-1 py-4 border-2 text-black rounded-2xl text-sm transition-all"
              style={{ borderColor: '#DDFE71', backgroundColor: 'transparent' }}
            >
              Call Now
            </button>
          </div>
        )}
      </div>

      {isNavigating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <StanceHealthLoader message="Loading..." />
          </div>
        </div>
      )}

      <SessionTypeSelectionModal
        isOpen={showSessionTypeModal}
        onClose={() => !isNavigating && setShowSessionTypeModal(false)}
        onSelect={(selectedSessionType) => {
          setSessionType(selectedSessionType);
          handleRepeatUserContinueWithSessionType(selectedSessionType);
        }}
        selectedSessionType={sessionType || undefined}
      />
    </div>
  );
}
