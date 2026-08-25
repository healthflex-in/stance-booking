'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { X, Mail } from 'lucide-react';
import { UPDATE_PATIENT, SEND_EMAIL_OTP, VERIFY_EMAIL_OTP } from '@/gql/queries';
import { toast } from 'sonner';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import EmailOTPModal from './EmailOTPModal';

interface EmailCollectionModalProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  currentEmail?: string;
  onEmailSaved: (email: string) => void;
  onClose: () => void;
}

export default function EmailCollectionModal({
  isOpen,
  patientId,
  patientName,
  currentEmail,
  onEmailSaved,
  onClose,
}: EmailCollectionModalProps) {
  const [email, setEmail] = useState(currentEmail || '');
  const [error, setError] = useState('');
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const { isInDesktopContainer } = useContainerDetection();

  const [updatePatient] = useMutation(UPDATE_PATIENT);
  const [sendEmailOTP, { loading: isSendingOTP }] = useMutation(SEND_EMAIL_OTP);
  const [verifyEmailOTP, { loading: isVerifyingOTP }] = useMutation(VERIFY_EMAIL_OTP);

  // Log when component mounts
  React.useEffect(() => {
    console.log('📧 EmailCollectionModal mounted');
    console.log('📧 sendEmailOTP mutation:', sendEmailOTP);
    console.log('📧 SEND_EMAIL_OTP imported:', typeof SEND_EMAIL_OTP);
  }, []);

  // Update email state when currentEmail prop changes
  React.useEffect(() => {
    if (isOpen) {
      console.log('📧 Modal opened with:', { currentEmail, patientId, patientName });
      setEmail(currentEmail || '');
      setError('');
      setShowOTPModal(false);
      setOtpError(null);
    }
  }, [isOpen, currentEmail, patientId, patientName]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendOTP = async () => {
    const trimmedEmail = email.trim();
    
    console.log('='.repeat(50));
    console.log('📧 EMAIL OTP SEND - START');
    console.log('='.repeat(50));
    console.log('📧 Current email:', currentEmail);
    console.log('📧 New email:', trimmedEmail);
    console.log('📧 Patient ID:', patientId);
    console.log('📧 Is sending OTP:', isSendingOTP);
    
    if (!trimmedEmail) {
      console.log('❌ Email is empty');
      setError('Email is required for online consultations');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      console.log('❌ Email validation failed');
      setError('Please enter a valid email address');
      return;
    }

    // If email hasn't changed, just close
    if (currentEmail && trimmedEmail === currentEmail) {
      console.log('📧 Email unchanged, closing modal');
      onClose();
      return;
    }

    // Send OTP to the new email
    try {
      console.log('📧 About to call sendEmailOTP mutation...');
      console.log('📧 Variables:', { email: trimmedEmail });
      
      const result = await sendEmailOTP({
        variables: { email: trimmedEmail },
      });
      
      console.log('✅ sendEmailOTP mutation completed');
      console.log('✅ Result:', JSON.stringify(result, null, 2));
      console.log('✅ Result data:', result?.data);
      
      setShowOTPModal(true);
      setError('');
      toast.success('OTP sent to your email');
      console.log('='.repeat(50));
      console.log('📧 EMAIL OTP SEND - SUCCESS');
      console.log('='.repeat(50));
    } catch (err: any) {
      console.log('='.repeat(50));
      console.log('❌ EMAIL OTP SEND - ERROR');
      console.log('='.repeat(50));
      console.error('❌ Full error object:', err);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error graphQLErrors:', err?.graphQLErrors);
      console.error('❌ Error networkError:', err?.networkError);
      console.error('❌ Error stack:', err?.stack);
      
      const errorMessage = err?.message || 'Failed to send OTP. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      console.log('='.repeat(50));
    }
  };

  const handleVerifyOTP = async (code: string) => {
    try {
      console.log('🔐 Verifying OTP:', code);
      console.log('🔐 Email:', email.trim());
      setOtpError(null);
      
      const result = await verifyEmailOTP({
        variables: {
          input: {
            email: email.trim(),
            otp: code,
          },
        },
      });
      console.log('✅ OTP verification result:', result);

      if (result.data?.verifyEmailOTP?.user) {
        console.log('✅ OTP verified, updating patient email');
        // OTP verified, now update patient email
        await updatePatient({
          variables: {
            patientId: patientId,
            input: {
              email: email.trim(),
            },
          },
        });
        console.log('✅ Patient email updated successfully');

        toast.success(currentEmail ? 'Email updated successfully' : 'Email saved successfully');
        setShowOTPModal(false);
        onEmailSaved(email.trim());
      }
    } catch (err: any) {
      console.error('❌ Error verifying OTP:', err);
      console.error('❌ Error message:', err?.message);
      console.error('❌ Error graphQLErrors:', err?.graphQLErrors);
      const errorMessage = err?.message || 'Invalid OTP. Please try again.';
      setOtpError(errorMessage);
    }
  };

  const handleResendOTP = async () => {
    try {
      console.log('🔄 Resending OTP to:', email.trim());
      setOtpError(null);
      await sendEmailOTP({
        variables: { email: email.trim() },
      });
      console.log('✅ OTP resent successfully');
      toast.success('OTP sent successfully');
    } catch (err: any) {
      console.error('❌ Error resending OTP:', err);
      console.error('❌ Error message:', err?.message);
      const errorMessage = err?.message || 'Failed to resend OTP. Please try again.';
      setOtpError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleUpdateEmail = async (newEmail: string) => {
    console.log('📝 Updating email to:', newEmail);
    setEmail(newEmail);
    setError('');
    setOtpError(null);
    
    // Send OTP to the new email
    try {
      console.log('📧 Sending OTP to new email:', newEmail);
      await sendEmailOTP({
        variables: { email: newEmail },
      });
      console.log('✅ OTP sent to new email');
      toast.success('OTP sent to new email');
    } catch (err: any) {
      console.error('❌ Error sending OTP to new email:', err);
      console.error('❌ Error message:', err?.message);
      const errorMessage = err?.message || 'Failed to send OTP. Please try again.';
      setOtpError(errorMessage);
      toast.error(errorMessage);
    }
  };

  if (!isOpen) return null;

  // Show OTP modal if OTP was sent
  if (showOTPModal) {
    return (
      <EmailOTPModal
        isOpen={true}
        email={email.trim()}
        isSending={isSendingOTP}
        isVerifying={isVerifyingOTP}
        error={otpError}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        onUpdateEmail={handleUpdateEmail}
        onClose={() => {
          setShowOTPModal(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div className={`${isInDesktopContainer ? 'absolute' : 'fixed'} inset-0 bg-black/50 flex items-center justify-center z-50 p-4`}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border-8 border-red-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-red-900">
            {currentEmail ? 'Update Email [NEW VERSION]' : 'Email Required [NEW VERSION]'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-6">
          {!currentEmail && (
            <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
              <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-blue-900">
                  Email address needed for online consultation
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  We'll send the Google Meet link to this email address
                </p>
              </div>
            </div>
          )}

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSendOTP();
              }
            }}
            className={`w-full p-3 border-2 rounded-xl focus:outline-none ${
              error ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'
            }`}
            placeholder="your.email@example.com"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <button
          onClick={() => {
            alert('Send OTP button clicked!');
            console.log('🔘 Send OTP button clicked');
            console.log('📧 Email value:', email);
            console.log('📧 isSendingOTP:', isSendingOTP);
            handleSendOTP();
          }}
          disabled={isSendingOTP}
          className="w-full py-3 rounded-xl font-semibold text-black transition-all disabled:opacity-50"
          style={{ backgroundColor: '#DDFE71' }}
        >
          {isSendingOTP ? 'Sending OTP...' : 'Send OTP'}
        </button>
      </div>
    </div>
  );
}
