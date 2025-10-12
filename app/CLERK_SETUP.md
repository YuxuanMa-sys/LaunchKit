# Clerk Authentication Setup Guide

This guide shows how to configure Clerk authentication for LaunchKit.

## Step 1: Create a Clerk Account

1. Go to https://clerk.com
2. Sign up for a free account
3. Create a new application

## Step 2: Get API Keys

1. In the Clerk Dashboard, go to **API Keys**
2. Copy the following:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (starts with `pk_test_`)
   - `CLERK_SECRET_KEY` (starts with `sk_test_`)

## Step 3: Configure Environment Variables

Create `app/.env.local`:

```bash
# Clerk Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Step 4: Configure Clerk Settings

### A. Configure URLs

In Clerk Dashboard → **Paths**:

- **Sign-in URL**: `/sign-in`
- **Sign-up URL**: `/sign-up`
- **After sign-in**: `/dashboard`
- **After sign-up**: `/dashboard`

### B. Enable Email/Password

In Clerk Dashboard → **User & Authentication** → **Email, Phone, Username**:

- ✅ Enable **Email address**
- ✅ Enable **Password**

### C. Configure Allowed Redirect URLs

In Clerk Dashboard → **Domains**:

Add these URLs:
- `http://localhost:3000`
- `http://localhost:3000/dashboard`

## Step 5: Set Up User Sync Webhook (Optional)

To sync Clerk users to your LaunchKit database:

1. Go to Clerk Dashboard → **Webhooks**
2. Click **Add Endpoint**
3. **Endpoint URL**: `http://localhost:3000/api/webhooks/clerk` (or your production URL)
4. **Subscribe to events**:
   - ✅ `user.created`
   - ✅ `user.updated`
   - ✅ `user.deleted`
5. Copy the **Signing Secret** (starts with `whsec_`)
6. Add to `.env.local`:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

## Step 6: Test Authentication

1. Start the dev server:
   ```bash
   cd app
   pnpm dev
   ```

2. Visit http://localhost:3000
3. Click **Sign In**
4. Create a test account
5. You should be redirected to `/dashboard`

## What's Configured

### ✅ Protected Routes

All `/dashboard/*` routes are protected. Users must sign in to access them.

### ✅ Sign In/Sign Up Pages

- **Sign In**: http://localhost:3000/sign-in
- **Sign Up**: http://localhost:3000/sign-up

### ✅ User Button

The dashboard header shows a user button with:
- Profile picture
- Account settings
- Sign out

### ✅ API Integration

The Axios client automatically adds Clerk JWT tokens to API requests:

```typescript
// Automatically adds: Authorization: Bearer <clerk_jwt>
await api.orgs.list();
```

### ✅ User Sync

Clerk webhooks sync user data to your database:
- Creates user on sign-up
- Updates user on profile changes
- Handles user deletion

## Backend Integration

Update your NestJS API to verify Clerk JWTs:

```typescript
// api/src/modules/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Clerk's JWKS URL for verification
      secretOrKeyProvider: async (request, rawJwtToken, done) => {
        // Use Clerk's JWKS endpoint
        // https://clerk.com/docs/backend-requests/handling/nodejs
        done(null, process.env.CLERK_SECRET_KEY);
      },
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

## Troubleshooting

### "Clerk is not defined" Error

Make sure `ClerkProvider` wraps your app in `app/src/app/layout.tsx`.

### Redirects Not Working

Check that your URLs in Clerk Dashboard match exactly:
- Sign-in URL: `/sign-in`
- Sign-up URL: `/sign-up`

### Webhook Not Receiving Events

For local development:
1. Install Clerk CLI: `npm install -g @clerk/clerk-cli`
2. Forward webhooks: `clerk listen --forward-url http://localhost:3000/api/webhooks/clerk`

### JWT Not Added to API Requests

Check browser console for errors. The token is fetched from `window.Clerk.session`.

## Production Deployment

1. Update Clerk Dashboard with production URLs
2. Set environment variables in Vercel/deployment platform
3. Configure webhook endpoint with production URL
4. Test authentication flow

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Next.js Guide](https://clerk.com/docs/quickstarts/nextjs)
- [Clerk Webhooks](https://clerk.com/docs/integrations/webhooks)

