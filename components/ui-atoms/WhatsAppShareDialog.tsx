'use client';
import React, { useState, useEffect } from 'react';
import { MessageCircle, X, Send, Phone } from 'lucide-react';
import { useHealthFlexAnalytics } from '@/services/analytics';
import { useAuth } from '@/contexts';

interface WhatsAppShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  phoneNumber?: string;
  title?: string;
}

export default function WhatsAppShareDialog({
  isOpen,
  onClose,
  message,
  phoneNumber = '',
  title = 'Send via WhatsApp',
}: WhatsAppShareDialogProps) {
  const analytics = useHealthFlexAnalytics();
  const { user } = useAuth();
  const [step, setStep] = useState<'confirm' | 'phone'>('confirm');
  const [enteredPhone, setEnteredPhone] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setEnteredPhone('');
      setIsSending(false);
    }
  }, [isOpen, message, phoneNumber]);

  if (!isOpen) return null;

  const formatPhoneNumber = (phone: string): string => {
    let cleanNumber = phone.replace(/[^\d]/g, '');

    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }

    if (!cleanNumber.startsWith('91') && cleanNumber.length === 10) {
      cleanNumber = '91' + cleanNumber;
    }

    return cleanNumber;
  };

  const handleYes = () => {
    if (phoneNumber) {
      openWhatsApp(phoneNumber);
    } else {
      setStep('phone');
    }
  };

  const handleSendWithPhone = () => {
    if (!enteredPhone.trim()) {
      alert('Please enter a phone number');
      return;
    }

    const cleanNumber = enteredPhone.replace(/[^\d]/g, '');
    if (cleanNumber.length < 10) {
      alert('Please enter a valid phone number with at least 10 digits');
      return;
    }

    openWhatsApp(enteredPhone);
  };

  const openWhatsApp = async (phone: string) => {
    setIsSending(true);

    if (!message) {
      setIsSending(false);
      return;
    }

    if (typeof message !== 'string') {
      setIsSending(false);
      return;
    }

    if (message.trim().length === 0) {
      setIsSending(false);
      return;
    }

    try {
      const formattedPhone = formatPhoneNumber(phone);

      const cleanMessage = message
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[\u{1F700}-\u{1F77F}]/gu, '')
        .replace(/[\u{1F780}-\u{1F7FF}]/gu, '')
        .replace(/[\u{1F800}-\u{1F8FF}]/gu, '')
        .replace(/[\u{2600}-\u{26FF}]/gu, '')
        .replace(/[\u{2700}-\u{27BF}]/gu, '')
        .replace(/\uFE0F/g, '')
        .replace(/\u200D/g, '')
        .trim();

      // Use simple encodeURIComponent
      const encodedMessage = encodeURIComponent(cleanMessage);

      // Try the direct WhatsApp Web URL format
      const whatsappURL = `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`;

      // Open WhatsApp Web directly
      window.open(whatsappURL, '_blank', 'noopener,noreferrer');

      // Track WhatsApp share
      analytics.trackWhatsAppShare('appointment', 'unknown', formattedPhone, user?._id || 'unknown');

      // Close dialog immediately
      onClose();
    } catch (error) {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setEnteredPhone('');
    setIsSending(false);
    onClose();
  };

  // FIXED: Add message validation in the UI
  const isMessageValid = message && message.trim().length > 0;

  // Step 1: Simple Yes/No confirmation
  if (step === 'confirm') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FIXED: Show message validation status */}
          {!isMessageValid && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                ⚠️ No message available. Please try again.
              </p>
            </div>
          )}

          <p className="text-gray-600 mb-6 text-center">
            Redirect to WhatsApp to send the details?
          </p>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleYes}
              disabled={!isMessageValid}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Open WhatsApp
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Phone number input (only if no phone provided)
  if (step === 'phone') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-sm mx-4 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Enter Phone Number
            </h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* FIXED: Show message validation in phone step too */}
          {!isMessageValid && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                No message available to send.
              </p>
            </div>
          )}

          <div className="mb-4">
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={enteredPhone}
                onChange={(e) => setEnteredPhone(e.target.value)}
                placeholder="9876543210"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                autoFocus
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter 10-digit mobile number (country code will be added
              automatically)
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep('confirm')}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSendWithPhone}
              disabled={!enteredPhone.trim() || isSending || !isMessageValid}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Redirecting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Open WhatsApp
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
