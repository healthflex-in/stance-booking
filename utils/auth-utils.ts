import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { LOGOUT } from '@/gql/queries';

/**
 * Centralized function to handle token expiration
 * This function:
 * 1. Calls the logout API to deactivate the session
 * 2. Clears all localStorage data
 * 3. Redirects to login page
 */
export const handleTokenExpiration = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Create a temporary client to call logout API
      const tempClient = new ApolloClient({
        cache: new InMemoryCache(),
        link: from([
          setContext(() => ({
            headers: {
              authorization: `Bearer ${token}`,
              'x-organization-id': localStorage.getItem('stance-organizationID') || '',
              'x-center-id': localStorage.getItem('stance-centreID') || '',
            },
          })),
          createHttpLink({
            uri: process.env.NEXT_PUBLIC_GRAPHQL_API_URL || 'https://devapi.stance.health/graphql',
          }),
        ]),
      });

      // Call logout API to deactivate session
      try {
        await tempClient.mutate({
          mutation: LOGOUT,
        });
        console.log('Session deactivated successfully');
      } catch (logoutError) {
        // Even if logout API fails, we still need to clear local storage
        console.warn('Logout API call failed:', logoutError);
      }
    }
  } catch (error) {
    console.warn('Error during token expiration handling:', error);
  } finally {
    // Always clear localStorage and redirect
    clearAuthData();
    redirectToLogin();
  }
};

/**
 * Clear all authentication-related data from localStorage
 */
export const clearAuthData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('stance-organizationID');
    localStorage.removeItem('stance-centreID');
  }
};

/**
 * Redirect to login page
 */
export const redirectToLogin = (): void => {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

/**
 * Check if user is authenticated by verifying token existence
 */
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = (): any | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data from localStorage:', error);
    return null;
  }
};

/**
 * Get current token from localStorage
 */
export const getCurrentToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};