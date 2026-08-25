/**
 * Booking storage utility
 * Provides a unified interface for storing booking-related data
 * Uses tab-isolated storage to prevent conflicts between multiple tabs
 */

import { tabStorage } from './tab-storage';

/**
 * Storage wrapper for booking data
 * Uses tab-isolated storage by default
 */
export const bookingStorage = {
  /**
   * Set a booking-related item
   */
  setItem(key: string, value: string): void {
    tabStorage.setItem(key, value);
  },

  /**
   * Get a booking-related item
   */
  getItem(key: string): string | null {
    return tabStorage.getItem(key);
  },

  /**
   * Remove a booking-related item
   */
  removeItem(key: string): void {
    tabStorage.removeItem(key);
  },

  /**
   * Clear all booking data for current tab
   */
  clear(): void {
    tabStorage.clear();
  },

  /**
   * Get current tab ID
   */
  getTabId(): string {
    return tabStorage.getTabId();
  }
};
