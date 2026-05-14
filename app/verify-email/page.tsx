'use client';

import React, { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Mail, ArrowLeft } from 'lucide-react';
import { SEND_EMAIL_OTP, VERIFY_EMAIL_OTP, UPDATE_PATIENT } from '@/gql/queries';
import { useAuth } from '@/contexts/AuthContext';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const patientId = searchParams.get('patientId');
  const email = searchParams.get('email');
  const token = searchParams.get('token');
  const isRequired = searchParams.get('required') === 'true';
  
  const [otpCode, setOtpCode] = useState('');
  const [otpToken, setOtpToken] = useState<string | null>(token);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [isEditingEmail, setIsEditingEmail] = useState(!email);
  const [currentEmail, setCurrentEmail] = useState(email || '');

  const [sendEmailOTPMutation, { loading: isSending }] = useMutation(SEND_EMAIL_OTP);
  const [verifyEmailOTPMutation, { loading: isVerifying }] = useMutation(VERIFY_EMAIL_OTP);
  const [updatePatientMutation] = useMutation(UPDATE_PATIENT);

  useEffect(() => {
    if (!patientId) {
      toast.error('Invalid verification link');
      router.push('/');
      return;
    }
    
    // If token is provided in URL, OTP was already sent
    if (token && email) {
      toast.success(`Verification code sent to ${email}`);
    }
  }, [patientId, email, token]);

  const sendOTP = async (emailAddress: string) => {
    setError(null);
    try {
      const { data } = await sendEmailOTPMutation({ variables: { email: emailAddress } });
      setOtpToken(data.sendEmailOTP);
      toast.success(`Verification code sent to ${emailAddress}`);
    } catch (err: any) {
      setError('Failed to send verification code. Please try again.');
      toast.error('Failed to send verification code');
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpToken) {
      setError('OTP token missing. Please resend.');
      return;
    }
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    setError(null);
    try {
      const { data } = await verifyEmailOTPMutation({
        variables: { 
          input: { 
            email: currentEmail, 
            otp: otpCode, 
            token: otpToken 
          } 
        },
      });
      
      const session = data.verifyEmailOTP;
      // Extract token, refreshToken, and user from session
      login(session.token, session.refreshToken, session.user);
      
      toast.success('Email verified successfully!');
      
      // Check for pending booking in sessionStorage
      const pendingBooking = sessionStorage.getItem('pendingBooking');
      if (pendingBooking) {
        const { patientId: bookingPatientId, isNewUser, sessionType } = JSON.parse(pendingBooking);
        sessionStorage.removeItem('pendingBooking');
        
        // Trigger the booking flow continuation
        // Since we're in a separate page, we need to navigate back with the booking info
        const currentPath = window.location.pathname;
        const bookingPath = currentPath.replace('/verify-email', '');
        window.location.href = `${bookingPath}?continueBooking=true&patientId=${bookingPatientId}&isNewUser=${isNewUser}&sessionType=${sessionType}`;
      } else {
        // No pending booking, just go back
        router.back();
      }
    } catch (err) {
      setError('Invalid verification code. Please try again.');
    }
  };

  const handleUpdateEmail = async () => {
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    try {
      await updatePatientMutation({
        variables: {
          patientId,
          input: { email: newEmail }
        }
      });
      
      await sendOTP(newEmail);
      setCurrentEmail(newEmail);
      setIsEditingEmail(false);
    } catch (err: any) {
      setError('Failed to update email. Please try again.');
      toast.error('Failed to update email');
    }
  };

  const handleResendOTP = async () => {
    const emailToUse = currentEmail || newEmail;
    if (!emailToUse) {
      setError('Please enter an email address first');
      return;
    }
    await sendOTP(emailToUse);
  };

  const handleSkip = () => {
    // Check for pending booking
    const pendingBooking = sessionStorage.getItem('pendingBooking');
    if (pendingBooking) {
      const { patientId: bookingPatientId, isNewUser, sessionType } = JSON.parse(pendingBooking);
      sessionStorage.removeItem('pendingBooking');
      
      const currentPath = window.location.pathname;
      const bookingPath = currentPath.replace('/verify-email', '');
      window.location.href = `${bookingPath}?continueBooking=true&patientId=${bookingPatientId}&isNewUser=${isNewUser}&sessionType=${sessionType}`;
    } else {
      router.back();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-6">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>

            <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {isRequired ? 'Please Enter Your Email' : 'Verify Your Email'}
            </h1>
            <p className="text-center text-gray-600 mb-8">
              {isEditingEmail 
                ? (isRequired ? 'Please provide your email address to authenticate your account' : 'Enter your email address to receive a verification code')
                : `We've sent a 6-digit code to ${currentEmail}`
              }
            </p>

            {isEditingEmail ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                    placeholder="your.email@example.com"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleUpdateEmail}
                  disabled={isSending}
                  className="w-full py-3 rounded-xl font-semibold text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isSending ? '#9CA3AF' : '#DDFE71' }}
                >
                  {isSending ? 'Sending Code...' : 'Send Verification Code'}
                </button>

                <button
                  onClick={handleSkip}
                  className="w-full py-3 border-2 rounded-xl font-semibold text-gray-700 transition-all hover:bg-gray-50"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  {isRequired ? 'Continue Without Email' : 'Skip for Now'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      if (value.length <= 6) setOtpCode(value);
                    }}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 outline-none text-center text-2xl tracking-widest"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleVerifyOTP}
                  disabled={isVerifying || otpCode.length !== 6}
                  className="w-full py-3 rounded-xl font-semibold text-black transition-all disabled:bg-gray-400 disabled:cursor-not-allowed"
                  style={{ backgroundColor: isVerifying || otpCode.length !== 6 ? '#9CA3AF' : '#DDFE71' }}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Email'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => setIsEditingEmail(true)}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Change Email
                  </button>
                  <button
                    onClick={handleResendOTP}
                    disabled={isSending}
                    className="text-blue-600 hover:text-blue-700 font-medium disabled:text-gray-400"
                  >
                    {isSending ? 'Sending...' : 'Resend Code'}
                  </button>
                </div>

                <button
                  onClick={handleSkip}
                  className="w-full py-3 border-2 rounded-xl font-semibold text-gray-700 transition-all hover:bg-gray-50"
                  style={{ borderColor: '#E5E7EB' }}
                >
                  Skip for Now
                </button>
              </div>
            )}
          </div>

          <button
            onClick={() => router.back()}
            className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-900 mt-6 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}
