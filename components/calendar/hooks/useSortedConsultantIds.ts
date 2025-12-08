import React from 'react';
import { User } from '@/gql/graphql';

/**
 * Hook that sorts consultant IDs alphabetically by first name
 */
export function useSortedConsultantIds(consultantsData: User[] = []) {
  return React.useMemo(() => {
    // Create a safe lookup map to avoid NoSQL injection
    const consultantMap = new Map<string, string>();
    consultantsData.forEach(consultant => {
      if (consultant._id && typeof consultant._id === 'string') {
        consultantMap.set(consultant._id, (consultant.profileData?.firstName || '').toLowerCase());
      }
    });

    return consultantsData
      .map(consultant => consultant._id)
      .filter(id => typeof id === 'string' && id.length > 0)
      .sort((a, b) => {
        const nameA = consultantMap.get(a) || '';
        const nameB = consultantMap.get(b) || '';
        return nameA.localeCompare(nameB);
      });
  }, [consultantsData]);
}
