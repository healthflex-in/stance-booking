import { useState, useEffect, useMemo } from 'react';
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
  const client = useApolloClient();

  const fetchAvailability = async () => {
    if (!enabled || !centerId) return;

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
      });

      setConsultants(data?.getCenterAvailability || []);
    } catch (err) {
      console.error('Error fetching center availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [centerId, startDate.getTime(), endDate.getTime(), serviceDuration, consultantId || '', designation || '', deliveryMode, enabled]);

  return {
    consultants,
    loading,
    error,
    refetch: fetchAvailability,
  };
};
