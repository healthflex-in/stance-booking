'use client';

import React, { useState } from 'react';
import { useLazyQuery, useMutation } from '@apollo/client';
import { toast } from 'sonner';
import { User } from 'lucide-react';
import {
  CHECK_PATIENT_BY_PHONE,
  ADD_PATIENT_TO_ORGANIZATION,
  CREATE_PATIENT,
  SEND_EMAIL_OTP,
  VERIFY_EMAIL_OTP,
} from '@/gql/queries';
import { getBookingCookies } from '@/utils/booking-cookies';
import { tabStorage } from '@/utils/tab-storage';
import { StanceHealthLoader } from '@/components/loader/StanceHealthLoader';
import CrossOrgModal from './shared/CrossOrgModal';
import NewUserServiceModal from './shared/NewUserServiceModal';
import EmailOTPModal from './shared/EmailOTPModal';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { useMobileFlowAnalytics } from '@/services/mobile-analytics';

interface OfflineOnboardingProps {
  centerId: string;
  onComplete: (patientId: string, isNewUser: boolean) => void;
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OfflineOnboarding({ centerId, onComplete }: OfflineOnboardingProps) {
  const { isInDesktopContainer } = useContainerDetection();
  const mobileAnalytics = useMobileFlowAnalytics();

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpToken, setOtpToken] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [repeatPatientId, setRepeatPatientId] = useState<string | null>(null);

  const [trackedFields, setTrackedFields] = useState({
    phone: false, firstName: false, lastName: false, email: false, dob: false, notes: false,
  });
  const [showCrossOrgModal, setShowCrossOrgModal] = useState(false);
  const [showNewUserServiceModal, setShowNewUserServiceModal] = useState(false);
  const [crossOrgPatient, setCrossOrgPatient] = useState<any>(null);
  const [formData, setFormData] = useState<FormData>({
    phone: '', firstName: '', lastName: '', email: '', gender: 'MALE', dob: '', bio: '',
  });
  const [formErrors, setFormErrors] = useState<any>({});

  const [checkPatientByPhone] = useLazyQuery(CHECK_PATIENT_BY_PHONE, { fetchPolicy: 'network-only' });

  const [addPatientToOrg, { loading: addingToOrg }] = useMutation(ADD_PATIENT_TO_ORGANIZATION, {
    onCompleted: () => {
      toast.success('Added to organization successfully!');
      setShowCrossOrgModal(false);
      if (crossOrgPatient) onComplete(crossOrgPatient._id, false);
    },
    onError: (error) => {
      console.error('Error adding patient to organization:', error);
      toast.error('Failed to add to organization. Please try again.');
    },
  });

  const [createPatient, { loading: creating }] = useMutation(CREATE_PATIENT, {
    onCompleted: (data) => {
      toast.success('Patient created successfully');
      mobileAnalytics.trackPatientCreated(data.createPatient._id, centerId, false);
      onComplete(data.createPatient._id, true);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create patient');
    },
  });

  const [sendEmailOTPMutation] = useMutation(SEND_EMAIL_OTP);
  const [verifyEmailOTPMutation] = useMutation(VERIFY_EMAIL_OTP);

  const openOTPModal = async (email: string) => {
    setOtpEmail(email);
    setOtpError(null);
    setShowOTPModal(true);
    setIsSendingOTP(true);
    try {
      const { data } = await sendEmailOTPMutation({ variables: { email } });
      setOtpToken(data.sendEmailOTP.token);
    } catch (err) {
      setOtpError('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (code: string) => {
    if (!otpToken) { setOtpError('OTP token missing. Please resend.'); return; }
    setIsVerifyingOTP(true);
    setOtpError(null);
    try {
      const { data } = await verifyEmailOTPMutation({
        variables: { input: { email: otpEmail, otp: code, token: otpToken } },
      });
      const session = data.verifyEmailOTP;
      if (repeatPatientId) {
        localStorage.setItem('token', session.token);
        localStorage.setItem('refreshToken', session.refreshToken);
        localStorage.setItem('user', JSON.stringify(session.user));
        setShowOTPModal(false);
        onComplete(repeatPatientId, false);
      } else {
        setEmailVerified(true);
        setShowOTPModal(false);
        toast.success('Email verified!');
      }
    } catch (err) {
      setOtpError('Invalid OTP. Please try again.');
    } finally {
      setIsVerifyingOTP(false);
    }
  };

  const handleResendOTP = async () => {
    setIsSendingOTP(true);
    setOtpError(null);
    try {
      const { data } = await sendEmailOTPMutation({ variables: { email: otpEmail } });
      setOtpToken(data.sendEmailOTP.token);
    } catch (err) {
      setOtpError('Failed to resend OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handleUpdateEmail = async (newEmail: string) => {
    setIsSendingOTP(true);
    setOtpError(null);
    try {
      const { data } = await sendEmailOTPMutation({ variables: { email: newEmail } });
      setOtpToken(data.sendEmailOTP.token);
      setOtpEmail(newEmail);
    } catch (err) {
      setOtpError('Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOTP(false);
    }
  };

  const handlePhoneVerification = async () => {
    if (!formData.phone || formData.phone.length !== 10) {
      setFormErrors({ phone: 'Phone number must be 10 digits' });
      return;
    }
    const cookies = getBookingCookies();
    const organizationId = cookies.organizationId;
    if (!organizationId) {
      toast.error('Organization not found. Please refresh the page.');
      return;
    }
    setIsVerifying(true);
    try {
      const { data: checkData } = await checkPatientByPhone({
        variables: { phone: formData.phone, organizationId },
      });
      const { exists, patient, isInDifferentOrg } = checkData?.checkPatientByPhone || {};

      if (exists && isInDifferentOrg) {
        setCrossOrgPatient(patient);
        setShowCrossOrgModal(true);
        setIsPhoneVerified(true);
        return;
      }

      if (exists && !isInDifferentOrg) {
        const isNewUserService = tabStorage.getItem('isNewUserService') === 'true';
        if (isNewUserService) {
          setShowNewUserServiceModal(true);
          setFormData(prev => ({ ...prev, phone: '' }));
          return;
        }
        setRepeatPatientId(patient._id);
        setIsPhoneVerified(true);
        setIsNewUser(false);
        openOTPModal(patient.email || ''); // fire and forget
        return;
      }

      setIsNewUser(true);
      setIsPhoneVerified(true);
      toast.success('Phone number verified! Please fill in your details.');
    } catch (error) {
      console.error('Error checking patient existence:', error);
      toast.error('Error verifying phone number. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCrossOrgConfirm = async () => {
    if (!crossOrgPatient) return;
    const cookies = getBookingCookies();
    const organizationId = cookies.organizationId;
    if (!organizationId) { toast.error('Organization not found.'); return; }
    try {
      await addPatientToOrg({
        variables: { patientId: crossOrgPatient._id, organizationId, centerIds: [centerId] },
      });
    } catch (error) {
      console.error('Error in cross-org confirmation:', error);
    }
  };

  const handleCrossOrgCancel = () => {
    setShowCrossOrgModal(false);
    setCrossOrgPatient(null);
    setIsPhoneVerified(false);
    setFormData(prev => ({ ...prev, phone: '' }));
  };

  const validateForm = () => {
    const errors: any = {};
    if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
    if (!formData.phone || formData.phone.length !== 10) errors.phone = 'Phone number must be 10 digits';
    if (formData.email && !EMAIL_REGEX.test(formData.email)) errors.email = 'Invalid email address';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (formData.email && !emailVerified) {
      toast.error('Please verify your email before continuing.');
      return;
    }
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
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev: any) => ({ ...prev, [field]: undefined }));
    if (field === 'email' && emailVerified) {
      setEmailVerified(false);
      setOtpToken(null);
    }
  };

  const handleEmailBlur = () => {
    if (!isNewUser || !isPhoneVerified) return;
    if (!formData.email || !EMAIL_REGEX.test(formData.email)) return;
    if (emailVerified) return;
    openOTPModal(formData.email);
  };

  return (
    <div className={`${isInDesktopContainer ? 'h-full' : 'min-h-screen'} bg-gray-50 flex flex-col`}>
      <div
        className="relative h-36 w-full flex-shrink-0"
        style={{ backgroundImage: 'url(/indra.webp)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20" />
      </div>

      <div className="flex-shrink-0 bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-[#DDFE71]" />
            </div>
            <h6 className="text-sm font-semibold text-gray-900">Book Your In-Person Appointment</h6>
          </div>
          <img src="/stance-logo.png" alt="Stance Health" className="h-16 w-auto" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className={`p-4 ${isInDesktopContainer ? 'pb-6' : 'pb-32'}`}>
          <p className="text-gray-600 text-sm mb-6">
            {!isPhoneVerified ? 'Enter your phone number to get started' : 'Complete your profile details'}
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
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
                      setRepeatPatientId(null);
                      setEmailVerified(false);
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
                      mobileAnalytics.trackPhoneVerificationAttempt(formData.phone, centerId);
                      handlePhoneVerification();
                    }}
                    disabled={isVerifying}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded text-xs font-medium text-black disabled:bg-gray-400"
                    style={{ backgroundColor: isVerifying ? '#9CA3AF' : '#DDFE71' }}
                  >
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </button>
                )}
              </div>
              {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
              {isPhoneVerified && <p className="text-green-600 text-xs mt-1">✓ Phone number verified</p>}
            </div>

            {isPhoneVerified && isNewUser && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
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
                      className={`w-full p-3 border-2 rounded-xl ${formErrors.firstName ? 'border-red-300' : 'border-gray-200'} focus:border-blue-500 outline-none`}
                      placeholder="First name"
                    />
                    {formErrors.firstName && <p className="text-red-500 text-xs mt-1">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
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
                      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                    {emailVerified && <span className="ml-2 text-green-600 text-xs">✓ Verified</span>}
                  </label>
                  <div className="relative">
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
                      className={`w-full p-3 pr-20 border-2 rounded-xl ${
                        formErrors.email ? 'border-red-300' : emailVerified ? 'border-green-300 bg-green-50' : 'border-gray-200'
                      } focus:border-blue-500 outline-none`}
                      placeholder="your.email@example.com"
                    />
                    {!emailVerified && formData.email && EMAIL_REGEX.test(formData.email) && (
                      <button
                        onClick={() => openOTPModal(formData.email)}
                        disabled={isSendingOTP}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-2 py-1 rounded text-xs font-medium text-black disabled:bg-gray-400 disabled:cursor-not-allowed"
                        style={{ backgroundColor: isSendingOTP ? '#9CA3AF' : '#DDFE71' }}
                      >
                        {isSendingOTP ? 'Sending...' : 'Verify'}
                      </button>
                    )}
                  </div>
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Gender</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ value: 'MALE', label: 'Male' }, { value: 'FEMALE', label: 'Female' }, { value: 'OTHER', label: 'Other' }].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          updateFormData('gender', option.value);
                          mobileAnalytics.trackGenderSelected(option.value, centerId);
                        }}
                        className={`p-3 border-2 rounded-xl transition-all ${
                          formData.gender === option.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
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
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {formData.dob && (
                    <p className="text-sm text-gray-500 mt-1">
                      Age: {Math.floor((Date.now() - new Date(formData.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio / Notes (Optional)</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => {
                      updateFormData('bio', e.target.value);
                      if (e.target.value.trim().length > 0 && !trackedFields.notes) {
                        mobileAnalytics.trackNotesEntered(centerId);
                        setTrackedFields(prev => ({ ...prev, notes: true }));
                      }
                    }}
                    className="w-full h-32 p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none resize-none"
                    placeholder="Add any additional information..."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className={`${isInDesktopContainer ? 'flex-shrink-0' : 'fixed bottom-0 left-0 right-0'} bg-white border-t border-gray-200 p-4`}>
        {!isPhoneVerified ? (
          <button
            onClick={() => {
              mobileAnalytics.trackPhoneVerificationAttempt(formData.phone, centerId);
              handlePhoneVerification();
            }}
            disabled={isVerifying || !formData.phone || formData.phone.length !== 10}
            className="w-full py-4 rounded-2xl font-semibold text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            style={{ backgroundColor: isVerifying || !formData.phone || formData.phone.length !== 10 ? '#9CA3AF' : '#DDFE71' }}
          >
            {isVerifying ? 'Verifying...' : 'Verify Number'}
          </button>
        ) : isNewUser ? (
          <button
            onClick={() => {
              mobileAnalytics.trackContinueButtonClicked('patient_onboarding', centerId, formData.phone);
              handleSubmit();
            }}
            disabled={creating || (!!formData.email && !emailVerified)}
            className="w-full py-4 rounded-2xl font-semibold text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
            style={{ backgroundColor: creating || (!!formData.email && !emailVerified) ? '#9CA3AF' : '#DDFE71' }}
          >
            {creating ? 'Creating Profile...' : formData.email && !emailVerified ? 'Verify email to continue' : 'Continue'}
          </button>
        ) : null}
      </div>

      {isVerifying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6">
            <StanceHealthLoader message="Verifying..." />
          </div>
        </div>
      )}

      <EmailOTPModal
        isOpen={showOTPModal}
        email={otpEmail}
        isSending={isSendingOTP}
        isVerifying={isVerifyingOTP}
        error={otpError}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        onUpdateEmail={handleUpdateEmail}
        onClose={() => {
          setShowOTPModal(false);
          setOtpError(null);
          if (repeatPatientId && !emailVerified) {
            setIsPhoneVerified(false);
            setRepeatPatientId(null);
            setFormData(prev => ({ ...prev, phone: '' }));
          }
        }}
      />

      <CrossOrgModal
        isOpen={showCrossOrgModal}
        patient={crossOrgPatient}
        onConfirm={handleCrossOrgConfirm}
        onCancel={handleCrossOrgCancel}
        loading={addingToOrg}
      />

      <NewUserServiceModal
        isOpen={showNewUserServiceModal}
        onClose={() => setShowNewUserServiceModal(false)}
        onCallNow={() => { window.location.href = 'tel:+919019410049'; }}
        isInDesktopContainer={isInDesktopContainer}
      />
    </div>
  );
}
