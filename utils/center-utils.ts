/**
 * Comprehensive center management utilities
 * Handles all center-related localStorage operations consistently
 */

import { DEFAULT_CENTER_ID } from './account-utils';

const STORAGE_KEY = 'stance-centreID';

/**
 * Validates if a center ID is valid
 */
export function isValidCenterId(id: any): id is string {
  return id && 
         typeof id === 'string' && 
         id.trim().length > 0 &&
         id !== 'null' &&
         id !== 'undefined';
}

/**
 * Safely parses center IDs from localStorage
 */
export function parseCenterIds(storedValue: string): string[] {
  try {
    const parsed = JSON.parse(storedValue);
    const centerArray = Array.isArray(parsed) ? parsed : [parsed];
    return centerArray.filter(isValidCenterId);
  } catch (error) {
    console.warn('Error parsing center IDs:', error);
    return [];
  }
}

/**
 * Gets all center IDs from localStorage or mobile config
 */
export function getAllCenterIds(): string[] {
  // Check if mobile booking route
  if (typeof window !== 'undefined' && window.location.pathname.includes('/onboarding-patient')) {
    return [process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || ''];
  }

  if (typeof window === 'undefined') {
    return DEFAULT_CENTER_ID ? [DEFAULT_CENTER_ID] : [];
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return DEFAULT_CENTER_ID ? [DEFAULT_CENTER_ID] : [];
  }

  const validIds = parseCenterIds(stored);
  return validIds.length > 0 ? validIds : (DEFAULT_CENTER_ID ? [DEFAULT_CENTER_ID] : []);
}

/**
 * Gets the primary (first) center ID
 */
export function getPrimaryCenterId(): string {
  const allIds = getAllCenterIds();
  return allIds[0] || DEFAULT_CENTER_ID || '';
}

/**
 * Sets center IDs in localStorage
 */
export function setCenterIds(ids: string | string[]): void {
  if (typeof window === 'undefined') return;

  const centerArray = Array.isArray(ids) ? ids : [ids];
  const validIds = centerArray.filter(isValidCenterId);
  
  if (validIds.length > 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validIds));
  } else if (DEFAULT_CENTER_ID) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([DEFAULT_CENTER_ID]));
  }
}

/**
 * Adds a center ID to the existing list
 */
export function addCenterId(id: string): void {
  if (!isValidCenterId(id)) return;
  
  const existing = getAllCenterIds();
  if (!existing.includes(id)) {
    setCenterIds([...existing, id]);
  }
}

/**
 * Removes a center ID from the list
 */
export function removeCenterId(id: string): void {
  const existing = getAllCenterIds();
  const filtered = existing.filter(existingId => existingId !== id);
  setCenterIds(filtered);
}

/**
 * Clears all center IDs
 */
export function clearCenterIds(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Checks if a center ID exists in the current selection
 */
export function hasCenterId(id: string): boolean {
  return getAllCenterIds().includes(id);
}

/**
 * Gets center IDs for GraphQL headers (returns first ID or default)
 */
export function getCenterIdForHeaders(): string {
  // Check if mobile booking route
  if (typeof window !== 'undefined' && window.location.pathname.includes('/onboarding-patient')) {
    return process.env.NEXT_PUBLIC_DEFAULT_CENTER_ID || '';
  }
  
  return getPrimaryCenterId();
}

/**
 * Debug function to log current center state
 */
export function debugCenterState(): void {
  if (typeof window === 'undefined') {
    console.log('🏥 Center Debug: SSR mode, no localStorage available');
    return;
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  const parsed = raw ? parseCenterIds(raw) : [];
  const primary = getPrimaryCenterId();
  
  console.log('🏥 Center Debug State:', {
    raw,
    parsed,
    primary,
    defaultCenterId: DEFAULT_CENTER_ID,
    isValid: isValidCenterId(primary)
  });
}