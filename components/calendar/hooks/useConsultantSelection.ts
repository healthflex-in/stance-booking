import React from 'react';
import { useQuery } from '@apollo/client';

import { User } from '@/gql/graphql';
import { GET_CONSULTANTS } from '@/gql/queries';
import { UserType, SortOrder, UserSortField } from '@/gql/graphql';

// Define constant colors for consultants
export const CONSULTANT_COLORS = [
  'bg-green-100',
  'bg-rose-100',
  'bg-purple-100',
  'bg-yellow-100',
  'bg-red-100',
  'bg-blue-100',
  'bg-orange-100',
  'bg-pink-100',
];

interface ConsultantState {
  id: string;
  name: string;
  color: string;
  isSelected: boolean;
}

/**
 * Hook for fetching consultants and managing their selection state
 */
export function useConsultantSelection(centerId: string[]) {
  // State for consultant selection
  const [consultants, setConsultants] = React.useState<ConsultantState[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [colorMap, setColorMap] = React.useState<{ [key: string]: string }>({});
  const [selectedConsultantsData, setSelectedConsultantsData] = React.useState<User[]>([]);


  // Use a single query with a reasonable limit for the selection use case
  const { data: consultantsData, loading: consultantsLoading, error: consultantsError } = useQuery(GET_CONSULTANTS, {
    variables: {
      userType: UserType.Consultant,
      centerId: centerId,
      pagination: {
        limit: 500, // Reasonable limit for consultant selection
      },
      sort: {
        field: UserSortField.CreatedAt,
        order: SortOrder.Asc,
      },
    },
    skip: !centerId || centerId.length === 0,
    fetchPolicy: 'cache-and-network',
  });

  // Transform API data into UI state when data changes
  React.useEffect(() => {
    if (consultantsData?.users?.data) {
      const transformedConsultants = consultantsData.users.data.map((consultant: User, index: number) => {
        const name = `${consultant.profileData?.firstName || ''} ${consultant.profileData?.lastName || ''}`.trim() || consultant._id;
        const color = CONSULTANT_COLORS[index % CONSULTANT_COLORS.length];

        return {
          id: consultant._id,
          name,
          color,
          isSelected: true // Default to selected
        };
      });

      // Add "Unassigned" option
      transformedConsultants.push({
        id: 'unassigned',
        name: 'Unassigned',
        color: 'bg-yellow-100',
        isSelected: true
      });

      setConsultants(transformedConsultants);
    }
  }, [consultantsData]);

  // Update color mapping when consultants change
  React.useEffect(() => {
    const newColorMap = consultants.reduce((acc, consultant) => {
      acc[consultant.id] = consultant.color;
      return acc;
    }, {} as { [key: string]: string });

    setColorMap(newColorMap);
  }, [consultants]);

  // Update selected IDs when consultants change
  React.useEffect(() => {
    const newSelectedIds = consultants
      .filter(c => c.isSelected)
      .map(c => c.id);

    setSelectedIds(newSelectedIds);
  }, [consultants]);

  // Update selected consultants data when selections change
  React.useEffect(() => {
    if (consultantsData?.users?.data) {
      const selected = consultantsData.users.data.filter((consultant: User) =>
        consultants.some(c => c.id === consultant._id && c.isSelected)
      );

      setSelectedConsultantsData(selected);
    }
  }, [consultants, consultantsData]);

  // Toggle single consultant selection
  const toggleConsultant = (id: string) => {
    setConsultants(prev =>
      prev.map(consultant =>
        consultant.id === id
          ? { ...consultant, isSelected: !consultant.isSelected }
          : consultant
      )
    );
  };

  // Toggle all consultants
  const toggleAll = () => {
    const allSelected = consultants.length > 0 && consultants.every(c => c.isSelected);
    setConsultants(prev => prev.map(consultant => ({ ...consultant, isSelected: !allSelected })));
  };

  return {
    toggleAll,
    colorMap,
    consultants,
    selectedIds,
    consultantsError,
    toggleConsultant,
    selectedConsultantsData,
    consultantsLoading: consultantsLoading,
    allSelected: consultants.length > 0 && consultants.every(c => c.isSelected)
  };
}
