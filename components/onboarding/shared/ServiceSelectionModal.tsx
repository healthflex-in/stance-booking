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
  centerId?: string;
  organizationId?: string;
  isNewUser: boolean;
  sessionType: 'in-person' | 'online';
  isPrePaid?: boolean;
  designation?: string;
  onSelect: (service: { id: string; _id: string; name: string; duration: number; price: number; bookingAmount: number }) => void;
}

export default function ServiceSelectionModal({
  isOpen,
  onClose,
  patientId,
  centerId,
  organizationId,
  isNewUser,
  sessionType,
  isPrePaid = false,
  designation,
  onSelect,
}: ServiceSelectionModalProps) {
  const [services, setServices] = useState<any[]>([]);
  const { isInDesktopContainer } = useContainerDetection();

  const isValidCenterId = !!(centerId && typeof centerId === 'string' && centerId.trim() !== '');
  const isOrganizationLevel = !!organizationId && !isValidCenterId;
  
  const { data: servicesData, loading: servicesLoading, error: servicesError, refetch } = useQuery(GET_SERVICES, {
    variables: isValidCenterId ? { centerId: [centerId] } : { centerId: null },
    skip: !isValidCenterId && !isOrganizationLevel,
    fetchPolicy: 'network-only',
  });

  useEffect(() => {
    if (isOpen && (isValidCenterId || isOrganizationLevel)) {
      refetch();
    }
  }, [isOpen, isValidCenterId, isOrganizationLevel, refetch]);

  useEffect(() => {
    if (servicesError) {
      setServices([]);
      return;
    }

    if (!servicesData?.services) {
      setServices([]);
      return;
    }

    if (!centerId && !organizationId) {
      setServices([]);
      return;
    }

    const filteredServices = servicesData.services.filter((service: any) => {
      // Must have online booking enabled
      if (!service.allowOnlineBooking) {
        return false;
      }
      
      // For prepaid services
      if (isPrePaid) {
        if (!service.isPrePaid) {
          return false;
        }
        if (!service.allowOnlineDelivery) {
          return false;
        }
        // Filter by new user vs repeat user
        if (isNewUser && !service.isNewUserService) {
          return false;
        }
        if (!isNewUser && service.isNewUserService) {
          return false;
        }
      } else {
        // For non-prepaid services
        if (service.isPrePaid) {
          return false;
        }
        // Filter by new user vs repeat user
        if (isNewUser && !service.isNewUserService) {
          return false;
        }
        if (!isNewUser && service.isNewUserService) {
          return false;
        }
        // Session type filtering for non-prepaid
        if (sessionType === 'online') {
          if (!service.allowOnlineDelivery) {
            return false;
          }
        } else {
          if (service.allowOnlineDelivery) {
            return false;
          }
        }
      }

      return true;
    });

    let mappedServices = filteredServices.map((service: any) => ({
      id: service._id,
      _id: service._id,
      name: service.name,
      duration: service.duration,
      price: service.price,
      bookingAmount: service.bookingAmount || service.price,
      description: service.description || 'Professional service',
      doneBy: service.doneBy || [],
    }));

    // Filter by designation using doneBy field
    if (designation) {
      // Map frontend designation values to backend enum values
      const designationMap: Record<string, string> = {
        'Physiotherapist': 'Physiotherapist',
        'S&C Coach': 'SNC_Coach',
        'SNC_Coach': 'SNC_Coach',
        'Orthopaedic Doctor': 'Orthopaedic_Doctor',
        'Orthopaedic_Doctor': 'Orthopaedic_Doctor',
        'Sports Massage Therapist': 'Sports_Massage_Therapist',
        'Sports_Massage_Therapist': 'Sports_Massage_Therapist',
      };
      
      const mappedDesignation = designationMap[designation] || designation;
      
      mappedServices = mappedServices.filter((service: any) => {
        // If service has no doneBy array or it's empty, show it for all designations
        if (!service.doneBy || service.doneBy.length === 0) {
          return true;
        }
        // Check if the mapped designation is in the doneBy array
        return service.doneBy.includes(mappedDesignation);
      });
    }

    setServices(mappedServices);
  }, [servicesData, isNewUser, sessionType, isPrePaid, centerId, organizationId, designation]);

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

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {servicesLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : services.length > 0 ? (
            <div className="space-y-2">
              {services.map((service: any) => (
                <button
                  key={service.id}
                  onClick={() => onSelect(service)}
                  className="w-full bg-white rounded-xl border-2 border-gray-200 p-3 text-left hover:border-gray-300 transition-all"
                  type="button"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Flame className="w-5 h-5 text-gray-600" />
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
