# LaunchKit AI - API Server

NestJS-based REST API with Prisma ORM for PostgreSQL.

## 📊 Database Schema

The Prisma schema defines 15 core models:

### Core Entities
- **User** - Individual user accounts
- **Org** - Organizations (billing entities)
- **Membership** - User↔Org relationships with roles (OWNER/ADMIN/MEMBER)

### API & Security
- **ApiKey** - Hashed API keys with prefix display
- **RateLimitBucket** - Token bucket rate limiting
- **IdempotencyKey** - Request deduplication (24h TTL)

### Billing
- **Plan** - Billing plans (FREE/PRO/ENTERPRISE)
- **UsageMeter** - Hourly token/job usage tracking
- **StripeEvent** - Idempotent Stripe webhook processing
- **InvoiceShadow** - Local invoice snapshots

### Jobs & Features
- **Job** - Async AI workload queue
- **FeatureFlag** - Plan-based feature gates

### Webhooks & Audit
- **WebhookEndpoint** - Customer webhook URLs
- **WebhookDelivery** - Delivery attempts with retries
- **AuditLog** - Compliance audit trail

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

### 3. Run Migrations

```bash
pnpm prisma:migrate
```

### 4. Seed Demo Data

```bash
pnpm prisma:seed
```

This creates:
- 4 demo users
- 2 orgs (1 FREE, 1 PRO)
- API keys for testing
- 100 historical jobs
- Usage meters for last 7 days
- Webhook endpoints with failed delivery

### 5. Start Dev Server

```bash
pnpm dev
```

API will be available at http://localhost:3001

## 📖 Prisma Commands

```bash
# Generate Prisma Client
pnpm prisma:generate

# Create a new migration
pnpm prisma:migrate

# Open Prisma Studio (visual database editor)
pnpm prisma:studio

# Reset database (WARNING: deletes all data)
pnpm prisma migrate reset
```

## 🗄️ Database Indexes

Optimized indexes for common queries:

```sql
-- High-traffic queries
ApiKey(orgId, prefix, revokedAt)
AuditLog(orgId, createdAt DESC)
Job(orgId, status)
UsageMeter(orgId, windowStart, windowEnd)

-- Webhook processing
WebhookDelivery(status, nextAttemptAt)

-- Rate limiting
RateLimitBucket(scope, key)
```

## 📝 Key Design Decisions

### API Key Storage
- Full key is **bcrypt hashed** (never stored plaintext)
- **Prefix** stored separately for display (`lk_live_pk_abc...`)
- Customers see full key **once** on creation

### Usage Metering
- **Hourly windows** for granular tracking
- Nightly worker aggregates to Stripe
- Shadow accounting for billing disputes

### Idempotency
- 24-hour TTL on idempotency keys
- Stores full response for replay
- Prevents duplicate charges

### Rate Limiting
- Token bucket algorithm in Redis
- Per API key, user, org, or IP
- Plan-based rate limits

## 🔐 Security Features

- All timestamps are UTC
- Soft deletes where needed (revokedAt)
- Cascade deletes for org cleanup
- Foreign key constraints enforced
- Input validation with Zod/class-validator

## 📚 Next Steps

After schema setup:
1. Generate Prisma Client: `pnpm prisma:generate`
2. Build NestJS modules (auth, orgs, jobs, etc.)
3. Add OpenAPI/Swagger docs
4. Set up BullMQ workers

