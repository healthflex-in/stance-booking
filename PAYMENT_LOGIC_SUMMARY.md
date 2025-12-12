# Payment and Booking Logic Summary

## Payment Flow by Booking Type

### 1. New User - Online (`/book/new-online`)
- **Payment Type**: Full payment only (NO partial payments)
- **Flow**: Patient Onboarding → Session Details → Slot Selection → Payment Confirmation → Booking Confirmed
- **Status**: Appointment created with full payment
- **Implementation**: Uses `NewUserOnlinePaymentConfirmation` component

### 2. New User - Offline/In-Center (`/book/new-offline`)
- **Payment Type**: Partial payment allowed (invoice creation)
- **Flow**: Patient Onboarding → Session Details → Slot Selection → Payment Confirmation → Booking Confirmed
- **Status**: Appointment created with payment (can be partial)
- **Implementation**: Uses `NewUserOfflinePaymentConfirmation` component which supports invoice creation

### 3. Repeat User - Online (`/book/repeat-online`)
- **Payment Type**: Full payment only (NO partial payments)
- **Flow**: Session Details → Slot Selection → Payment Confirmation → Booking Confirmed
- **Status**: Appointment created with full payment
- **Implementation**: Uses `RepeatUserOnlinePaymentConfirmation` component

### 4. Repeat User - Offline/In-Center (`/book/repeat-offline`)
- **Payment Type**: NO PAYMENT (Skip payment step)
- **Flow**: Session Details → Slot Selection → Booking Confirmed
- **Status**: Appointment created with status `'BOOKED'` and `visitType: 'FOLLOW_UP'`
- **Implementation**: Creates appointment directly in `handleSlotSelect` function
- **Appointment Input**:
  ```typescript
  {
    patient: patientId,
    consultant: consultantId || null,
    treatment: treatmentId,
    medium: 'IN_PERSON',
    notes: '',
    center: centerId,
    category: 'WEBSITE',
    status: 'BOOKED',
    visitType: 'FOLLOW_UP',
    event: {
      startTime: slot.startTimeRaw (timestamp),
      endTime: slot.endTimeRaw (timestamp)
    }
  }
  ```

### 5. Prepaid Booking (`/book-prepaid`)
- **Payment Type**: Already paid (prepaid package)
- **Flow**: Session Details → Slot Selection → Booking Confirmed
- **Status**: Appointment created using prepaid credits
- **Implementation**: Uses prepaid package credits

## Invoice Creation (For Partial Payments)

### When to Create Invoice
- **Only for New User - Offline/In-Center bookings** when partial payment is selected

### Invoice Mutation
```graphql
mutation CreateInvoice($input: CreateInvoiceInput!) {
  createInvoice(input: $input) {
    _id
    invoiceNumber
    amount
    status
  }
}
```

### Invoice Input Structure
```typescript
{
  patient: patientId,
  appointment: appointmentId,
  items: [{
    description: treatmentName,
    quantity: 1,
    unitPrice: treatmentPrice,
    amount: treatmentPrice
  }],
  totalAmount: treatmentPrice,
  paidAmount: partialAmount,
  balanceAmount: treatmentPrice - partialAmount,
  status: 'PARTIAL',
  paymentMethod: 'ONLINE',
  center: centerId
}
```

## UseEffect Optimization

### Problem
Multiple useEffect hooks causing unnecessary re-renders

### Solution
Separate mount state from data fetching:

```typescript
// Mount effect - runs once
useEffect(() => {
  setMounted(true);
}, []);

// Data fetching effect - runs only when mounted changes
useEffect(() => {
  if (!mounted) return;
  
  const storedPatientId = sessionStorage.getItem('patientId');
  const storedCenterId = sessionStorage.getItem('centerId');
  
  if (storedPatientId && storedCenterId) {
    setBookingData(prev => ({
      ...prev,
      patientId: storedPatientId,
      centerId: storedCenterId,
    }));
    sessionStorage.removeItem('patientId');
    sessionStorage.removeItem('centerId');
  }
}, [mounted]);
```

## Appointment Status Values

- `'BOOKED'` - For repeat offline (in-center) bookings without payment
- `'CONFIRMED'` - For bookings with full payment
- `'PENDING'` - For bookings with partial payment (invoice created)

## Visit Type Values

- `'FOLLOW_UP'` - For repeat user bookings
- `'FIRST_VISIT'` - For new user bookings (default)

## Implementation Checklist

- [x] Repeat offline skips payment and creates appointment with status 'BOOKED'
- [x] UseEffect optimized to prevent re-renders
- [x] New online enforces full payment only (NO partial payments)
- [x] Repeat online enforces full payment only
- [ ] New offline supports partial payment with invoice creation
- [ ] Payment confirmation components handle different payment types correctly
