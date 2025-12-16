import { useState, useEffect, useMemo, useRef } from 'react';
import { useApolloClient, gql } from '@apollo/client';

const GET_ORGANIZATION_AVAILABILITY = gql`
  query GetOrganizationAvailability($input: OrganizationAvailabilityInput!) {
    getOrganizationAvailability(input: $input) {
      consultantId
      consultantName
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
  startDate: Date;
  endDate: Date;
  serviceDuration: number;
  designation?: string;
  enabled?: boolean;
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
  startDate,
  endDate,
  serviceDuration,
  designation,
  enabled = true,
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
    if (!enabled || !organizationId) return;

    const dateKey = startDate.toDateString();
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
      const { data } = await client.query({
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
          fetchOptions: {
            signal: abortControllerRef.current.signal,
          },
        },
      });

      const result = data?.getOrganizationAvailability || [];
      setCache(prev => new Map(prev).set(dateKey, result));
      console.log('💾 Cached data for date:', dateKey, '- Total cached dates:', cache.size + 1);
      setConsultants(result);
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
  }, [organizationId, startDate.getTime(), endDate.getTime(), serviceDuration, designation || '', enabled]);

  return {
    consultants,
    centers,
    loading,
    error,
    refetch: fetchAvailability,
  };
};
