/**
 * Tab-specific storage utility
 * Prevents data conflicts when multiple tabs are open with the same URL
 * Each tab gets its own isolated storage namespace
 */

// Generate a unique tab ID
function generateTabId(): string {
  return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Get or create tab ID for current tab
function getTabId(): string {
  // Use sessionStorage to store tab ID (unique per tab)
  let tabId = sessionStorage.getItem('__tab_id__');
  
  if (!tabId) {
    tabId = generateTabId();
    sessionStorage.setItem('__tab_id__', tabId);
  }
  
  return tabId;
}

// Prefix key with tab ID
function getPrefixedKey(key: string): string {
  const tabId = getTabId();
  return `${tabId}__${key}`;
}

/**
 * Tab-isolated storage API
 * Works like sessionStorage but isolated per tab
 */
export const tabStorage = {
  /**
   * Set item in tab-specific storage
   */
  setItem(key: string, value: string): void {
    try {
      const prefixedKey = getPrefixedKey(key);
      sessionStorage.setItem(prefixedKey, value);
    } catch (error) {
      console.error('Error setting tab storage item:', error);
    }
  },

  /**
   * Get item from tab-specific storage
   */
  getItem(key: string): string | null {
    try {
      const prefixedKey = getPrefixedKey(key);
      return sessionStorage.getItem(prefixedKey);
    } catch (error) {
      console.error('Error getting tab storage item:', error);
      return null;
    }
  },

  /**
   * Remove item from tab-specific storage
   */
  removeItem(key: string): void {
    try {
      const prefixedKey = getPrefixedKey(key);
      sessionStorage.removeItem(prefixedKey);
    } catch (error) {
      console.error('Error removing tab storage item:', error);
    }
  },

  /**
   * Clear all items for current tab
   */
  clear(): void {
    try {
      const tabId = getTabId();
      const keysToRemove: string[] = [];
      
      // Find all keys for this tab
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith(`${tabId}__`)) {
          keysToRemove.push(key);
        }
      }
      
      // Remove them
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing tab storage:', error);
    }
  },

  /**
   * Get current tab ID
   */
  getTabId(): string {
    return getTabId();
  },

  /**
   * Clean up old tab data (optional - for maintenance)
   * Call this on app initialization to remove data from closed tabs
   */
  cleanupOldTabs(): void {
    try {
      const currentTabId = getTabId();
      const keysToRemove: string[] = [];
      
      // Find all tab-prefixed keys
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.includes('__') && !key.startsWith('__tab_id__')) {
          const tabId = key.split('__')[0];
          // If it's not the current tab and starts with 'tab_', mark for removal
          if (tabId !== currentTabId && tabId.startsWith('tab_')) {
            keysToRemove.push(key);
          }
        }
      }
      
      // Remove old tab data
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      
      console.log(`Cleaned up ${keysToRemove.length} old tab storage items`);
    } catch (error) {
      console.error('Error cleaning up old tabs:', error);
    }
  }
};

/**
 * Hook for React components to use tab storage
 */
export function useTabStorage() {
  return tabStorage;
}
