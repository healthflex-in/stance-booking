'use client';

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { X, Mail } from 'lucide-react';
import { UPDATE_PATIENT } from '@/gql/queries';
import { toast } from 'sonner';
import { useContainerDetection } from '@/hooks/useContainerDetection';

interface EmailCollectionModalProps {
  isOpen: boolean;
  patientId: string;
  patientName: string;
  onEmailSaved: (email: string) => void;
  onClose: () => void;
}

export default function EmailCollectionModal({
  isOpen,
  patientId,
  patientName,
  onEmailSaved,
  onClose,
}: EmailCollectionModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const { isInDesktopContainer } = useContainerDetection();

  const [updatePatient, { loading }] = useMutation(UPDATE_PATIENT);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSave = async () => {
    if (!email.trim()) {
      setError('Email is required for online consultations');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      await updatePatient({
        variables: {
          patientId: patientId,
          input: {
            email: email.trim(),
          },
        },
      });

      toast.success('Email saved successfully');
      onEmailSaved(email.trim());
    } catch (err) {
      console.error('Error saving email:', err);
      toast.error('Failed to save email. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`${isInDesktopContainer ? 'absolute' : 'fixed'} inset-0 bg-black/50 flex items-center justify-center z-50 p-4`}>
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Email Required</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="mb-6">
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
            className={`w-full p-3 border-2 rounded-xl focus:outline-none ${
              error ? 'border-red-300' : 'border-gray-200 focus:border-blue-500'
            }`}
            placeholder="your.email@example.com"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-black transition-all disabled:opacity-50"
          style={{ backgroundColor: '#DDFE71' }}
        >
          {loading ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  );
}
