'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { Flame, X } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { GET_SERVICES } from '@/gql/queries';

interface ServiceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  centerId: string;
  isNewUser: boolean;
  sessionType: 'in-person' | 'online';
  onSelect: (service: { id: string; _id: string; name: string; duration: number; price: number; bookingAmount: number }) => void;
}

export default function ServiceSelectionModal({
  isOpen,
  onClose,
  patientId,
  centerId,
  isNewUser,
  sessionType,
  onSelect,
}: ServiceSelectionModalProps) {
  const [services, setServices] = useState<any[]>([]);
  const { isInDesktopContainer } = useContainerDetection();

  // Fetch all services from backend
  // Query when we have a valid centerId (like other components do)
  const isValidCenterId = centerId && typeof centerId === 'string' && centerId.trim() !== '';
  
  const { data: servicesData, loading: servicesLoading, error: servicesError, refetch } = useQuery(GET_SERVICES, {
    variables: isValidCenterId ? { centerId: [centerId] } : {},
    skip: !isValidCenterId,
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      console.log('=== GET_SERVICES QUERY COMPLETED ===');
      console.log('Response data:', data);
      console.log('Services array:', data?.services);
      console.log('Services count:', data?.services?.length || 0);
      if (data?.services) {
        console.log('Sample service:', data.services[0]);
      }
    },
    onError: (error) => {
      console.error('=== GET_SERVICES QUERY ERROR ===');
      console.error('Error:', error);
    },
  });

  // Refetch when modal opens to ensure fresh data
  useEffect(() => {
    if (isOpen && isValidCenterId) {
      console.log('Modal opened, refetching services...');
      refetch();
    }
  }, [isOpen, isValidCenterId, refetch]);

  useEffect(() => {
    console.log('=== SERVICE FILTERING DEBUG ===');
    console.log('Query execution state:', {
      isValidCenterId,
      isOpen,
      centerId,
      skip: !isValidCenterId,
    });
    console.log('Service query state:', {
      hasData: !!servicesData,
      servicesCount: servicesData?.services?.length || 0,
      centerId,
      isNewUser,
      sessionType,
      loading: servicesLoading,
      error: servicesError,
      rawData: servicesData,
    });

    if (servicesError) {
      console.error('=== SERVICE QUERY ERROR ===');
      console.error('Error details:', servicesError);
      console.error('Error message:', servicesError.message);
      console.error('GraphQL errors:', servicesError.graphQLErrors);
      console.error('Network error:', servicesError.networkError);
      console.error('centerId used:', centerId);
      console.error('isValidCenterId:', isValidCenterId);
      setServices([]);
      return;
    }

    if (!servicesData?.services) {
      console.log('No services data available');
      setServices([]);
      return;
    }

    if (!centerId) {
      console.error('No centerId provided!');
      setServices([]);
      return;
    }

    console.log('All services:', servicesData.services);
    console.log('Filtering with:', { isNewUser, sessionType, centerId });

    // Filter services based on exact requirements from user
    // Flow 2: New User : Online - allowOnlineBooking: true, allowOnlineDelivery: true, isNewUserService: true, isPrePaid: false
    // Flow 4: Repeat user - Online - allowOnlineBooking: true, allowOnlineDelivery: true, isNewUserService: false, isPrePaid: false
    // Flow 3: New User : In center - allowOnlineBooking: true, allowOnlineDelivery: false, isNewUserService: true, isPrePaid: false
    // Flow 5: Repeat user - In Center - allowOnlineBooking: true, allowOnlineDelivery: false, isNewUserService: false, isPrePaid: false
    const filteredServices = servicesData.services.filter((service: any) => {
      console.log('Checking service:', {
        name: service.name,
        allowOnlineBooking: service.allowOnlineBooking,
        allowOnlineDelivery: service.allowOnlineDelivery,
        isNewUserService: service.isNewUserService,
        isPrePaid: service.isPrePaid,
      });

      // Step 1: Must have allowOnlineBooking = true (REQUIRED for all flows)
      // Use truthy check like old code
      if (!service.allowOnlineBooking) {
        console.log(`  ❌ Rejected: allowOnlineBooking is falsy (${service.allowOnlineBooking})`);
        return false;
      }
      
      // Step 2: Must be non-prepaid for this flow (isPrePaid = false)
      // Note: Prepaid services go through a different flow
      if (service.isPrePaid) {
        console.log(`  ❌ Rejected: isPrePaid is truthy (${service.isPrePaid})`);
        return false;
      }
      
      // Step 3: Filter by new/returning user
      // New users: isNewUserService must be true
      // Returning users: isNewUserService must be false
      if (isNewUser && !service.isNewUserService) {
        console.log(`  ❌ Rejected: isNewUser is true but isNewUserService is falsy (${service.isNewUserService})`);
        return false;
      }
      if (!isNewUser && service.isNewUserService) {
        console.log(`  ❌ Rejected: isNewUser is false but isNewUserService is truthy (${service.isNewUserService})`);
        return false;
      }
      
      // Step 4: Filter by session type - allowOnlineDelivery is boolean
      // Online: allowOnlineDelivery must be truthy (true)
      // In-center: allowOnlineDelivery must be falsy (false)
      if (sessionType === 'online') {
        if (!service.allowOnlineDelivery) {
          console.log(`  ❌ Rejected: sessionType is online but allowOnlineDelivery is falsy (${service.allowOnlineDelivery})`);
          return false;
        }
      } else {
        // In-person: allowOnlineDelivery must be falsy
        if (service.allowOnlineDelivery) {
          console.log(`  ❌ Rejected: sessionType is in-person but allowOnlineDelivery is truthy (${service.allowOnlineDelivery})`);
          return false;
        }
      }

      console.log(`  ✅ Accepted: ${service.name}`);
      return true;
    });

    console.log('Filtered services:', filteredServices);
    console.log(`Total services: ${servicesData.services.length}, Filtered: ${filteredServices.length}`);

    // Map services to the format expected by UI
    const mappedServices = filteredServices.map((service: any) => ({
      id: service._id,
      _id: service._id,
      name: service.name,
      duration: service.duration,
      price: service.price,
      bookingAmount: service.bookingAmount || service.price, // Use bookingAmount if available, fallback to price
      description: service.description || 'Professional service',
    }));

    setServices(mappedServices);
  }, [servicesData, isNewUser, sessionType]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className={`${isInDesktopContainer ? 'absolute' : 'fixed'} inset-0 bg-black bg-opacity-50 z-[100] flex items-end animate-fade-in`}
      onClick={onClose}
      style={{ touchAction: 'none' }}
    >
      <div
        className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[65vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            Select required service
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {servicesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : services.length > 0 ? (
            <div className="space-y-2">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onSelect(service)}
                  className="w-full bg-white rounded-xl border border-gray-200 p-3 text-left hover:bg-gray-50 hover:border-gray-300 transition-all"
                  type="button"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Flame className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 mb-0.5">
                        {service.name}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">
                        {service.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-1">No services available</p>
              <p className="text-xs text-gray-400">
                {sessionType === 'online' ? 'online' : 'in-person'} sessions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
