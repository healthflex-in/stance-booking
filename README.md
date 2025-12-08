# Stance Booking System

Standalone booking application for Stance Health.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
- `NEXT_PUBLIC_GRAPHQL_API_URL` - Backend GraphQL API URL
- `NEXT_PUBLIC_DEFAULT_CENTER_ID` - Default center ID
- `NEXT_PUBLIC_RAZORPAY_KEY_ID` - Razorpay key for payments

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Routes

- `/` - Redirects to `/book`
- `/book` - Main booking flow (patient onboarding + session type selection)
- `/book/new-online` - New user online consultation booking
- `/book/repeat-online` - Repeat user online consultation booking
- `/book/repeat-offline` - Repeat user in-center consultation booking
- `/book-prepaid` - Prepaid services booking

## Deployment

### Vercel
```bash
npm run build
vercel --prod
```

### AWS/Other
```bash
npm run build
npm start
```

## Environment Variables for Production

```
NEXT_PUBLIC_GRAPHQL_API_URL=https://api.stance.health/graphql
NEXT_PUBLIC_DEFAULT_CENTER_ID=your_center_id
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key
```

## Features

- Patient verification via phone/email
- New user and repeat user flows
- Online and in-center consultation booking
- Service selection with filtering
- Consultant selection (for repeat users)
- Slot booking with availability
- Payment integration (Razorpay)
- Email notifications
- Prepaid services booking

## Tech Stack

- Next.js 15
- React 19
- TypeScript
- Apollo Client (GraphQL)
- Tailwind CSS
- Lucide Icons
- Sonner (Toast notifications)
