# Deployment Guide for Stance Booking

## Prerequisites

- Node.js 18+ installed
- Access to your hosting platform (Vercel/AWS/etc.)
- Domain `book.stance.health` configured

## Option 1: Vercel Deployment (Recommended)

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
```bash
cd /Users/sandeepv/Desktop/Healthflex/stance-booking
vercel --prod
```

### Step 4: Configure Environment Variables in Vercel Dashboard
1. Go to your project settings
2. Add environment variables:
   - `NEXT_PUBLIC_GRAPHQL_API_URL`
   - `NEXT_PUBLIC_DEFAULT_CENTER_ID`
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`

### Step 5: Configure Custom Domain
1. In Vercel project settings → Domains
2. Add `book.stance.health`
3. Update DNS records as instructed by Vercel

---

## Option 2: AWS Deployment

### Using AWS Amplify

1. Push code to GitHub/GitLab
2. Connect repository to AWS Amplify
3. Configure build settings:
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```
4. Add environment variables in Amplify console
5. Configure custom domain `book.stance.health`

### Using EC2 + PM2

1. SSH into EC2 instance
2. Install Node.js and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pm2
   ```

3. Clone and setup:
   ```bash
   cd /var/www
   git clone your-repo
   cd stance-booking
   npm install
   npm run build
   ```

4. Create `.env` file with production values

5. Start with PM2:
   ```bash
   pm2 start npm --name "stance-booking" -- start
   pm2 save
   pm2 startup
   ```

6. Configure Nginx:
   ```nginx
   server {
       listen 80;
       server_name book.stance.health;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. Setup SSL with Let's Encrypt:
   ```bash
   sudo certbot --nginx -d book.stance.health
   ```

---

## Option 3: Docker Deployment

### Step 1: Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Step 2: Build and Run
```bash
docker build -t stance-booking .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_GRAPHQL_API_URL=https://api.stance.health/graphql \
  -e NEXT_PUBLIC_DEFAULT_CENTER_ID=your_id \
  -e NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key \
  stance-booking
```

---

## DNS Configuration

Point `book.stance.health` to your deployment:

### For Vercel:
- Add CNAME record: `book` → `cname.vercel-dns.com`

### For AWS/Custom Server:
- Add A record: `book` → Your server IP
- Or CNAME: `book` → Your load balancer DNS

---

## Post-Deployment Checklist

- [ ] Test all booking flows
- [ ] Verify GraphQL API connection
- [ ] Test payment integration
- [ ] Check email notifications
- [ ] Test on mobile devices
- [ ] Verify SSL certificate
- [ ] Setup monitoring/logging
- [ ] Configure error tracking (Sentry)

---

## Monitoring

### Setup Health Check Endpoint
Create `/api/health/route.ts`:
```typescript
export async function GET() {
  return Response.json({ status: 'ok', timestamp: new Date().toISOString() });
}
```

### Monitor with:
- Vercel Analytics (if using Vercel)
- AWS CloudWatch (if using AWS)
- UptimeRobot for uptime monitoring
- Sentry for error tracking
