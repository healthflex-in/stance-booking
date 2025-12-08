# Quick Start Guide

## Setup & Run

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Update `.env` file** (already created):
   - Verify `NEXT_PUBLIC_GRAPHQL_API_URL` points to your backend
   - Update `NEXT_PUBLIC_DEFAULT_CENTER_ID` if needed
   - Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` for payments

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   - Go to `http://localhost:3000`
   - Will auto-redirect to `/book`

## What's Included

✅ All booking flows copied from dashboard:
- `/book` - Main booking page
- `/book/new-online` - New user online consultation
- `/book/repeat-online` - Repeat user online consultation  
- `/book/repeat-offline` - Repeat user in-center consultation
- `/book-prepaid` - Prepaid services

✅ All components:
- `src/components/onboarding/` - All booking components
- Shared, regular, prepaid, new-user-online, repeat-user-online, repeat-user-incenter

✅ GraphQL integration:
- Apollo Client configured
- All queries from dashboard
- Points to same backend API

✅ Utilities & Hooks:
- `useAvailableSlots` - Slot availability
- `useContainerDetection` - Mobile detection
- Apollo client setup

## Deploy to Production

**Vercel (Easiest):**
```bash
npm run build
vercel --prod
```

**Other platforms:**
```bash
npm run build
npm start
```

Then point `book.stance.health` DNS to your deployment.

## Notes

- Uses same backend GraphQL API as dashboard
- No authentication required (public routes)
- All payment, email, booking logic works as-is
- Completely standalone - no dashboard dependencies
