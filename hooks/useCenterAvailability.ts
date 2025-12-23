import { useState, useEffect, useMemo, useRef } from 'react';
import { useApolloClient, gql } from '@apollo/client';

const GET_CENTER_AVAILABILITY = gql`
  query GetCenterAvailability($input: CenterAvailabilityInput!) {
    getCenterAvailability(input: $input) {
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

interface UseCenterAvailabilityParams {
  centerId: string;
  startDate: Date;
  endDate: Date;
  serviceDuration: number;
  consultantId?: string;
  designation?: string;
  deliveryMode?: 'ONLINE' | 'OFFLINE';
  enabled?: boolean;
}

interface UseCenterAvailabilityReturn {
  consultants: ConsultantAvailability[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}



export const useCenterAvailability = ({
  centerId,
  startDate,
  endDate,
  serviceDuration,
  consultantId,
  designation,
  deliveryMode = 'OFFLINE',
  enabled = true,
}: UseCenterAvailabilityParams): UseCenterAvailabilityReturn => {
  const [consultants, setConsultants] = useState<ConsultantAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cache, setCache] = useState<Map<string, ConsultantAvailability[]>>(new Map());
  const client = useApolloClient();
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAvailability = async () => {
    if (!enabled || !centerId) return;

    const dateKey = `${startDate.toDateString()}-${designation || 'all'}`;
    const cached = cache.get(dateKey);
    
    if (cached) {
      setConsultants(cached);
      return;
    }

    // Abort previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const { data } = await client.query({
        query: GET_CENTER_AVAILABILITY,
        variables: {
          input: {
            centerId,
            startDate: Math.floor(startDate.getTime() / 1000),
            endDate: Math.floor(endDate.getTime() / 1000),
            serviceDuration,
            consultantId: consultantId || null,
            designation: designation || null,
            deliveryMode: deliveryMode || null,
          },
        },
        fetchPolicy: 'network-only',
        context: {
          fetchOptions: {
            signal: abortControllerRef.current.signal,
          },
        },
      });

      const result = data?.getCenterAvailability || [];
      setCache(prev => new Map(prev).set(dateKey, result));
      setConsultants(result);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Error fetching center availability:', err);
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
  }, [centerId, startDate.getTime(), endDate.getTime(), serviceDuration, consultantId || '', designation || '', deliveryMode, enabled]);

  return {
    consultants,
    loading,
    error,
    refetch: fetchAvailability,
  };
};
