'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { Mail } from 'lucide-react';
import { GET_SERVICES, GET_USER, UPDATE_PATIENT } from '@/gql/queries';

interface NewUserOnlineServiceSelectionProps {
  centerId: string;
  patientId: string;
  onServiceSelect: (serviceId: string, serviceDuration: number, servicePrice: number) => void;
}

export default function NewUserOnlineServiceSelection({
  centerId,
  patientId,
  onServiceSelect,
}: NewUserOnlineServiceSelectionProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [email, setEmail] = useState('');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [emailError, setEmailError] = useState('');

  const { data: servicesData, loading } = useQuery(GET_SERVICES, {
    variables: { centerId: [centerId] },
    fetchPolicy: 'network-only',
  });

  const { data: userData } = useQuery(GET_USER, {
    variables: { userId: patientId },
    skip: !patientId,
  });

  const [updatePatient, { loading: updating }] = useMutation(UPDATE_PATIENT);

  const newUserOnlineServices = servicesData?.services?.filter(
    (service: any) =>
      service.allowOnlineBooking &&
      service.allowOnlineDelivery &&
      service.isNewUserService &&
      !service.isPrePaid
  ) || [];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleServiceClick = (service: any) => {
    if (service.allowOnlineDelivery && !userData?.user?.email) {
      setSelectedService(service);
      setShowEmailModal(true);
    } else {
      onServiceSelect(service._id, service.duration, service.price);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email');
      return;
    }

    try {
      await updatePatient({
        variables: {
          patientId,
          input: { email },
        },
      });
      setShowEmailModal(false);
      if (selectedService) {
        onServiceSelect(selectedService._id, selectedService.duration, selectedService.price);
      }
    } catch (error: any) {
      const errorMessage = error?.message || '';
      const isDuplicateError = errorMessage.includes('duplicate') || errorMessage.includes('E11000');
      
      if (isDuplicateError) {
        setEmailError('This email is already registered. Please use a different email.');
      } else {
        setEmailError('Failed to update email. Please try again.');
      }
    }
  };

  if (newUserOnlineServices.length === 0) {
    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="max-w-md mx-auto text-center">
          <p className="text-gray-600 mb-4">
            No services available at this time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-md mx-auto space-y-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Select Service</h2>
        {newUserOnlineServices.map((service: any, index: number) => (
          <button
            key={service._id}
            onClick={() => handleServiceClick(service)}
            className={`w-full py-6 text-black font-semibold rounded-xl transition-all text-left px-6 ${
              index === 0
                ? 'bg-[#DDFE71]'
                : 'border-2 border-[#DDFE71] bg-transparent hover:bg-[#DDFE71]/10'
            }`}
          >
            <div className="text-xl font-bold mb-1">{service.name}</div>
            <div className="text-sm text-gray-700 mb-2">{service.duration} minutes</div>
            {service.description && (
              <div className="text-xs text-gray-600">{service.description}</div>
            )}
            <div className="text-sm font-semibold mt-2">₹{service.price}</div>
          </button>
        ))}
      </div>

      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Email Required</h2>
              <p className="text-gray-600 mb-6">Please provide your email to receive the Google Meet link.</p>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#DDFE71] focus:border-[#DDFE71] mb-2 text-left"
              />
              {emailError && (
                <p className="text-red-600 text-sm mb-4">{emailError}</p>
              )}
              <div className="space-y-3">
                <button
                  onClick={handleEmailSubmit}
                  disabled={updating}
                  className="w-full py-3 text-black font-semibold rounded-xl transition-all disabled:opacity-50"
                  style={{ backgroundColor: '#DDFE71' }}
                >
                  {updating ? 'Saving...' : 'Continue'}
                </button>
                <button
                  onClick={() => {
                    setShowEmailModal(false);
                    setEmail('');
                    setEmailError('');
                  }}
                  className="w-full py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-gray-400 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
