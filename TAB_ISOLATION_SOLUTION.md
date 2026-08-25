# Tab Isolation Solution

## Problem
When opening the same booking URL in multiple tabs in the same browser, all tabs share the same `sessionStorage`. This causes data conflicts and corruption between tabs, leading to:
- Tab A's booking data overwriting Tab B's data
- Users seeing incorrect information
- Booking flow breaking when switching between tabs
- Data "hallucination" where one tab's state affects another

## Solution
Implemented **tab-specific storage** that isolates data per browser tab using unique tab IDs.

## How It Works

### 1. Tab ID Generation
Each tab gets a unique identifier stored in its own sessionStorage:
```typescript
// Format: tab_<timestamp>_<random>
// Example: tab_1709123456789_x7k2m9p
```

### 2. Key Prefixing
All storage keys are prefixed with the tab ID:
```typescript
// Instead of: sessionStorage.setItem('patientId', '123')
// We use: sessionStorage.setItem('tab_1709123456789_x7k2m9p__patientId', '123')
```

### 3. Automatic Isolation
Each tab only reads/writes its own prefixed keys, preventing cross-tab interference.

## Implementation Files

### Core Utilities
1. **`utils/tab-storage.ts`** - Tab-isolated storage API
   - `tabStorage.setItem(key, value)` - Store data for current tab
   - `tabStorage.getItem(key)` - Retrieve data for current tab
   - `tabStorage.removeItem(key)` - Remove data for current tab
   - `tabStorage.clear()` - Clear all data for current tab
   - `tabStorage.getTabId()` - Get current tab's unique ID

2. **`utils/booking-storage.ts`** - Booking-specific storage wrapper
   - Provides a clean API for booking data
   - Uses tab-storage under the hood

3. **`utils/booking-params.ts`** - Updated to use tab storage
   - `storeBookingParamsInSession()` - Now uses tab storage
   - `getBookingParamsFromSession()` - Now uses tab storage
   - `isParamFromUrl()` - Now uses tab storage

## Migration Guide

### Before (Using sessionStorage)
```typescript
// Setting data
sessionStorage.setItem('patientId', patientId);
sessionStorage.setItem('centerId', centerId);

// Getting data
const patientId = sessionStorage.getItem('patientId');
const centerId = sessionStorage.getItem('centerId');

// Removing data
sessionStorage.removeItem('patientId');
```

### After (Using bookingStorage)
```typescript
import { bookingStorage } from '@/utils/booking-storage';

// Setting data
bookingStorage.setItem('patientId', patientId);
bookingStorage.setItem('centerId', centerId);

// Getting data
const patientId = bookingStorage.getItem('patientId');
const centerId = bookingStorage.getItem('centerId');

// Removing data
bookingStorage.removeItem('patientId');
```

## Files That Need Migration

### High Priority (Booking Flow)
- ✅ `utils/booking-params.ts` - DONE
- ✅ `app/[orgSlug]/online/new/page.tsx` - DONE
- ✅ `app/[orgSlug]/online/repeat/page.tsx` - DONE
- ✅ `app/[orgSlug]/offline/new/page.tsx` - DONE
- ✅ `app/[orgSlug]/offline/repeat/page.tsx` - DONE
- ✅ `app/[orgSlug]/online/prepaid/new/page.tsx` - DONE
- ✅ `app/[orgSlug]/online/prepaid/repeat/page.tsx` - DONE
- ✅ `app/[orgSlug]/page.tsx` - DONE
- ✅ `app/[orgSlug]/online/page.tsx` - DONE
- ✅ `app/[orgSlug]/offline/page.tsx` - DONE
- ✅ `app/[orgSlug]/online/prepaid/page.tsx` - DONE

### Payment Components
- ✅ `components/onboarding/new-user-offline/NewUserOfflinePaymentConfirmation.tsx` - DONE
- ✅ `components/onboarding/new-user-offline/NewUserOfflinePaymentProcessing.tsx` - DONE
- ✅ `components/onboarding/new-user-online/NewUserOnlinePaymentConfirmation.tsx` - DONE
- ✅ `components/onboarding/new-user-online/NewUserOnlinePaymentProcessing.tsx` - DONE
- ✅ `components/onboarding/repeat-user-online/RepeatUserOnlinePaymentConfirmation.tsx` - DONE
- ✅ `components/onboarding/repeat-user-online/RepeatUserOnlinePaymentProcessing.tsx` - DONE

### Components That May Need Updates
- ✅ Payment processing components - DONE (all updated to use bookingStorage)
- ✅ Payment confirmation components - DONE (all updated to use bookingStorage)
- Any other component that directly uses `sessionStorage` for booking data

## Benefits

### ✅ Tab Independence
- Each tab maintains its own booking state
- No cross-tab data corruption
- Users can book multiple appointments simultaneously in different tabs

### ✅ Better UX
- No confusion from seeing wrong data
- Reliable booking flow
- Each tab works independently

### ✅ Backward Compatible
- Still uses sessionStorage under the hood
- Data is cleared when tab closes
- No server-side changes needed

### ✅ Easy to Debug
- Tab ID visible in storage keys
- Can inspect each tab's data separately
- Clear separation of concerns

## Testing

### Test Scenarios
1. **Multiple Tabs Test**
   - Open booking URL in Tab A
   - Open same URL in Tab B
   - Fill different data in each tab
   - Verify each tab maintains its own data

2. **Tab Switch Test**
   - Start booking in Tab A
   - Switch to Tab B and start different booking
   - Switch back to Tab A
   - Verify Tab A still has correct data

3. **Tab Close Test**
   - Complete booking in Tab A
   - Close Tab A
   - Verify Tab B is unaffected

## Cleanup

The system includes automatic cleanup of old tab data:
```typescript
// Call on app initialization (optional)
tabStorage.cleanupOldTabs();
```

This removes data from tabs that are no longer open (though sessionStorage already clears on tab close).

## Notes

- Tab ID is stored in sessionStorage with key `__tab_id__`
- All booking data keys are prefixed with `{tabId}__`
- The solution is transparent to components using the API
- No changes needed to backend/API
- Works with existing booking flow logic

## Future Enhancements

1. **Cross-Tab Communication** (if needed)
   - Use BroadcastChannel API to sync certain data
   - Notify other tabs of important events

2. **Tab Recovery** (if needed)
   - Store tab state in localStorage for recovery
   - Restore booking state after browser crash

3. **Analytics**
   - Track multi-tab usage patterns
   - Identify common multi-booking scenarios
