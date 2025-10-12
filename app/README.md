# LaunchKit AI - Dashboard

Next.js 14 dashboard application for managing AI applications.

## Features

- 📊 **Dashboard**: Real-time KPIs for tokens, jobs, and costs
- 🔑 **API Keys**: Create, manage, and revoke API keys
- 📈 **Usage Analytics**: Track token usage and job history
- 💳 **Billing**: Manage subscriptions and view invoices
- 👥 **Team Management**: Invite members with RBAC
- 🪝 **Webhooks**: Configure outbound webhooks
- 📝 **Audit Logs**: Complete activity trail

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Auth**: Clerk (or NextAuth)
- **API Client**: Axios
- **Charts**: Recharts
- **State**: React Query

## Getting Started

### 1. Install Dependencies

```bash
cd app
pnpm install
```

### 2. Configure Environment

```bash
cp .env.local.example .env.local
# Edit .env.local with your values
```

### 3. Start Dev Server

```bash
pnpm dev
```

Dashboard will be available at http://localhost:3000

## Project Structure

```
app/
├── src/
│   ├── app/                    # App Router pages
│   │   ├── page.tsx            # Landing page
│   │   ├── layout.tsx          # Root layout
│   │   └── dashboard/          # Dashboard routes
│   │       ├── layout.tsx      # Dashboard layout with nav
│   │       ├── page.tsx        # Dashboard home
│   │       ├── api-keys/       # API key management
│   │       ├── usage/          # Usage analytics
│   │       └── billing/        # Billing & plans
│   ├── components/             # React components
│   │   └── ui/                 # Shadcn/ui components
│   └── lib/                    # Utilities
│       └── api.ts              # API client
├── public/                     # Static assets
└── package.json
```

## Pages

### Landing Page (`/`)
- Hero section with product overview
- Feature highlights
- Link to dashboard
- GitHub link

### Dashboard (`/dashboard`)
- KPI cards (tokens, jobs, cost, API keys)
- Recent activity feed
- Quick actions

### API Keys (`/dashboard/api-keys`)
- List all API keys with prefixes
- Create new API key (show once)
- Revoke API keys
- Last used timestamps

### Usage (`/dashboard/usage`)
- Summary cards (tokens, jobs, cost)
- Usage charts over time (Recharts)
- Job history table
- Export to CSV

### Billing (`/dashboard/billing`)
- Current plan details
- Usage progress bar
- Plan comparison cards
- Stripe customer portal link

## Next Steps

### To Be Implemented:

1. **Authentication**
   - Integrate Clerk SDK
   - Protect dashboard routes
   - User profile menu

2. **Real API Integration**
   - Connect to NestJS API
   - Replace mock data with real queries
   - Add React Query for data fetching

3. **Advanced Features**
   - Usage charts with Recharts
   - CSV export functionality
   - Real-time updates with WebSockets
   - Team member management
   - Webhook configuration UI
   - Audit log viewer

4. **UI Polish**
   - Add Shadcn/ui components
   - Loading states
   - Error handling
   - Toast notifications
   - Modal dialogs

## Environment Variables

```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Deployment

Deploy to Vercel:

```bash
vercel deploy
```

Set environment variables in Vercel dashboard.

