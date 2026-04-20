'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, Pencil, Check } from 'lucide-react';
import EmailOTPInput from './EmailOTPInput';

interface EmailOTPModalProps {
  isOpen: boolean;
  email: string;
  isSending: boolean;
  isVerifying: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onUpdateEmail: (newEmail: string) => void;
  onClose: () => void;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailOTPModal({
  isOpen,
  email,
  isSending,
  isVerifying,
  error,
  onVerify,
  onResend,
  onUpdateEmail,
  onClose,
}: EmailOTPModalProps) {
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editedEmail, setEditedEmail] = useState(email);
  const [emailError, setEmailError] = useState('');

  // Sync editedEmail when email prop changes (after update)
  useEffect(() => {
    setEditedEmail(email);
  }, [email]);

  // If modal opens with empty email, go straight to edit mode
  useEffect(() => {
    if (isOpen && !email) {
      setIsEditingEmail(true);
    }
  }, [isOpen, email]);

  if (!isOpen) return null;

  const handleSaveEmail = () => {
    const trimmed = editedEmail.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setEmailError('');
    setIsEditingEmail(false);
    onUpdateEmail(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEmail();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[360px] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        <div className="px-6 pt-8 pb-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: '#DDFE71' }}>
              <Mail className="w-7 h-7 text-gray-800" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-lg font-bold text-gray-900 mb-1">
            Verify your email
          </h2>
          <p className="text-center text-sm text-gray-500 mb-5">
            {isSending && !error
              ? 'Sending verification code...'
              : email
                ? 'Enter the 6-digit code sent to'
                : 'Enter your email to receive a code'
            }
          </p>

          {/* Email display / edit */}
          {isEditingEmail ? (
            <div className="mb-5 space-y-3">
              <div className="relative">
                <input
                  type="email"
                  value={editedEmail}
                  onChange={(e) => { setEditedEmail(e.target.value); setEmailError(''); }}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className={`w-full p-3 pr-12 border-2 rounded-xl outline-none text-sm transition-colors ${
                    emailError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="your.email@example.com"
                />
                {editedEmail && EMAIL_REGEX.test(editedEmail.trim()) && (
                  <button
                    onClick={handleSaveEmail}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                    style={{ backgroundColor: '#DDFE71' }}
                  >
                    <Check className="w-4 h-4 text-gray-800" />
                  </button>
                )}
              </div>
              {emailError && <p className="text-red-500 text-xs">{emailError}</p>}
              <button
                onClick={handleSaveEmail}
                disabled={!editedEmail.trim()}
                className="w-full py-3 rounded-xl font-semibold text-sm text-black transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{ backgroundColor: !editedEmail.trim() ? '#D1D5DB' : '#DDFE71' }}
              >
                Send OTP
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-5 px-3 py-2 bg-gray-50 rounded-xl">
              <span className="text-sm font-medium text-gray-800 truncate">{email}</span>
              <button
                onClick={() => { setIsEditingEmail(true); setEditedEmail(email); setEmailError(''); }}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
          )}

          {/* OTP input — only show when not editing email and email exists */}
          {!isEditingEmail && email && (
            <EmailOTPInput
              isSending={isSending}
              isVerifying={isVerifying}
              error={error}
              onVerify={onVerify}
              onResend={onResend}
            />
          )}

          {/* Loading state while sending first OTP */}
          {!isEditingEmail && email && isSending && !error && (
            <div className="flex items-center justify-center gap-2 mt-3">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Sending OTP...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
