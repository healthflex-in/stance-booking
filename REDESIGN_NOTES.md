# Booking Flow Redesign - Implementation Notes

## Overview
This document outlines the redesigned booking flow based on the Figma designs provided. The new design streamlines the user experience and creates a more cohesive, modern interface.

## What's Been Created

### 1. New UI Atom Components (`components/ui-atoms/`)
Reusable components following the Figma design system:
- **SessionTypeCard** - Card component for selecting In Person/Online session types
- **SessionDetailItem** - Display component for session details with chevron navigation
- **DateSelector** - Horizontal scrollable date picker with slot counts
- **TimeSlotButton** - Time slot selection buttons
- **SelectionModal** - Bottom sheet modal for location/service/consultant selection
- **PrimaryButton** - Consistent primary action button
- **InfoBanner** - Info banner with icon (used for payment message)

### 2. Redesigned Booking Flow (`components/onboarding/redesign/`)
Complete booking flow with new UI:
- **SimplifiedPatientOnboarding** - Streamlined 2-step patient registration (phone → details)
- **NewBookingMain** - Single-page booking interface with:
  - Session type selection (In Person/Online)
  - Session details (Location, Service, Consultant)
  - Visit details (Date and time slot selection)
- **LocationSelectionModal** - Bottom sheet for selecting location/center
- **ServiceSelectionModal** - Bottom sheet for selecting service
- **ConsultantSelectionModal** - Bottom sheet for selecting consultant
- **BookingConfirmation** - Confirmation page with session details and payment options
- **BookingConfirmed** - Success page with booking details and "Things to bring" section

### 3. New Booking Page (`app/book-prepaid-new/page.tsx`)
Main entry point for the redesigned booking flow. This page orchestrates the entire booking journey:
- Patient onboarding
- Booking main (session selection & slots)
- Booking confirmation (payment)
- Booking confirmed (success)

## Design Specifications

### Color Palette
```css
Background Gradient: linear-gradient(180.01deg, #ECEDDC 12.25%, #DEF1F7 99.99%)
Primary Text: #1C1A4B
Secondary Text: rgba(28, 26, 75, 0.6)
Primary Button: #132644
Selected State: #2F2F32
Accent: #07F4A5
Border: rgba(28, 26, 75, 0.06)
```

### Typography
- Font Family: Poppins (primary), system fonts (fallback)
- Heading: 18px, font-weight: 500
- Body: 14px, font-weight: 500
- Small: 12px, font-weight: 500
- Extra Small: 11px, font-weight: 500

### Border Radius
- Cards: 16px
- Buttons: 10px
- Modals: 20px (top corners)

## Required Assets

### Doctor Images
You need to add two doctor images to the `public/` folder:
- **`doc.png`** - Image for "Online" session type (showing doctor on laptop screen)
- **`doc2.png`** - Image for "In Person" session type (showing doctor with stethoscope)

**Image Specifications:**
- Dimensions: 146px x 100px
- Format: PNG
- Border Radius: 10px (applied in component)

## Key Features

### 1. Simplified Patient Onboarding
- Phone verification first
- Minimal form fields (first name, last name, email, gender)
- Automatic detection of returning users
- No redundant information collection

### 2. All-in-One Booking Page
- Session type selection with visual cards
- Session details in collapsible sections
- Real-time slot availability
- Horizontal date scroll with slot counts
- Grid layout for time slots

### 3. Bottom Sheet Modals
- Native mobile feel
- Smooth animations
- Easy to dismiss
- Consistent design across all selection screens

### 4. Payment Options
- Online payment (UPI, Card, Netbanking)
- Package balance payment
- Clear pricing display
- INR 99 booking fee with adjustment note

### 5. Success Screen
- Clear confirmation message
- Complete booking details
- "Things to bring" checklist with emojis:
  - 👕 Workout clothes
  - 💧 Water bottle
  - 🧘 Towel
  - 🧘‍♀️ Yoga Mat

## Usage

### To Test the New Flow:
1. Navigate to `/book-prepaid-new`
2. Enter phone number (10 digits)
3. Complete profile (first name required)
4. Select session type (In Person/Online)
5. Select service from modal
6. Select date from horizontal scroller
7. Select time slot from grid
8. Review and confirm booking
9. Select payment method
10. View success screen

### To Replace Old Flow:
1. Update the route in `app/book-prepaid/page.tsx` to use the new components
2. Or redirect `/book-prepaid` to `/book-prepaid-new`

## Removed Components
The old `MobilePatientOnboarding` component with extensive form fields has been replaced with the streamlined `SimplifiedPatientOnboarding` component.

## Responsive Design
- Mobile-first design
- Desktop view: Centered modal with 90vh height, max-width 448px
- Smooth scrolling for date picker
- Fixed bottom buttons for easy access

## Next Steps
1. Add doctor images (`doc.png` and `doc2.png`) to the `public/` folder
2. Test the complete flow end-to-end
3. Integrate payment gateway for online payments
4. Add analytics tracking for the new flow
5. Consider adding animations for modal transitions

## Notes
- All components are TypeScript with proper type definitions
- No linting errors
- Follows Next.js 14+ conventions
- Uses Apollo Client for GraphQL queries
- Integrates with existing backend APIs

