import { useState, useEffect, useMemo } from 'react';
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
  enabled = true,
}: UseAvailabilityParams): UseAvailabilityReturn => {
  const [consultants, setConsultants] = useState<ConsultantAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const client = useApolloClient();

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
          },
        },
        fetchPolicy: 'network-only',
      });

      setConsultants(data?.getOrganizationAvailability || []);
    } catch (err) {
      console.error('Error fetching availability:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch availability');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [organizationId, startDate.getTime(), endDate.getTime(), serviceDuration, enabled]);

  return {
    consultants,
    centers,
    loading,
    error,
    refetch: fetchAvailability,
  };
};
