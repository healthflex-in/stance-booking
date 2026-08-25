'use client';

/**
 * Session validation utilities
 */

export const validateSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  // Organization ID is now stored in cookies, not required for session validation
  // The booking-cookies utility handles org/center context
  return !!(token && user);
};

export const clearSessionData = (): void => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('stance-organizationID');
  localStorage.removeItem('stance-centreID');
};

export const handleSessionExpiry = (): void => {
  clearSessionData();
  
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};

export const isSessionExpired = (error: any): boolean => {
  if (!error?.message) return false;
  
  const expiredMessages = [
    'Organization Not Found',
    'Session expired',
    'Unauthorized',
    'Authentication required',
    'Invalid token'
  ];
  
  return expiredMessages.some(msg => 
    error.message.toLowerCase().includes(msg.toLowerCase())
  );
};