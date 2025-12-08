'use client';

import React, { useState } from 'react';
import { Search, Phone, User, Calendar, AlertCircle } from 'lucide-react';
import { useLazyQuery } from '@apollo/client';
import { PATIENT_BY_PHONE, PATIENT_APPOINTMENT_COUNT } from '@/gql/queries';

interface PhoneSearchWidgetProps {
  onPatientFound?: (patient: any) => void;
}

export default function PhoneSearchWidget({ onPatientFound }: PhoneSearchWidgetProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [searchPatient] = useLazyQuery(PATIENT_BY_PHONE, {
    fetchPolicy: 'network-only',
  });

  const [getAppointmentCount] = useLazyQuery(PATIENT_APPOINTMENT_COUNT, {
    fetchPolicy: 'network-only',
  });

  const handleSearch = async () => {
    if (!phoneNumber || phoneNumber.length !== 10) {
      return;
    }

    setIsSearching(true);
    try {
      const { data } = await searchPatient({
        variables: { phone: phoneNumber }
      });

      if (data?.patientByPhone) {
        const patient = data.patientByPhone;
        
        // Get appointment count
        try {
          const { data: countData } = await getAppointmentCount({
            variables: { patientId: patient._id }
          });
          
          setSearchResult({
            ...patient,
            appointmentCount: countData?.patientAppointmentCount || 0
          });
        } catch (error) {
          console.error('Error getting appointment count:', error);
          setSearchResult({
            ...patient,
            appointmentCount: 0
          });
        }
        
        onPatientFound?.(patient);
      } else {
        setSearchResult({ notFound: true });
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setSearchResult({ error: true });
    } finally {
      setIsSearching(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digitsOnly = e.target.value.replace(/\D/g, '');
    setPhoneNumber(digitsOnly);
    if (searchResult) {
      setSearchResult(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'LEAD':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'ACTIVE':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'PACKAGE':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'LEAD':
        return 'No appointments booked yet';
      case 'ACTIVE':
        return 'Has active appointments';
      case 'PACKAGE':
        return 'Package customer';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center space-x-2 mb-4">
        <Phone className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Search Patient by Phone</h3>
      </div>

      <div className="flex space-x-2 mb-4">
        <div className="flex-1">
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="Enter 10-digit phone number"
            maxLength={10}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={phoneNumber.length !== 10 || isSearching}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <Search className="w-4 h-4" />
          <span>{isSearching ? 'Searching...' : 'Search'}</span>
        </button>
      </div>

      {searchResult && (
        <div className="mt-4">
          {searchResult.notFound ? (
            <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
              <AlertCircle className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">No patient found with this phone number</span>
            </div>
          ) : searchResult.error ? (
            <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">Error searching for patient</span>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {searchResult.profileData?.firstName} {searchResult.profileData?.lastName}
                    </h4>
                    <p className="text-sm text-gray-600">{searchResult.phone}</p>
                    <p className="text-xs text-gray-500">ID: {searchResult.seqNo}</p>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(searchResult.profileData?.status)}`}>
                  {searchResult.profileData?.status}
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{getStatusDescription(searchResult.profileData?.status)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Appointments:</span>
                  <span className="font-medium">
                    {searchResult.appointmentCount !== undefined ? searchResult.appointmentCount : 'Loading...'}
                  </span>
                </div>
                {searchResult.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{searchResult.email}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Gender:</span>
                  <span className="font-medium">{searchResult.profileData?.gender}</span>
                </div>
                {searchResult.profileData?.category && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{searchResult.profileData?.category}</span>
                  </div>
                )}
              </div>

              {searchResult.profileData?.status === 'LEAD' && (
                <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      This patient hasn't booked any appointments yet
                    </span>
                  </div>
                  <p className="text-xs text-orange-700 mt-1">
                    Consider reaching out to help them book their first session
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}