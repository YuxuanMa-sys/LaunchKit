# LaunchKit AI

**LaunchKit AI** — A production-grade starter for AI apps with usage-based billing (per token/job), orgs & RBAC, feature flags, audit logs, API keys, signed webhooks, and observability. Plug in any model/API and charge by usage.

## 🎯 What You Get

- 🏢 **Multi-tenant Organizations** with role-based access control (Owner/Admin/Member)
- 🔑 **API Key Management** - secure, hashed keys with prefix display and usage tracking
- 💳 **Usage-Based Billing** - Stripe integration with metered billing (tokens/jobs)
- 🚀 **Async Job Processing** - BullMQ workers for AI workloads
- 📊 **Usage Analytics** - Track tokens, jobs, costs with CSV exports
- 🔐 **Audit Logs** - Complete audit trail for compliance
- 🪝 **Outbound Webhooks** - Signed webhooks with automatic retries
- 🚦 **Rate Limiting** - Redis-backed token bucket per API key
- 📈 **Observability** - OpenTelemetry integration with Grafana/Prometheus
- 🎚️ **Feature Flags** - Plan-based feature gating (FREE/PRO/ENTERPRISE)

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Clients                                                     │
│  ├─ Next.js Dashboard (users manage orgs, billing, usage)  │
│  └─ Third-party API calls (your customers' servers)        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Edge Layer                                                  │
│  CloudFront (static) → API Gateway / Nginx                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend (NestJS)                                           │
│  ├─ Auth Module (JWT, Clerk/NextAuth)                      │
│  ├─ Orgs Module (multi-tenancy, membership)                │
│  ├─ API Keys Module (create, revoke, verify)               │
│  ├─ Billing Module (Stripe, usage metering)                │
│  ├─ Jobs Module (queue, status, results)                   │
│  ├─ Webhooks Module (outbound, retries)                    │
│  ├─ Audit Module (logs, search)                            │
│  └─ Usage Module (metering, analytics)                     │
└─────────────────────────────────────────────────────────────┘
         ↓                    ↓                    ↓
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │   Stripe     │
│  (Prisma)    │    │ (rate limit, │    │  (billing)   │
│              │    │  queues)     │    │              │
└──────────────┘    └──────────────┘    └──────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Workers (BullMQ)                                           │
│  ├─ AI Job Processor (run AI, track tokens)                │
│  ├─ Webhook Delivery Worker (retries, DLQ)                 │
│  └─ Billing Sync Worker (nightly usage → Stripe)           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Storage & Observability                                    │
│  ├─ S3 (CSV exports)                                        │
│  ├─ OpenTelemetry → Grafana/Prometheus/Loki                │
│  └─ Sentry (error tracking)                                │
└─────────────────────────────────────────────────────────────┘
```

## 📦 Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Shadcn/ui
- **Backend**: NestJS, Prisma ORM, PostgreSQL
- **Queue**: BullMQ, Redis
- **Auth**: Clerk or NextAuth.js
- **Billing**: Stripe (subscriptions + metered usage)
- **Storage**: AWS S3
- **Observability**: OpenTelemetry, Grafana, Prometheus, Sentry
- **Infra**: Terraform (optional), Docker

## 🗂️ Project Structure

```
/LaunchKit
├── /app                    # Next.js dashboard (TypeScript)
│   ├── /(auth)            # Auth routes (login, signup)
│   ├── /(dashboard)       # Main dashboard routes
│   │   ├── /dashboard     # Overview KPIs
│   │   ├── /usage         # Usage analytics & charts
│   │   ├── /billing       # Plans, invoices, payment
│   │   ├── /members       # Team management
│   │   ├── /api-keys      # API key CRUD
│   │   ├── /webhooks      # Webhook endpoints
│   │   ├── /audit         # Audit logs
│   │   └── /jobs          # Job history
│   ├── /components        # React components
│   │   ├── /ui            # Shadcn components
│   │   ├── /charts        # Usage charts
│   │   └── /guards        # Auth/plan guards
│   └── /lib               # Utils, API client, auth
│
├── /api                    # NestJS REST API (TypeScript)
│   ├── /src
│   │   ├── /modules
│   │   │   ├── /auth      # JWT verification, guards
│   │   │   ├── /orgs      # Organization CRUD
│   │   │   ├── /members   # Membership management
│   │   │   ├── /apikeys   # API key lifecycle
│   │   │   ├── /billing   # Stripe integration
│   │   │   ├── /jobs      # Job queue/status API
│   │   │   ├── /webhooks  # Outbound webhooks
│   │   │   ├── /usage     # Usage metering
│   │   │   ├── /audit     # Audit logging
│   │   │   └── /flags     # Feature flags
│   │   ├── /infra
│   │   │   ├── /prisma    # Prisma client
│   │   │   ├── /redis     # Redis client
│   │   │   ├── /stripe    # Stripe service
│   │   │   ├── /s3        # S3 service
│   │   │   └── /otel      # OpenTelemetry setup
│   │   └── /common
│   │       ├── /guards    # Auth guards
│   │       ├── /decorators
│   │       └── /filters   # Exception filters
│   └── /prisma
│       └── schema.prisma  # Database schema
│
├── /workers                # Background workers
│   ├── /jobs              # AI job processor
│   ├── /webhooks          # Webhook delivery
│   └── /billing           # Stripe sync worker
│
├── /infra                  # Infrastructure as code
│   ├── /terraform         # AWS resources
│   └── /k8s               # Kubernetes manifests
│
├── /scripts                # Utility scripts
│   ├── seed.ts            # Seed demo data
│   ├── stripe-setup.ts    # Bootstrap Stripe products
│   └── migrate.ts         # Migration runner
│
├── /tests                  # Tests
│   ├── /unit              # Unit tests
│   ├── /integration       # Integration tests
│   └── /e2e               # Playwright E2E
│
├── /ops                    # Operations
│   ├── dashboards.json    # Grafana dashboards
│   └── runbooks/          # Incident runbooks
│
├── package.json           # Monorepo root
├── turbo.json             # Turborepo config
├── docker-compose.yml     # Local dev services
└── .env.example           # Environment variables
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker & Docker Compose
- PostgreSQL 14+
- Redis 7+
- Stripe account (test mode)

### 1. Clone and Install

```bash
git clone <your-repo>
cd LaunchKit
pnpm install
```

### 2. Start Local Services

```bash
docker-compose up -d  # Starts Postgres, Redis
```

### 3. Configure Environment

```bash
# Copy environment templates
cp .env.example api/.env
cp .env.example app/.env.local

# Edit api/.env with:
# - DATABASE_URL (PostgreSQL on port 5433)
# - REDIS_URL
# - JWT_SECRET (generate a random string)
# - STRIPE_SECRET_KEY (from https://dashboard.stripe.com)

# Edit app/.env.local with:
# - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (from https://dashboard.clerk.com)
# - CLERK_SECRET_KEY (from https://dashboard.clerk.com)
# - NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Important**: Get your Clerk keys:
1. Sign up at https://clerk.com
2. Create a new application
3. Copy your keys to `app/.env.local`
4. See `app/CLERK_SETUP.md` for detailed instructions

### 4. Set Up Database

```bash
cd api
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma db seed
```

### 5. Bootstrap Stripe (Optional)

```bash
cd scripts
pnpm tsx stripe-setup.ts  # Creates products/prices
```

### 6. Start Dev Servers

```bash
# From root directory:
pnpm dev  # Starts both API (3001) and Dashboard (3000)

# Or start individually:
# Terminal 1: API
cd api
pnpm dev

# Terminal 2: Dashboard
cd app
pnpm dev

# Terminal 3: Workers
cd workers
pnpm dev
```

Visit http://localhost:3000 for the dashboard.

## 🔧 Environment Variables

Create `.env` files in each package:

### `/api/.env`

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/launchkit"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="your-jwt-secret-min-32-chars"
JWT_ISSUER="https://auth.launchkit.ai"
CLERK_SECRET_KEY="sk_test_..."  # or NEXTAUTH_SECRET

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# AWS S3
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
S3_BUCKET="launchkit-exports"

# Observability
OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
SENTRY_DSN="https://..."

# App
NODE_ENV="development"
API_URL="http://localhost:3001"
DASHBOARD_URL="http://localhost:3000"
```

### `/app/.env.local`

```bash
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

## 📊 Data Model

### Core Entities

- **User** - Individual user accounts
- **Org** - Organizations (billing entities)
- **Membership** - User↔Org relationship with roles (OWNER/ADMIN/MEMBER)
- **ApiKey** - Customer API keys (hashed, prefix-based)
- **Plan** - Billing plans (FREE/PRO/ENTERPRISE)

### Billing & Usage

- **UsageMeter** - Token/job usage per org (hourly windows)
- **StripeEvent** - Webhook event log (idempotent processing)
- **InvoiceShadow** - Local invoice snapshots

### Features

- **Job** - Async AI jobs (queue → process → result)
- **FeatureFlag** - Plan-based feature gates
- **AuditLog** - Compliance audit trail
- **WebhookEndpoint** - Customer webhook URLs
- **WebhookDelivery** - Delivery attempts with retries

See `/api/prisma/schema.prisma` for full schema.

## 🔑 Public API

Your customers call these endpoints with API keys.

### Authentication

```bash
Authorization: Bearer lk_live_pk_abc123...
```

### Endpoints

```
POST   /v1/jobs/summarize        # Create AI job
GET    /v1/jobs/:id              # Get job status
POST   /v1/embeddings            # Sync embeddings
GET    /v1/usage                 # Current usage
GET    /v1/rate-limit            # Quota info
```

### Example: Create Job

```bash
curl -X POST https://api.launchkit.ai/v1/jobs/summarize \
  -H "Authorization: Bearer lk_live_pk_abc..." \
  -H "Idempotency-Key: 2f7b8f2e-9c1d-4e8f-b3a7-1d2e3f4g5h6i" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Long article text here...",
    "tone": "brief"
  }'

# Response
{
  "id": "job_1q2w3e4r",
  "status": "QUEUED",
  "estimated_tokens": 312
}
```

### Idempotency

All mutations accept `Idempotency-Key` header. Duplicate requests return cached response with `Idempotent-Replay: true`.

### Rate Limiting

Token bucket per API key:
- **FREE**: 60 req/min
- **PRO**: 300 req/min
- **ENTERPRISE**: Custom

## 💳 Billing Model

### Plans

| Plan | Monthly Price | Included Tokens | Overage (per 1k) | Seats |
|------|--------------|-----------------|------------------|-------|
| FREE | $0 | 50,000 | N/A (hard limit) | 3 |
| PRO | $49 | 5,000,000 | $0.02 | 10 |
| ENTERPRISE | Custom | Custom | Custom | Unlimited |

### Usage Calculation

```typescript
cost = basePlanPrice + max(0, (tokens - includedTokens) / 1000) * overagePer1kTokens
```

### Stripe Integration

- **Subscriptions**: Monthly recurring for plan
- **Metered Billing**: Usage Records API for token overages
- **Invoices**: Auto-generated monthly with usage line items

## 🪝 Outbound Webhooks

LaunchKit sends events to your customers' servers.

### Event Types

- `job.succeeded` - AI job completed
- `job.failed` - Job failed
- `usage.updated` - Usage threshold crossed
- `member.invited` - New team member

### Signature Verification

```http
X-LK-Signature: t=1631234567,v1=5d2a8f9e...
```

Verify with HMAC-SHA256 of request body + webhook secret.

### Retries

Failed deliveries retry with exponential backoff (up to 24h). View/retry in dashboard.

## 🎚️ Feature Flags

Plan-based feature gating:

```typescript
// FREE plan restrictions
- Max 1 API key
- Max 3 members
- No realtime streaming
- 50k token hard limit

// PRO unlocks
- 5 API keys
- 10 members
- Realtime streaming
- 5M included tokens + overage

// ENTERPRISE
- Unlimited everything
- Custom contracts
```

Enforce server-side; show upgrade prompts in UI.

## 📈 Observability

### OpenTelemetry

All requests traced with:
- `request_id` - Unique request ID
- `org_id` - Organization context
- `api_key_prefix` - Masked key

### Key Metrics

- `jobs_latency_ms` (p50/p95/p99)
- `jobs_error_rate`
- `webhook_retry_count`
- `rate_limited_requests`
- `stripe_sync_lag_seconds`

### SLOs

- **Jobs**: p95 ≤ 5s for 95% of requests
- **API Availability**: ≥ 99.9%
- **Webhook Delivery**: 99% within 5min

## 🧪 Testing

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests (Playwright)
pnpm test:e2e

# Load testing (k6)
cd tests/load
k6 run jobs-test.js
```

## 🗺️ Roadmap

### Milestone 1: Core Foundations ✅
- [x] Monorepo setup
- [x] Prisma schema
- [x] Auth (Clerk/NextAuth)
- [x] API keys
- [x] Audit logs
- [x] Rate limiting

### Milestone 2: Billing 🚧
- [ ] Stripe products/prices
- [ ] Webhook handlers
- [ ] Usage metering
- [ ] Billing dashboard

### Milestone 3: Jobs & Usage 📅
- [ ] Job queue API
- [ ] BullMQ workers
- [ ] Usage analytics
- [ ] CSV exports

### Milestone 4: Webhooks & DX 📅
- [ ] Outbound webhooks
- [ ] Delivery UI
- [ ] OpenAPI spec
- [ ] Demo script

### Milestone 5: Hardening 📅
- [ ] SLO dashboards
- [ ] E2E tests
- [ ] Load testing
- [ ] Security audit

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development workflow.

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🆘 Support

- 📖 [Documentation](https://docs.launchkit.ai)
- 💬 [Discord Community](https://discord.gg/launchkit)
- 🐛 [Issue Tracker](https://github.com/your-org/launchkit/issues)

---

Built with ❤️ for developers who want to ship AI products fast.

