import { useState, useEffect, useMemo, useRef } from 'react';
import { useApolloClient, gql } from '@apollo/client';

const GET_ORGANIZATION_AVAILABILITY = gql`
  query GetOrganizationAvailability($input: OrganizationAvailabilityInput!) {
    getOrganizationAvailability(input: $input) {
      consultantId
      consultantName
      consultantDesignation
      availableSlots {
        startTime
        endTime
        centerId
        centerName
      }
    }
  }
`;

const GET_REPEAT_USER_SLOTS = gql`
  query GetRepeatUserSlots($input: RepeatUserSlotsInput!) {
    getRepeatUserSlots(input: $input) {
      consultantId
      consultantName
      consultantDesignation
      availableSlots {
        startTime
        endTime
        centerId
        centerName
      }
    }
  }
`;

interface AvailabilitySlot {
  startTime: number;
  endTime: number;
  centerId: string;
  centerName: string;
}

interface ConsultantAvailability {
  consultantId: string;
  consultantName: string;
  availableSlots: AvailabilitySlot[];
}

interface UseAvailabilityParams {
  organizationId: string;
  centerId?: string;
  startDate: Date;
  endDate: Date;
  serviceDuration: number;
  designation?: string;
  deliveryMode?: 'ONLINE' | 'OFFLINE';
  enabled?: boolean;
  isRepeatUser?: boolean;
}

interface UseAvailabilityReturn {
  consultants: ConsultantAvailability[];
  centers: Array<{ id: string; name: string }>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}



export const useAvailability = ({
  organizationId,
  centerId,
  startDate,
  endDate,
  serviceDuration,
  designation,
  deliveryMode = 'ONLINE',
  enabled = true,
  isRepeatUser = false,
}: UseAvailabilityParams): UseAvailabilityReturn => {
  const [consultants, setConsultants] = useState<ConsultantAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, ConsultantAvailability[]>>(new Map());
  const client = useApolloClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const centers = useMemo(() => {
    const centerMap = new Map<string, string>();
    
    consultants.forEach(consultant => {
      consultant.availableSlots.forEach(slot => {
        if (!centerMap.has(slot.centerId)) {
          centerMap.set(slot.centerId, slot.centerName);
        }
      });
    });

    return Array.from(centerMap.entries()).map(([id, name]) => ({ id, name }));
  }, [consultants]);

  const fetchAvailability = async () => {
    if (!enabled) return;
    if (!isRepeatUser && !organizationId) return;
    if (isRepeatUser && !centerId && !organizationId) return;

    const dateKey = `${isRepeatUser ? 'repeat' : 'new'}-${startDate.toDateString()}-${designation || 'all'}`;
    const cached = cache.get(dateKey);
    
    if (cached) {
      console.log('📦 Cache HIT for date:', dateKey);
      setConsultants(cached);
      return;
    }
    
    console.log('🔍 Cache MISS for date:', dateKey, '- Fetching from API');

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      let data;

      if (isRepeatUser && centerId) {
        // Repeat user with centerId → use getRepeatUserSlots
        const result = await client.query({
          query: GET_REPEAT_USER_SLOTS,
          variables: {
            input: {
              centerId,
              startDate: Math.floor(startDate.getTime() / 1000),
              endDate: Math.floor(endDate.getTime() / 1000),
              designation: designation || null,
              deliveryMode: deliveryMode || null,
            },
          },
          fetchPolicy: 'network-only',
          context: {
            fetchOptions: { signal: abortControllerRef.current.signal },
          },
        });
        data = result.data?.getRepeatUserSlots || [];
      } else {
        // New user or repeat without centerId → use getOrganizationAvailability
        const result = await client.query({
          query: GET_ORGANIZATION_AVAILABILITY,
          variables: {
            input: {
              organizationId,
              startDate: Math.floor(startDate.getTime() / 1000),
              endDate: Math.floor(endDate.getTime() / 1000),
              serviceDuration,
              designation: designation || null,
            },
          },
          fetchPolicy: 'network-only',
          context: {
            fetchOptions: { signal: abortControllerRef.current.signal },
          },
        });
        data = result.data?.getOrganizationAvailability || [];
      }

      if (data.length > 0) {
        setCache(prev => new Map(prev).set(dateKey, data));
        console.log('💾 Cached data for date:', dateKey);
      }
      setConsultants(data);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  useEffect(() => {
    fetchAvailability();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [organizationId, centerId || '', startDate.getTime(), endDate.getTime(), serviceDuration, designation || '', deliveryMode, enabled, isRepeatUser]);

  return {
    consultants,
    centers,
    loading,
    error,
    refetch: fetchAvailability,
  };
};
