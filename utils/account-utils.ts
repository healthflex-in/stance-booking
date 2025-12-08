// Default IDs to use as fallbacks
export const DEFAULT_CENTER_ID = process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '';
export const DEFAULT_ORGANIZATION_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '';

/**
 * Gets the center ID from localStorage or returns the default
 */
export const getCenterId = () => {
  // Check if mobile booking route - use hardcoded value
  if (typeof window !== 'undefined' && window.location.pathname.includes('/onboarding-patient')) {
    return process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '';
  }

  if (typeof window === 'undefined') return DEFAULT_CENTER_ID;
  const storedCenterIds = localStorage.getItem('stance-centreID');
  if (storedCenterIds) {
    try {
      const parsedIds = JSON.parse(storedCenterIds);
      const centerArray = Array.isArray(parsedIds) ? parsedIds : [parsedIds];
      const validCenterIds = centerArray.filter(id => 
        id && 
        typeof id === 'string' && 
        id.trim().length > 0 &&
        id !== 'null' &&
        id !== 'undefined'
      );
      return validCenterIds.length > 0 ? validCenterIds[0] : DEFAULT_CENTER_ID;
    } catch { 
      return DEFAULT_CENTER_ID;
    }
  }
  return DEFAULT_CENTER_ID;
};

/**
 * Gets all center IDs from localStorage as an array
 */
export const getCenterIds = () => {
  if (typeof window === 'undefined') return DEFAULT_CENTER_ID ? [DEFAULT_CENTER_ID] : [];
  const storedCenterIds = localStorage.getItem('stance-centreID');
  if (storedCenterIds) {
    try {
      const parsedIds = JSON.parse(storedCenterIds);
      const centerArray = Array.isArray(parsedIds) ? parsedIds : [parsedIds];
      const validCenterIds = centerArray.filter(id => 
        id && 
        typeof id === 'string' && 
        id.trim().length > 0 &&
        id !== 'null' &&
        id !== 'undefined'
      );
      return validCenterIds.length > 0 ? validCenterIds : (DEFAULT_CENTER_ID ? [DEFAULT_CENTER_ID] : []);
    } catch { 
      return DEFAULT_CENTER_ID ? [DEFAULT_CENTER_ID] : [];
    }
  }
  return DEFAULT_CENTER_ID ? [DEFAULT_CENTER_ID] : [];
};

/**
 * Gets the organization ID from localStorage or returns the default
 */
export function getOrganizationId(): string {
  // Check if mobile booking route - use hardcoded value
  if (typeof window !== 'undefined' && window.location.pathname.includes('/onboarding-patient')) {
    return process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '';
  }

  if (typeof window === 'undefined') return DEFAULT_ORGANIZATION_ID;
  return localStorage.getItem('stance-organizationID') || DEFAULT_ORGANIZATION_ID;
}

/**
 * Sets the center ID in localStorage (single center)
 */
export function setCenterId(id: string): void {
  if (typeof window !== 'undefined' && id && id.trim().length > 0) {
    localStorage.setItem('stance-centreID', JSON.stringify([id]));
  }
}

/**
 * Sets multiple center IDs in localStorage
 */
export function setCenterIds(ids: string[]): void {
  if (typeof window !== 'undefined') {
    const validIds = ids.filter(id => 
      id && 
      typeof id === 'string' && 
      id.trim().length > 0 &&
      id !== 'null' &&
      id !== 'undefined'
    );
    if (validIds.length > 0) {
      localStorage.setItem('stance-centreID', JSON.stringify(validIds));
    }
  }
}

/**
 * Sets the organization ID in localStorage
 */
export function setOrganizationId(id: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('stance-organizationID', id);
  }
} 

export function getUser() {
  const user = localStorage.getItem('user');
  if (user) {
    return JSON.parse(user);
  }
  return null;
}