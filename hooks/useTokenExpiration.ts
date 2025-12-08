import { useCallback } from 'react';
import { useAuth } from '@/contexts';
import { handleTokenExpiration, getCurrentToken } from '@/utils/auth-utils';

/**
 * Hook to handle token expiration detection and automatic logout
 * This hook validates JWT tokens comprehensively and handles expiration
 */
export const useTokenExpiration = () => {
  const { logout } = useAuth();

  /**
   * Handle token expiration by calling logout and clearing data
   */
  const handleExpiration = useCallback(async () => {
    try {
      await handleTokenExpiration();
    } catch (error) {
      console.error('Error handling token expiration:', error);
      // Fallback to context logout if utility fails
      logout();
    }
  }, [logout]);

  /**
   * Validate JWT token structure and format
   */
  const isValidJWTStructure = useCallback((token: string): boolean => {
    try {
      // Check if token exists and is a string
      if (!token || typeof token !== 'string') {
        return false;
      }

      // JWT must have exactly 3 parts separated by dots
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const [header, payload, signature] = parts;

      // Each part must be non-empty and valid base64url
      if (!header || !payload || !signature) {
        return false;
      }

      // Validate base64url format (basic check)
      const base64urlRegex = /^[A-Za-z0-9_-]+$/;
      if (!base64urlRegex.test(header) || !base64urlRegex.test(payload) || !base64urlRegex.test(signature)) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating JWT structure:', error);
      return false;
    }
  }, []);

  /**
   * Decode and validate JWT payload
   */
  const validateJWTPayload = useCallback((token: string): { isValid: boolean; payload?: any } => {
    try {
      const parts = token.split('.');
      const payload = parts[1];

      // Add padding if needed for proper base64 decoding
      const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
      
      // Decode the payload
      const decodedPayload = JSON.parse(atob(paddedPayload));

      // Validate required JWT claims
      if (typeof decodedPayload !== 'object' || decodedPayload === null) {
        return { isValid: false };
      }

      // Check for required standard claims
      const requiredClaims = ['exp', 'iat'];
      const hasRequiredClaims = requiredClaims.some(claim => 
        decodedPayload.hasOwnProperty(claim) && typeof decodedPayload[claim] === 'number'
      );

      if (!hasRequiredClaims) {
        return { isValid: false };
      }

      // Validate expiration time format
      if (decodedPayload.exp && typeof decodedPayload.exp !== 'number') {
        return { isValid: false };
      }

      // Validate issued at time format
      if (decodedPayload.iat && typeof decodedPayload.iat !== 'number') {
        return { isValid: false };
      }

      return { isValid: true, payload: decodedPayload };
    } catch (error) {
      console.error('Error validating JWT payload:', error);
      return { isValid: false };
    }
  }, []);

  /**
   * Validate JWT header
   */
  const validateJWTHeader = useCallback((token: string): boolean => {
    try {
      const parts = token.split('.');
      const header = parts[0];

      // Add padding if needed
      const paddedHeader = header + '='.repeat((4 - header.length % 4) % 4);
      
      // Decode the header
      const decodedHeader = JSON.parse(atob(paddedHeader));

      // Validate header structure
      if (typeof decodedHeader !== 'object' || decodedHeader === null) {
        return false;
      }

      // Check for algorithm field
      if (!decodedHeader.alg || typeof decodedHeader.alg !== 'string') {
        return false;
      }

      // Check for token type (optional but recommended)
      if (decodedHeader.typ && decodedHeader.typ !== 'JWT') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating JWT header:', error);
      return false;
    }
  }, []);

  /**
   * Check if token is expired or invalid
   * This performs comprehensive validation including structure, format, and expiration
   */
  const isTokenExpiredOrInvalid = useCallback((): boolean => {
    const token = getCurrentToken();
    
    // No token means expired/invalid
    if (!token) {
      return true;
    }

    // Validate JWT structure
    if (!isValidJWTStructure(token)) {
      console.warn('Invalid JWT structure detected');
      return true;
    }

    // Validate JWT header
    if (!validateJWTHeader(token)) {
      console.warn('Invalid JWT header detected');
      return true;
    }

    // Validate and decode payload
    const { isValid, payload } = validateJWTPayload(token);
    if (!isValid || !payload) {
      console.warn('Invalid JWT payload detected');
      return true;
    }

    // Check expiration time
    if (payload.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      const isExpired = payload.exp < currentTime;
      
      if (isExpired) {
        console.warn('Token has expired');
        return true;
      }
    }

    // Check if token is issued in the future (clock skew protection)
    if (payload.iat) {
      const currentTime = Math.floor(Date.now() / 1000);
      const clockSkewTolerance = 300; // 5 minutes tolerance
      
      if (payload.iat > currentTime + clockSkewTolerance) {
        console.warn('Token issued in the future');
        return true;
      }
    }

    // Additional validation: check if token was issued too long ago (even if not expired)
    // This helps detect very old tokens that might have been tampered with
    if (payload.iat) {
      const currentTime = Math.floor(Date.now() / 1000);
      const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
      
      if (currentTime - payload.iat > maxAge) {
        console.warn('Token is too old');
        return true;
      }
    }

    return false;
  }, [isValidJWTStructure, validateJWTHeader, validateJWTPayload]);

  /**
   * Get token information for debugging
   */
  const getTokenInfo = useCallback(() => {
    const token = getCurrentToken();
    if (!token) return null;

    try {
      const { isValid, payload } = validateJWTPayload(token);
      if (!isValid || !payload) return null;

      return {
        isExpired: payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : false,
        expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
        issuedAt: payload.iat ? new Date(payload.iat * 1000) : null,
        subject: payload.sub,
        issuer: payload.iss,
        audience: payload.aud,
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }, [validateJWTPayload]);

  // Remove the periodic validation effect - it's unnecessary and causes issues
  // Token expiration should be handled by:
  // 1. API responses (401/403 errors)
  // 2. Manual validation before critical operations
  // 3. AuthContext initialization check

  /**
   * Manual token validation (useful for API calls)
   */
  const validateCurrentToken = useCallback((): boolean => {
    return !isTokenExpiredOrInvalid();
  }, [isTokenExpiredOrInvalid]);

  return {
    handleExpiration,
    isTokenExpiredOrInvalid,
    validateCurrentToken,
    getTokenInfo,
    // Backward compatibility
    isTokenExpired: isTokenExpiredOrInvalid,
  };
};

export default useTokenExpiration;