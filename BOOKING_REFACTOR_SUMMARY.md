# Booking System Refactor Summary

## Changes Made

### 1. Removed Redesign Folder
- Deleted `/components/onboarding/redesign/` folder entirely
- Moved reusable components to `/components/onboarding/shared/`

### 2. Components Moved to Shared Folder
The following components were moved from `redesign` to `shared`:
- `ConsultantSelectionModal.tsx`
- `LocationSelectionModal.tsx`
- `ServiceSelectionModal.tsx`
- `SessionTypeSelectionModal.tsx`
- `SimplifiedPatientOnboarding.tsx`

### 3. Consultant Filtering Logic Fixed

#### For Online Bookings (new-user-online):
Consultants are now filtered with the following criteria:
- `allowOnlineBooking` must be `true`
- `allowOnlineDelivery` must be `'ONLINE'` OR `'BOTH'`
- `designation` must be `'Physiotherapist'`

#### For Offline Bookings (new-user-offline):
Consultants are now filtered with the following criteria:
- `allowOnlineBooking` must be `true`
- `allowOnlineDelivery` must be `'OFFLINE'`
- `designation` must be `'Physiotherapist'`

### 4. Updated Slot Selection Components

#### NewUserOnlineSlotSelection.tsx
- Now has its own implementation (no longer wraps PrepaidSlotSelection)
- Implements proper consultant filtering for online bookings
- Only shows Physiotherapists with online delivery capability

#### NewUserOfflineSlotSelection.tsx
- Now has its own implementation (no longer wraps PrepaidSlotSelection)
- Implements proper consultant filtering for offline bookings
- Only shows Physiotherapists with offline delivery capability

### 5. Import Updates
All files that were importing from `redesign` folder have been updated to import from `shared`:
- `PrepaidSlotSelection.tsx`
- `PrepaidSessionDetails.tsx`
- `NewUserOnlineSessionDetails.tsx`
- `NewUserOfflineSessionDetails.tsx`
- `RepeatUserOnlineSessionDetails.tsx`
- `RepeatUserOfflineSessionDetails.tsx`
- `RepeatUserIncenterSessionDetails.tsx`
- `SimplifiedPatientOnboarding.tsx` (in redesign, now moved)

### 6. Shared Index Exports Updated
The `/components/onboarding/shared/index.ts` file now exports:
- All previous shared components
- ConsultantSelectionModal
- LocationSelectionModal
- ServiceSelectionModal
- SessionTypeSelectionModal
- SimplifiedPatientOnboarding

## Backend Schema Reference

### Consultant Model Fields
```typescript
{
  allowOnlineBooking: Boolean,
  allowOnlineDelivery: 'ONLINE' | 'OFFLINE' | 'BOTH',
  designation: String,
  // ... other fields
}
```

## Testing Checklist

### Online Booking Flow
- [ ] Verify only Physiotherapists with ONLINE or BOTH delivery mode are shown
- [ ] Verify slot availability shows correct consultants
- [ ] Verify booking completes successfully

### Offline Booking Flow
- [ ] Verify only Physiotherapists with OFFLINE delivery mode are shown
- [ ] Verify slot availability shows correct consultants
- [ ] Verify booking completes successfully

### Prepaid Booking Flow
- [ ] Verify prepaid flow still works correctly
- [ ] Verify consultant selection modal works

### Repeat User Flows
- [ ] Verify repeat user online booking works
- [ ] Verify repeat user offline booking works
- [ ] Verify repeat user in-center booking works

## Files Modified

### New Files Created
1. `/components/onboarding/shared/ConsultantSelectionModal.tsx`
2. `/components/onboarding/shared/LocationSelectionModal.tsx`
3. `/components/onboarding/shared/ServiceSelectionModal.tsx`
4. `/components/onboarding/shared/SessionTypeSelectionModal.tsx`
5. `/components/onboarding/shared/SimplifiedPatientOnboarding.tsx`

### Files Modified
1. `/components/onboarding/shared/index.ts`
2. `/components/onboarding/new-user-online/NewUserOnlineSlotSelection.tsx`
3. `/components/onboarding/new-user-offline/NewUserOfflineSlotSelection.tsx`
4. `/components/onboarding/new-user-online/NewUserOnlineSessionDetails.tsx`
5. `/components/onboarding/new-user-offline/NewUserOfflineSessionDetails.tsx`
6. `/components/onboarding/prepaid/PrepaidSlotSelection.tsx`
7. `/components/onboarding/prepaid/PrepaidSessionDetails.tsx`
8. `/components/onboarding/repeat-user-online/RepeatUserOnlineSessionDetails.tsx`
9. `/components/onboarding/repeat-user-offline/RepeatUserOfflineSessionDetails.tsx`
10. `/components/onboarding/repeat-user-incenter/RepeatUserIncenterSessionDetails.tsx`

### Folders Deleted
1. `/components/onboarding/redesign/` (entire folder removed)

## Key Improvements

1. **Cleaner Architecture**: Removed the redesign folder and consolidated reusable components in shared
2. **Proper Consultant Filtering**: Fixed the logic to correctly filter consultants based on delivery mode
3. **Designation Filtering**: Added Physiotherapist-only filtering for new bookings
4. **Separation of Concerns**: Online and offline slot selections now have their own implementations
5. **Consistent Imports**: All components now import from a single shared location

## Notes

- The PrepaidSlotSelection component still uses the old filtering logic (ONLINE or BOTH) as it's for prepaid bookings
- All session details components continue to work with the shared modals
- The SimplifiedPatientOnboarding component is now in shared and can be reused across different flows
