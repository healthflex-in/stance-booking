'use client';

import React, { useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { MapPin, Navigation, X } from 'lucide-react';
import { useContainerDetection } from '@/hooks/useContainerDetection';
import { GET_CENTERS } from '@/gql/queries';

// Known Stance Health center map links. Match by lower-cased substring in
// center name (and as a fallback, address.street) so renames of the form
// "Stance Health - HSR" continue to resolve.
const CENTER_MAP_LINKS: Array<{ keyword: string; url: string }> = [
  { keyword: 'hsr', url: 'https://maps.app.goo.gl/onY5cxQ6HYQrFn7o6' },
  { keyword: 'indiranagar', url: 'https://maps.app.goo.gl/JVfhQB6funscA9Hd6' },
  { keyword: 'whitefield', url: 'https://maps.app.goo.gl/FGpYsK2NZ5a7ywJ29' },
];

function resolveMapUrl(center: any): string {
  const haystack = [
    center?.name,
    center?.address?.street,
    center?.address?.city,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const known = CENTER_MAP_LINKS.find((m) => haystack.includes(m.keyword));
  if (known) return known.url;
  // Fallback: open a Google Maps search of the address
  const parts = [
    center?.name,
    center?.address?.street,
    center?.address?.city,
    center?.address?.state,
    center?.address?.zipCode,
  ].filter(Boolean);
  const query = encodeURIComponent(parts.join(', '));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

interface LocationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  centers: any[];
  sessionType?: 'in-person' | 'online';
  onSelect: (center: any) => void;
}

export default function LocationSelectionModal({
  isOpen,
  onClose,
  centers,
  sessionType,
  onSelect,
}: LocationSelectionModalProps) {
  const { isInDesktopContainer } = useContainerDetection();

  const { data: centersData, loading: centersLoading } = useQuery(GET_CENTERS, {
    skip: !isOpen || centers.length > 0,
    fetchPolicy: 'cache-first',
  });

  const displayCenters = centers.length > 0 ? centers : (centersData?.centers || []);

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
            Select preferred location
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
          {centersLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : displayCenters.length > 0 ? (
            <div className="space-y-2 max-w-sm mx-auto">
              {displayCenters.map((center: any) => {
                const mapUrl = resolveMapUrl(center);
                return (
                  <button
                    key={center._id}
                    onClick={() => onSelect(center)}
                    className="w-full p-3 border-2 border-gray-200 hover:border-gray-300 rounded-xl transition-all text-left"
                    type="button"
                  >
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">
                          {center.name}
                        </div>
                        <div className="text-xs text-gray-600 mt-0.5">
                          {[center.address?.street, center.address?.city, center.address?.state]
                            .filter(Boolean)
                            .join(', ') || 'Address not available'}
                        </div>
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 mt-1.5 font-medium"
                          aria-label={`Open ${center.name} on Google Maps`}
                        >
                          <Navigation className="w-3 h-3" />
                          View on Maps
                        </a>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              No locations available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

