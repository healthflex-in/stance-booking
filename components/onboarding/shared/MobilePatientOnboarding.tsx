import React, { useState } from 'react';
import { toast } from 'sonner';
import { useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  ChevronDown,
  MessageCircle,
} from 'lucide-react';
import {
  GET_CENTERS,
  GET_PATIENTS,
  CREATE_PATIENT,
  GET_CONSULTANTS,
  PATIENT_EXISTS,
  PATIENT_BY_PHONE,
} from '@/gql/queries';
import { useDebounce } from '@/hooks';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';
import WhatsAppButton from './WhatsAppButton';
import Popup from "./Popup";
import LeadDetectionModal from './LeadDetectionModal';
import { getBookingCookies } from '@/utils/booking-cookies';

interface MobilePatientOnboardingProps {
  centerId: string;
  onNext: () => void;
  onPatientCreated: (patientId: string, isNewUser: boolean) => void;
}

interface FormData {
  firstName: string;
  lastName: string;
  patientType: 'OP' | 'HOME';
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email: string;
  dob: string;
  consultant: string | null;
  category: string;
  bio: string;
  cohort: string | null;
  centers: string[];
  referral: {
    type: 'PATIENT' | 'CONSULTANT' | 'OTHER' | '';
    user: string;
    name: string;
  };
}

export default function MobilePatientOnboarding({
  centerId,
  onNext,
  onPatientCreated,
}: MobilePatientOnboardingProps) {
  const router = useRouter();
  const mobileAnalytics = useMobileFlowAnalytics();
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isUserExists, setIsUserExists] = useState(false);
  const [leadUser, setLeadUser] = useState<any>(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    patientType: 'OP',
    gender: 'MALE',
    phone: '',
    email: '',
    dob: '',
    consultant: null,
    category: 'WEBSITE', // This ensures mobile web patients are marked as WEBSITE category
    bio: '',
    cohort: 'SURGICAL',
    centers: [centerId || ''],
    referral: {
      type: '',
      user: '',
      name: '',
    },
  });

  const [formErrors, setFormErrors] = useState<any>({});
  const [patientsSearch, setPatientsSearch] = useState('');
  const debouncedPatientsSearch = useDebounce(patientsSearch, 500);
  const [showPopup, setShowPopup] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [trackedFields, setTrackedFields] = useState({
    phone: false,
    firstName: false,
    lastName: false,
    email: false,
    dob: false,
    notes: false
  });
  const [formStartTime] = useState(Date.now());
  const [userEngagementScore, setUserEngagementScore] = useState(0);

  // Track component mount and patient details start
  React.useEffect(() => {
    mobileAnalytics.trackPatientOnboardingStart(centerId);
    
    // Track patient details form start (custom event)
    mobileAnalytics.trackPatientDetailsStart('', centerId);
    
    // Track referral source from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get('utm_source') || urlParams.get('source') || 'direct';
    const campaign = urlParams.get('utm_campaign');
    const medium = urlParams.get('utm_medium');
    
    if (source !== 'direct') {
      mobileAnalytics.trackReferralSource(source, campaign || '', medium || '', '', centerId);
    }
    
    // Track mobile optimization score
    const screenSize = `${window.innerWidth}x${window.innerHeight}`;
    const deviceType = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    const optimizationScore = window.innerWidth < 768 ? 85 : 95;
    
    mobileAnalytics.trackMobileOptimization(optimizationScore, deviceType, screenSize);
  }, [centerId]); // Removed mobileAnalytics dependency

  // Queries
  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    fetchPolicy: 'cache-first',
  });

  // Set organization ID when centers data is loaded
  React.useEffect(() => {
    if (centersData?.centers && centerId) {
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

  const { data: consultantsData, loading: consultantsLoading } = useQuery(
    GET_CONSULTANTS,
    {
      variables: {
        userType: 'CONSULTANT',
        centerId: formData.centers,
      },
      fetchPolicy: 'cache-first',
    }
  );

  const [fetchPatients, { data: patientsData, loading: patientsLoading }] =
    useLazyQuery(GET_PATIENTS, {
      variables: {
        userType: 'PATIENT',
        centerId: formData.centers,
        ...(debouncedPatientsSearch.trim() && {
          search: debouncedPatientsSearch.trim(),
        }),
        pagination: { limit: 50 },
      },
      fetchPolicy: 'cache-and-network',
    });

  const [checkPatientExists, { loading: checkingUser }] = useLazyQuery(
    PATIENT_EXISTS,
    {
      fetchPolicy: 'network-only',
    }
  );

  const [getPatientByPhone] = useLazyQuery(
    PATIENT_BY_PHONE,
    {
      fetchPolicy: 'network-only',
    }
  );

  // Mutation
  const [createPatientMutation, { loading: creating }] = useMutation(
    CREATE_PATIENT,
    {
      onCompleted: (data) => {
        toast.success('Patient created successfully');
        
        // Track patient creation success
        mobileAnalytics.trackPatientCreated(data.createPatient._id, centerId, false);
        
        // Set organization ID in localStorage from the created patient's center
        const patientCenter = data.createPatient.profileData?.centers?.[0];
        if (patientCenter?.organization?._id) {
          localStorage.setItem('organizationId', patientCenter.organization._id);
          localStorage.setItem('stance-organizationID', patientCenter.organization._id);
        }
        
        // Set center ID in localStorage
        if (patientCenter?._id) {
          localStorage.setItem('centerId', patientCenter._id);
          localStorage.setItem('stance-centreID', patientCenter._id);
        }
        
        onPatientCreated(data.createPatient._id, true);
        onNext();
      },
      onError: (error) => {
        toast.error("Error: " + (error?.message || "Failed to create patient"));
      },
    }
  );

  const handlePhoneVerification = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      setFormErrors({ phone: 'Phone number must be 10 digits' });
      return;
    }

    setIsVerifying(true);
    try {
      const { data } = await checkPatientExists({
        variables: {
          phone: formData.phone,
        },
      });
      
      if (data?.patientExists) {
        // Get full patient details
        const { data: patientData } = await getPatientByPhone({
          variables: {
            phone: formData.phone,
          },
        });
        
        const patient = patientData?.patientByPhone;
        if (patient) {
          // User exists - show welcome modal for all existing users
          setLeadUser({
            firstName: patient.profileData.firstName,
            lastName: patient.profileData.lastName,
            phone: patient.phone,
            status: patient.profileData.status,
            id: patient._id
          });
          setShowLeadModal(true);
          return;
        }
      } else {
        setIsPhoneVerified(true);
        setIsUserExists(false);
        toast.success('Phone number verified! Please fill in your details.');
      }
    } catch (error) {
      console.error('Error checking patient existence:', error);
      toast.error('Error verifying phone number. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCallNow = () => {
    mobileAnalytics.trackSupportRequest('call', 'patient_onboarding_help', formData.phone, centerId);
    window.location.href = 'tel:+919019410049';
  };

  const handleWhatsApp = () => {
    mobileAnalytics.trackSupportRequest('whatsapp', 'patient_onboarding_help', formData.phone, centerId);
    const message = encodeURIComponent('I want to book an appointment');
    window.open(`https://wa.me/919019410049?text=${message}`, '_blank');
  };

  const handlePopupClose = () => {
    setShowPopup(false);
    router.push("/onboarding-patient");
  };

  const handleLeadModalClose = () => {
    setShowLeadModal(false);
    setLeadUser(null);
  };

  const handleBookSlotsForLead = () => {
    // Continue with the booking flow using the lead user's ID
    if (leadUser?.id) {
      // Get organization and center IDs from cookies
      const cookies = getBookingCookies();
      const organizationId = cookies.organizationId || '';
      const finalCenterId = cookies.centerId || centerId || '';
      
      if (organizationId) {
          localStorage.setItem('organizationId', organizationId);
        localStorage.setItem('stance-organizationID', organizationId);
      }
      if (finalCenterId) {
        localStorage.setItem('centerId', finalCenterId);
        localStorage.setItem('stance-centreID', finalCenterId);
      }
      
      onPatientCreated(leadUser.id, false);
      onNext(); // Continue to the next step in the booking flow
    }
    setShowLeadModal(false);
  };

  const handleCallStance = () => {
    window.location.href = 'tel:+919019410049';
    setTimeout(() => {
      window.location.reload();
    }, 1000);
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

    if (validateForm()) {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const dobDate = formData.dob ? new Date(formData.dob) : null;
    const dobTimestamp = dobDate ? Math.floor(dobDate.getTime() / 1000) : null;

    const patientTypeMap = {
      OP: 'OP_Patient',
      HOME: 'Home_Patient',
    };

    // Get organization and center IDs from cookies
    const cookies = getBookingCookies();
    const organizationId = cookies.organizationId || '';
    const finalCenterId = cookies.centerId || centerId || '';

    if (!organizationId || !finalCenterId) {
      toast.error('Organization or center information is missing');
      return;
    }

    // Set mobile-specific keys in localStorage before mutation
    localStorage.setItem('mobile-organizationID', organizationId);
    localStorage.setItem('mobile-centreID', finalCenterId);

    const input = {
      bio: formData.bio,
      phone: formData.phone,
      gender: formData.gender,
      centers: [finalCenterId],
      category: formData.category,
      lastName: formData.lastName,
      firstName: formData.firstName,
      patientType: patientTypeMap[formData.patientType],
      ...(formData.dob && { dob: dobTimestamp }),
      ...(formData.email && { email: formData.email }),
      ...(formData.cohort && { cohort: formData.cohort }),
      ...(formData.consultant && { consultant: formData.consultant === "any" ? null : formData.consultant, }),
      ...(formData.category === 'REFERRAL' &&
        formData.referral.type && {
          referral: {
            type: formData.referral.type,
            ...(formData.referral.type !== 'OTHER' && { user: formData.referral.user }),
            name: formData.referral.name || 'External',
          },
        }),
    };

    try {
      await createPatientMutation({ variables: { input } });
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

  const renderForm = () => (
    <div className="space-y-6">
      {/* Phone Number - Always visible */}
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

      {/* Other fields - Disabled until phone is verified */}
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
          onFocus={() => mobileAnalytics.trackFormFieldFocus('email', 'patient_onboarding')}
          onBlur={() => mobileAnalytics.trackFormFieldBlur('email', 'patient_onboarding', !!formData.email)}
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



      {/* Gender */}
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

      {/* Date of Birth */}
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

      {/* Bio/Notes */}
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
    </div>
  );



  const { isInDesktopContainer } = useContainerDetection();

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Full Width Header Image - Inside Scroll */}
        <div 
          className="relative h-36 w-full"
          style={{
            backgroundImage: 'url(/indra.webp)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Blue overlay */}
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20"></div>
        </div>
        
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          {/* Header Content Below Image */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-[#DDFE71]" />
                </div>
                <h6 className="text-sm font-semibold text-gray-900">
                  Book Your First Appointment
                </h6>
              </div>
              <img 
                src="/stance-logo.png" 
                alt="Stance Health" 
                className="h-16 w-auto"
              />
            </div>
            <p className="text-gray-600 text-sm">
              {!isPhoneVerified 
                ? 'Enter your phone number to get started'
                : 'Complete your profile details'
              }
            </p>
          </div>

          {/* Form Content */}
          <div className="mb-6">
            {renderForm()}
          </div>

          {/* Error Message */}
          {formErrors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm">{formErrors.general}</p>
            </div>
          )}
        </div>
      </div>

      {/* WhatsApp Button */}
      {/* <button
        onClick={handleWhatsApp}
        className={`${isInDesktopContainer ? 'absolute right-4 -top-16' : 'fixed right-4 bottom-24'} w-12 h-12 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg transition-all z-40`}
        title="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button> */}

      {/* Navigation Buttons */}
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



      <LeadDetectionModal
        isOpen={showLeadModal}
        onClose={handleLeadModalClose}
        onBookSlots={handleBookSlotsForLead}
        patientData={leadUser || { firstName: '', lastName: '', phone: '', status: '' }}
      />
      
      <WhatsAppButton context="patient_onboarding" />
    </div>
  );
}
