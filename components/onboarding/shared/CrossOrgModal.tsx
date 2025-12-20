'use client';

import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface PatientData {
  _id: string;
  phone: string;
  email?: string;
  profileData: {
    firstName: string;
    lastName?: string;
    gender?: string;
    dob?: number;
  };
}

interface CrossOrgModalProps {
  isOpen: boolean;
  patient: PatientData | null;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function CrossOrgModal({
  isOpen,
  patient,
  onConfirm,
  onCancel,
  loading = false,
}: CrossOrgModalProps) {
  if (!isOpen || !patient) return null;

  const { profileData } = patient;
  const fullName = `${profileData.firstName} ${profileData.lastName || ''}`.trim();
  
  const age = profileData.dob 
    ? Math.floor((Date.now() - profileData.dob * 1000) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  // Check if we're on desktop to show mobile container
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Mobile container wrapper for desktop view */}
      {isDesktop ? (
        <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" style={{ height: '90vh', maxHeight: '800px' }}>
          <div className="h-full overflow-y-auto bg-gray-50">
            <div className="min-h-full flex flex-col justify-center p-6">
              {/* Icon */}
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-yellow-600" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
                Existing Patient Found
              </h2>

              {/* Warning message */}
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-yellow-800 text-center font-medium">
                  This phone number is registered with another organization.
                </p>
              </div>

              {/* Patient details card */}
              <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Name</span>
                    <span className="text-sm font-semibold text-gray-900">{fullName}</span>
                  </div>
                  
                  <div className="border-t border-gray-100"></div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Phone</span>
                    <span className="text-sm font-semibold text-gray-900">{patient.phone}</span>
                  </div>
                  
                  {patient.email && (
                    <>
                      <div className="border-t border-gray-100"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Email</span>
                        <span className="text-sm font-semibold text-gray-900 truncate ml-2">{patient.email}</span>
                      </div>
                    </>
                  )}
                  
                  {profileData.gender && (
                    <>
                      <div className="border-t border-gray-100"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Gender</span>
                        <span className="text-sm font-semibold text-gray-900 capitalize">
                          {profileData.gender.toLowerCase()}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {age && (
                    <>
                      <div className="border-t border-gray-100"></div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Age</span>
                        <span className="text-sm font-semibold text-gray-900">{age} years</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Confirmation message */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
                <p className="text-sm text-blue-800 text-center font-medium">
                  Would you like to book an appointment with this organization?
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  disabled={loading}
                  className="flex-1 py-4 px-4 rounded-2xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-4 px-4 rounded-2xl font-semibold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: loading ? '#D1D5DB' : '#DDFE71' }}
                >
                  {loading ? 'Adding...' : 'Yes, Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Mobile view - full screen
        <div className="bg-gray-50 w-full h-full overflow-y-auto">
          <div className="min-h-full flex flex-col justify-center p-6">
            {/* Icon */}
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Existing Patient Found
            </h2>

            {/* Warning message */}
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800 text-center font-medium">
                This phone number is registered with another organization.
              </p>
            </div>

            {/* Patient details card */}
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Name</span>
                  <span className="text-sm font-semibold text-gray-900">{fullName}</span>
                </div>
                
                <div className="border-t border-gray-100"></div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Phone</span>
                  <span className="text-sm font-semibold text-gray-900">{patient.phone}</span>
                </div>
                
                {patient.email && (
                  <>
                    <div className="border-t border-gray-100"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Email</span>
                      <span className="text-sm font-semibold text-gray-900 truncate ml-2">{patient.email}</span>
                    </div>
                  </>
                )}
                
                {profileData.gender && (
                  <>
                    <div className="border-t border-gray-100"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Gender</span>
                      <span className="text-sm font-semibold text-gray-900 capitalize">
                        {profileData.gender.toLowerCase()}
                      </span>
                    </div>
                  </>
                )}
                
                {age && (
                  <>
                    <div className="border-t border-gray-100"></div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Age</span>
                      <span className="text-sm font-semibold text-gray-900">{age} years</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Confirmation message */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 text-center font-medium">
                Would you like to book an appointment with this organization?
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                disabled={loading}
                className="flex-1 py-4 px-4 rounded-2xl font-semibold text-gray-700 bg-white border-2 border-gray-200 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-4 px-4 rounded-2xl font-semibold text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: loading ? '#D1D5DB' : '#DDFE71' }}
              >
                {loading ? 'Adding...' : 'Yes, Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

