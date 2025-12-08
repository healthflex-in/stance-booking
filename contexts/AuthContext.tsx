'use client';

import React from 'react';
import { Analytics } from 'firebase/analytics';
import { useRouter, usePathname } from 'next/navigation';
import StanceHealthLoader from '../components/loader/StanceHealthLoader';
import { useMutation } from '@apollo/client';
import { LOGOUT } from '@/gql/queries';
import { clearAuthData, getCurrentUser, getCurrentToken } from '@/utils/auth-utils';
import { validateSession } from '@/utils/session-utils';

export type ProfileData = {
  firstName: string;
  lastName: string;
  profilePicture?: string | null;
  organization?: { _id: string };
};

export type User = {
  _id: string;
  seqNo: string;
  phone: string;
  email: string;
  userType: string;
  isActive: boolean;
  profileData?: ProfileData;
};

export type AuthContextType = {
  /**
   * State's
   */
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;

  /**
   * Action's
   */
  logout: () => void;
  login: (token: string, refreshToken: string, user: User) => void;
};

/**
 * route patterns
 */
const publicRoutes = ['/', '/login', '/signup', '/about', '/onboarding-patient', '/book', '/book-prepaid'];
const protectedRoutes = [
  '/dashboard',
  '/select-center',
  '/profile',
  '/settings',
  '/generate-link',
];

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = React.useState(true);
  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [analytics, setAnalytics] = React.useState<Analytics | null>(null);

  // Initialize Firebase Analytics
  React.useEffect(() => {
    const initializeAnalytics = async () => {
      if (typeof window !== 'undefined') {
        try {
          const { analytics: firebaseAnalytics } = await import(
            '@/lib/firebase'
          );
          // Wait a bit for analytics to be initialized
          if (firebaseAnalytics) {
            setAnalytics(firebaseAnalytics);
          } else {
            // If analytics is still null, try to initialize it
            const { getAnalytics, isSupported } = await import(
              'firebase/analytics'
            );
            const { default: app } = await import('@/lib/firebase');

            const supported = await isSupported();
            if (supported) {
              const analyticsInstance = getAnalytics(app);
              setAnalytics(analyticsInstance);
            }
          }
        } catch (error) {
          console.error('Failed to initialize analytics:', error);
        }
      }
    };

    initializeAnalytics();
  }, []);

  // Set mounted state to true after initial render
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to log analytics events
  const logAnalyticsEvent = React.useCallback(
    async (eventName: string, parameters: Record<string, any>) => {
      if (analytics) {
        try {
          const { logEvent } = await import('firebase/analytics');
          logEvent(analytics, eventName, parameters);
        } catch (error) {
          console.error('Failed to log analytics event:', error);
        }
      }
    },
    [analytics]
  );

  // Helper function to set user properties
  const setAnalyticsUserProperties = React.useCallback(
    async (userData: User) => {
      if (analytics) {
        try {
          const { setUserId, setUserProperties } = await import(
            'firebase/analytics'
          );
          setUserId(analytics, userData._id);
          setUserProperties(analytics, {
            user_type: userData.userType,
            organization_id:
              userData.profileData?.organization?._id || 'unknown',
            is_active: userData.isActive,
            has_profile_picture: !!userData.profileData?.profilePicture,
          });
        } catch (error) {
          console.error('Failed to set analytics user properties:', error);
        }
      }
    },
    [analytics]
  );

  React.useEffect(() => {
    // Only run on client side after component is mounted
    if (!mounted) return;

    // Check if user is logged in on initial load
    const token = getCurrentToken();
    const userData = getCurrentUser();

    if (token && userData) {
      try {
        setUser(userData);
        setIsAuthenticated(true);

        // Track user session restored
        setAnalyticsUserProperties(userData);
        logAnalyticsEvent('session_restored', {
          user_id: userData._id,
          user_type: userData.userType,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        console.error('Failed to restore user session:', e);
        clearAuthData();

        // Track session restore failure
        logAnalyticsEvent('session_restore_failed', {
          reason: 'session_restore_error',
          timestamp: new Date().toISOString(),
        });
      }
    } else if (token || userData) {
      // Partial data found, clear everything
      console.warn('Incomplete authentication data found, clearing...');
      clearAuthData();
      
      logAnalyticsEvent('session_restore_failed', {
        reason: 'incomplete_auth_data',
        timestamp: new Date().toISOString(),
      });
    }

    setLoading(false);
  }, [mounted, analytics, setAnalyticsUserProperties, logAnalyticsEvent]);

  // Redirect unauthenticated users away from protected routes
  React.useEffect(() => {
    if (!mounted || loading) return;
    if (typeof window === 'undefined') return;

    // Check if current path is a protected route
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );
    
    // Check if current path is a public route
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Only redirect if trying to access protected routes without auth
    if (!isAuthenticated && isProtectedRoute) {
      logAnalyticsEvent('unauthorized_access_attempt', {
        attempted_path: pathname,
        timestamp: new Date().toISOString(),
      });

      router.push('/');
    } else if (isAuthenticated && pathname === '/') {
      // Check if there's a stored redirect path
      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        router.push(redirectPath);
      } else {
        // Default to dashboard after login
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, loading, pathname, router, mounted, logAnalyticsEvent]);

  const login = (token: string, refreshToken: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Store organization ID from user data
      if (userData.profileData?.organization?._id) {
        localStorage.setItem(
          'stance-organizationID',
          userData.profileData.organization._id
        );
      }

      // Track successful login with analytics
      setAnalyticsUserProperties(userData);

      logAnalyticsEvent('login', {
        method: 'credentials',
        user_id: userData._id,
        user_type: userData.userType,
        organization_id: userData.profileData?.organization?._id || 'unknown',
        timestamp: new Date().toISOString(),
      });

      // Track hospital staff login specifically
      logAnalyticsEvent('hospital_staff_login', {
        user_id: userData._id,
        user_type: userData.userType,
        organization_id: userData.profileData?.organization?._id || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }

    setUser(userData);
    setIsAuthenticated(true);
  };

  const [logoutMutation] = useMutation(LOGOUT);

  const logout = async () => {
    // Track logout before clearing data
    if (typeof window !== 'undefined' && user) {
      logAnalyticsEvent('logout', {
        user_id: user._id,
        user_type: user.userType,
        session_duration: 'unknown', // You could track session start time to calculate this
        timestamp: new Date().toISOString(),
      });

      // Track hospital staff logout
      logAnalyticsEvent('hospital_staff_logout', {
        user_id: user._id,
        user_type: user.userType,
        timestamp: new Date().toISOString(),
      });

      // Call logout API to deactivate session
      try {
        await logoutMutation();
        console.log('Logout API called successfully');
      } catch (error) {
        console.warn('Logout API call failed:', error);
        // Continue with logout even if API call fails
      }
    }

    // Clear authentication data
    clearAuthData();
    
    // Update state
    setUser(null);
    setIsAuthenticated(false);
    
    // Redirect to home/login
    router.push('/');
  };

  // Session timeout detection
  React.useEffect(() => {
    if (!mounted || !isAuthenticated) return;
    
    const checkSessionValidity = () => {
      if (!validateSession()) {
        console.warn('Session data incomplete, logging out');
        logout();
      }
    };
    
    // Check session validity every 30 seconds
    const interval = setInterval(checkSessionValidity, 30000);
    
    return () => clearInterval(interval);
  }, [mounted, isAuthenticated]);

  // Show loading state only after mounted to avoid hydration mismatch
  if (!mounted) return null;
  if (loading) return <StanceHealthLoader />;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}