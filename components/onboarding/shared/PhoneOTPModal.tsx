'use client';

import React, { useState, useEffect } from 'react';
import { X, Smartphone, Check } from 'lucide-react';
import EmailOTPInput from './EmailOTPInput';

interface PhoneOTPModalProps {
  isOpen: boolean;
  phone: string;
  isSending: boolean;
  isVerifying: boolean;
  error: string | null;
  onVerify: (code: string) => void;
  onResend: () => void;
  onUpdatePhone?: (newPhone: string) => void;
  onClose: () => void;
}

export default function PhoneOTPModal({
  isOpen,
  phone,
  isSending,
  isVerifying,
  error,
  onVerify,
  onResend,
  onUpdatePhone,
  onClose,
}: PhoneOTPModalProps) {
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [editedPhone, setEditedPhone] = useState(phone);
  const [phoneError, setPhoneError] = useState('');
  const [displayPhone, setDisplayPhone] = useState(phone);

  useEffect(() => {
    if (phone) setDisplayPhone(phone);
    setEditedPhone(phone);
  }, [phone]);

  useEffect(() => {
    if (isOpen && !phone) {
      setIsEditingPhone(true);
    } else if (isOpen && phone) {
      setIsEditingPhone(false);
      setDisplayPhone(phone);
    }
  }, [isOpen, phone]);

  if (!isOpen) return null;

  const handleSavePhone = () => {
    const digitsOnly = editedPhone.replace(/\D/g, '');
    if (digitsOnly.length !== 10) {
      setPhoneError('Please enter a 10-digit mobile number');
      return;
    }
    setPhoneError('');
    setIsEditingPhone(false);
    setDisplayPhone(digitsOnly);
    if (onUpdatePhone) {
      onUpdatePhone(digitsOnly);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSavePhone();
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
              <Smartphone className="w-7 h-7 text-gray-800" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-center text-lg font-bold text-gray-900 mb-1">
            Verify phone number
          </h2>

          {/* Display phone number */}
          {displayPhone && !isEditingPhone ? (
            <div className="text-center mb-5">
              <p className="text-sm text-gray-500 mb-1">We sent an OTP SMS to</p>
              <p className="text-sm font-semibold text-gray-900">+91 {displayPhone}</p>
              {isSending && !error && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-xs text-gray-400">Sending OTP...</span>
                </div>
              )}
            </div>
          ) : !isEditingPhone ? (
            <p className="text-center text-sm text-gray-500 mb-5">Enter your phone number to receive an OTP</p>
          ) : null}

          {/* Phone edit */}
          {isEditingPhone ? (
            <div className="mb-5 space-y-3">
              <div className="relative">
                <input
                  type="tel"
                  maxLength={10}
                  value={editedPhone}
                  onChange={(e) => {
                    setEditedPhone(e.target.value.replace(/\D/g, ''));
                    setPhoneError('');
                  }}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className={`w-full p-3 pr-12 border-2 rounded-xl outline-none text-sm transition-colors ${
                    phoneError ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-blue-500'
                  }`}
                  placeholder="10-digit mobile number"
                />
                {editedPhone.length === 10 && (
                  <button
                    onClick={handleSavePhone}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                    style={{ backgroundColor: '#DDFE71' }}
                  >
                    <Check className="w-4 h-4 text-gray-800" />
                  </button>
                )}
              </div>
              {phoneError && <p className="text-red-500 text-xs">{phoneError}</p>}
              <button
                onClick={handleSavePhone}
                disabled={editedPhone.length !== 10 || isSending}
                className="w-full py-3 rounded-xl font-semibold text-sm text-black transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
                style={{ backgroundColor: editedPhone.length !== 10 || isSending ? '#D1D5DB' : '#DDFE71' }}
              >
                {isSending ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <>
              {/* Change number link */}
              {displayPhone && onUpdatePhone && (
                <button
                  onClick={() => { setIsEditingPhone(true); setEditedPhone(displayPhone); setPhoneError(''); }}
                  className="w-full mb-5 text-xs text-gray-400 hover:text-gray-600 transition-colors text-center"
                >
                  Wrong number? <span className="text-blue-600 font-medium">Click here to change</span>
                </button>
              )}

              {/* OTP Input component */}
              {!isEditingPhone && phone && (
                <EmailOTPInput
                  isSending={isSending}
                  isVerifying={isVerifying}
                  error={error}
                  onVerify={onVerify}
                  onResend={onResend}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
