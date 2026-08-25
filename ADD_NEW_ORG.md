# How to Add a New Organization

## Step 1: Add Organization to Config

Edit `utils/booking-config.ts` and add your new organization:

```typescript
const ORGANIZATIONS: Record<string, OrganizationConfig> = {
  'stance-health': {
    id: '67fe35f25e42152fb5185a5e',
    name: 'Stance Health',
    slug: 'stance-health',
    defaultCenterId: '67fe36545e42152fb5185a6c',
  },
  
  // Add your new organization here:
  'your-org-slug': {
    id: 'your-org-id-from-database',
    name: 'Your Organization Name',
    slug: 'your-org-slug',
    defaultCenterId: 'your-default-center-id',
  },
};
```

## Step 2: That's It!

The routing system automatically handles all URLs for your new organization:

- `domain/your-org-slug` - Main booking page
- `domain/your-org-slug/new-online` - New user online booking
- `domain/your-org-slug/new-offline` - New user offline booking
- `domain/your-org-slug/repeat-online` - Repeat user online booking
- `domain/your-org-slug/repeat-offline` - Repeat user offline booking
- `domain/your-org-slug/prepaid` - Prepaid booking
- `domain/your-org-slug/prepaid/new` - New prepaid booking
- `domain/your-org-slug/prepaid/repeat` - Repeat prepaid booking

## Notes

- **Organization ID**: Get this from your database
- **Default Center ID**: This is used for initial patient creation only
- **Slug**: Use lowercase with hyphens (e.g., `my-clinic`, `health-center-mumbai`)
- All other data (centers, services, consultants, slots) is fetched dynamically from backend APIs

## How It Works

1. User visits `domain/your-org-slug`
2. System looks up the organization in `booking-config.ts`
3. Organization ID and default center ID are stored in cookies
4. Apollo Client sends these as HTTP headers (`x-organization-id`, `x-center-id`) to backend
5. Backend APIs filter data based on these headers
6. User sees only their organization's data

