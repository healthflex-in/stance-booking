# Onboarding Components Structure

This directory contains all booking/onboarding flow components organized by functionality.

## Folder Structure

### `/new-user-online`
Components for new users booking online consultations with payment functionality.
- `NewUserOnlineCenterSelection` - Center selection for online bookings
- `NewUserOnlineServiceSelection` - Service selection with email capture
- `NewUserOnlineSlotSelection` - Slot booking (wraps PrepaidSlotSelection)
- `NewUserOnlinePaymentConfirmation` - Payment screen with amount input
- `NewUserOnlineBookingConfirmed` - Confirmation screen with email sending

**Key Features:**
- Filters services with: `allowOnlineBooking && allowOnlineDelivery && isNewUserService && !isPrePaid`
- Payment logic: Full amount → Invoice, Partial amount → Package
- Automatic email sending to patient and consultant

### `/prepaid`
Components for prepaid service bookings (both new and repeat users).
- `PrepaidCenterSelection` - Center selection for prepaid services
- `PrepaidServiceSelection` - Service selection filtered by `isPrePaid=true`
- `PrepaidConsultantSelection` - Consultant selection (skipped for new users)
- `PrepaidSlotSelection` - Slot booking with consultant filtering
- `PrepaidBookingConfirmed` - Confirmation screen for prepaid bookings

**Key Features:**
- Filters services with: `isPrePaid=true`
- Skips consultant selection for new users
- Direct booking without payment

### `/regular`
Components for regular booking flow (in-center and online for repeat users).
- `MobileBookingFlow` - Main booking flow orchestrator
- `MobileCenterSelection` - Center selection with location display
- `MobileSessionSelection` - Session type selection (online/in-person)
- `MobileSessionDetails` - Date and time slot selection
- `MobileBookingConfirmation` - Booking review and payment
- `MobileBookingConfirmed` - Final confirmation screen

**Key Features:**
- Supports both online and in-center bookings
- Handles payment processing via Razorpay
- Analytics tracking throughout the flow

### `/shared`
Reusable components used across all booking flows.
- `MobilePatientOnboarding` - Patient verification/creation
- `MobilePaymentProcessing` - Razorpay payment integration
- `MobilePaymentSuccess` - Payment success screen
- `MobileLoadingScreen` - Loading animation component
- `LeadDetectionModal` - Lead detection functionality
- `WhatsAppButton` - WhatsApp support button
- `Popup` - Generic popup component

## Usage

Import components using the barrel exports:

```typescript
// New user online flow
import {
  NewUserOnlineCenterSelection,
  NewUserOnlineServiceSelection,
  // ...
} from '@/components/onboarding/new-user-online';

// Prepaid flow
import {
  PrepaidCenterSelection,
  PrepaidServiceSelection,
  // ...
} from '@/components/onboarding/prepaid';

// Regular flow
import {
  MobileBookingFlow,
  MobileCenterSelection,
  // ...
} from '@/components/onboarding/regular';

// Shared components
import {
  MobilePatientOnboarding,
  MobilePaymentProcessing,
  // ...
} from '@/components/onboarding/shared';

// Or import everything
import { ... } from '@/components/onboarding';
```

## Service Filtering Logic

### New User Online
- `allowOnlineBooking === true`
- `allowOnlineDelivery === true`
- `isNewUserService === true`
- `isPrePaid === false`

### Prepaid
- `isPrePaid === true`

### Regular
- No specific filtering (uses all available services)

## Center Filtering Logic

### New User Online & Prepaid
- `allowOnlineBooking === true` OR `isOnline === true`

### Regular
- All centers available

## Consultant Filtering Logic

### New User Online
- `allowOnlineBooking === true`
- `allowOnlineDelivery === 'ONLINE'` OR `'BOTH'`

### Prepaid (New Users)
- Consultant selection skipped
- Random consultant assigned from available slots

### Regular
- All consultants available based on center
