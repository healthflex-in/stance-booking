import React from 'react';
import { User } from '@/gql/graphql';

/**
 * Custom hook that prepares consultant display information
 * Returns names and profile pictures mapped by consultant ID
 */
export function useConsultantDisplayData(consultantsData: User[] = []) {
  return React.useMemo(() => {
    const names: { [key: string]: string } = {};
    const pics: { [key: string]: string } = {};

    consultantsData.forEach(consultant => {
      names[consultant._id] = `${consultant.profileData?.firstName || ''} ${consultant.profileData?.lastName || ''}`.trim() || consultant._id;
      pics[consultant._id] = consultant.profileData?.profilePicture || '';
    });

    // Add "Unassigned" option
    names['unassigned'] = 'Unassigned';

    return {
      consultantNames: names,
      consultantProfilePictures: pics
    };
  }, [consultantsData]);
}
