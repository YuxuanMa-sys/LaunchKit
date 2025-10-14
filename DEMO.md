# LaunchKit Platform Demo

## Overview

This demo showcases the complete LaunchKit AI platform, including all features we've built across 12 steps. The demo includes sample data, automated testing, and visual demonstrations of every component.

## Quick Start

### 1. Prerequisites

Ensure you have the following running:
- **API Server**: `cd api && pnpm dev` (port 3001)
- **Frontend**: `cd app && pnpm dev` (port 3000)
- **Redis**: `redis-server` (for queue functionality)
- **PostgreSQL**: Running with database created
- **Observability Stack** (optional): `docker compose -f docker-compose.observability.yml up -d`

### 2. Run the Demo

```bash
# Make the demo script executable (if not already)
chmod +x demo.sh

# Run the complete demo
./demo.sh
```

The demo script will:
- ✅ Check all services are running
- 🌱 Seed the database with sample data
- 🔐 Test API key authentication
- 🤖 Create and process AI jobs
- 📊 Demonstrate usage tracking
- 🔗 Test webhook system
- 📋 Show queue management
- 💳 Display billing integration
- 📈 Verify observability stack

## Demo Features

### 🎯 **Sample Data Created**

The demo creates comprehensive sample data:

#### Users & Organizations
- **Demo User** (`demo@launchkit.com`) → **Demo Startup** (FREE plan)
- **Enterprise User** (`enterprise@launchkit.com`) → **Enterprise Corp** (ENTERPRISE plan)

#### API Keys
- `lk_demo_1234567890abcdef` (Demo Startup - Primary)
- `lk_demo_abcdef1234567890` (Demo Startup - Secondary)
- `lk_enterprise_xyz789abc123` (Enterprise Corp - Primary)

#### Sample Jobs
- **Summarize Job**: Text summarization with AI
- **Classify Job**: Text classification (positive/negative/neutral)
- **Sentiment Job**: Sentiment analysis with confidence scores
- **Extract Job**: Entity extraction (emails, phone numbers)
- **Failed Job**: Demonstrates error handling

#### Usage Metrics
- Hourly usage data for jobs and tokens
- Different usage patterns for FREE vs ENTERPRISE plans
- Historical data for analytics

#### Webhook Endpoints
- Demo webhook: `https://webhook.site/unique-id-123`
- Enterprise webhook: `https://api.enterprise.com/webhooks/launchkit`
- Sample delivery history (success and failure examples)

### 🔧 **What the Demo Tests**

#### 1. API Key Authentication
```bash
# Valid API key
curl -H "X-API-Key: lk_demo_1234567890abcdef" http://localhost:3001/v1/orgs

# Invalid API key (should return 401)
curl -H "X-API-Key: invalid_key" http://localhost:3001/v1/orgs
```

#### 2. Job Creation & Processing
```bash
# Create a summarize job
curl -X POST http://localhost:3001/v1/jobs/summarize \
  -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your text to summarize here"}'

# Check job status
curl -H "X-API-Key: lk_demo_1234567890abcdef" \
  http://localhost:3001/v1/jobs/{job_id}
```

#### 3. Usage Tracking
```bash
# Check current usage
curl -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "X-Org-Id: org_demo_startup" \
  http://localhost:3001/v1/usage/current

# Get usage analytics
curl -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "X-Org-Id: org_demo_startup" \
  http://localhost:3001/v1/usage/analytics
```

#### 4. Webhook System
```bash
# Create webhook endpoint
curl -X POST http://localhost:3001/v1/orgs/org_demo_startup/webhooks \
  -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/your-unique-id",
    "events": ["job.completed", "job.failed"]
  }'

# Send test webhook
curl -X POST http://localhost:3001/v1/orgs/org_demo_startup/webhooks/{webhook_id}/test \
  -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"event": "job.completed", "payload": {"jobId": "test"}}'
```

#### 5. Queue Management
```bash
# Get queue metrics
curl -H "X-API-Key: lk_demo_1234567890abcdef" \
  http://localhost:3001/v1/queue/metrics
```

#### 6. Billing Integration
```bash
# Check billing status
curl -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "X-Org-Id: org_demo_startup" \
  http://localhost:3001/v1/billing/status
```

## Manual Testing

### Frontend Dashboard
1. **Visit**: http://localhost:3000
2. **Login**: Use Clerk authentication
3. **Explore**:
   - API Keys management
   - Usage dashboard
   - Billing information
   - Job history

### Observability Stack
1. **Jaeger** (Traces): http://localhost:16686
   - Select service: `launchkit-api`
   - View detailed request traces
   - See custom spans for job processing

2. **Prometheus** (Metrics): http://localhost:9090
   - Query: `up` (service availability)
   - Query: `http_server_duration_milliseconds` (request duration)

3. **Grafana** (Dashboards): http://localhost:3010
   - Login: `admin` / `admin`
   - View: LaunchKit API Overview dashboard

### API Testing with curl

#### Create Different Job Types
```bash
# Summarize
curl -X POST http://localhost:3001/v1/jobs/summarize \
  -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"text": "Long text to summarize..."}'

# Classify
curl -X POST http://localhost:3001/v1/jobs/classify \
  -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this product!", "categories": ["positive", "negative", "neutral"]}'

# Sentiment
curl -X POST http://localhost:3001/v1/jobs/sentiment \
  -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is amazing!"}'
```

#### Test Rate Limiting
```bash
# Create multiple jobs quickly to test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:3001/v1/jobs/summarize \
    -H "X-API-Key: lk_demo_1234567890abcdef" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"Test message $i\"}"
done
```

#### Test Webhook Delivery
```bash
# Create a webhook endpoint
WEBHOOK_ID=$(curl -s -X POST http://localhost:3001/v1/orgs/org_demo_startup/webhooks \
  -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/your-unique-id",
    "events": ["job.completed", "job.failed"]
  }' | jq -r '.id')

# Create a job (this should trigger the webhook)
curl -X POST http://localhost:3001/v1/jobs/summarize \
  -H "X-API-Key: lk_demo_1234567890abcdef" \
  -H "Content-Type: application/json" \
  -d '{"text": "This will trigger a webhook"}'

# Check webhook delivery history
curl -H "X-API-Key: lk_demo_1234567890abcdef" \
  http://localhost:3001/v1/orgs/org_demo_startup/webhooks/$WEBHOOK_ID/history
```

## Demo Scenarios

### Scenario 1: Free Plan User
- **Organization**: Demo Startup (FREE plan)
- **Limits**: 100 jobs/month, 10,000 tokens/month
- **Features**: Basic AI jobs, webhooks, usage tracking
- **API Key**: `lk_demo_1234567890abcdef`

### Scenario 2: Enterprise User
- **Organization**: Enterprise Corp (ENTERPRISE plan)
- **Limits**: Unlimited jobs and tokens
- **Features**: All AI job types, advanced webhooks, priority processing
- **API Key**: `lk_enterprise_xyz789abc123`

### Scenario 3: Error Handling
- **Failed Jobs**: Demonstrates error handling and retry logic
- **Invalid API Keys**: Shows proper authentication errors
- **Rate Limiting**: Tests usage limits and quota enforcement
- **Webhook Failures**: Shows retry mechanisms and delivery history

## Troubleshooting

### Common Issues

1. **API Server Not Running**
   ```bash
   cd api && pnpm dev
   ```

2. **Redis Not Running**
   ```bash
   redis-server
   ```

3. **Database Not Seeded**
   ```bash
   cd api && pnpm prisma:seed
   ```

4. **Observability Stack Not Running**
   ```bash
   docker compose -f docker-compose.observability.yml up -d
   ```

5. **Port Conflicts**
   - API: 3001
   - Frontend: 3000
   - Jaeger: 16686
   - Prometheus: 9090
   - Grafana: 3010

### Debug Commands

```bash
# Check API health
curl http://localhost:3001/health

# Check Redis
redis-cli ping

# Check database connection
cd api && pnpm prisma studio

# View container logs
docker compose -f docker-compose.observability.yml logs
```

## Next Steps

After running the demo:

1. **Explore the Code**: Review the implementation in each module
2. **Customize**: Modify the demo data or add new features
3. **Deploy**: Use the deployment guides for production
4. **Scale**: Add more job types, webhook events, or integrations
5. **Monitor**: Use the observability stack for production monitoring

## Demo Data Summary

| Component | Count | Description |
|-----------|-------|-------------|
| Users | 2 | Demo and Enterprise users |
| Organizations | 2 | Different plan tiers |
| API Keys | 3 | Various access levels |
| Jobs | 5 | Different types and statuses |
| Usage Records | 6 | Historical usage data |
| Webhook Endpoints | 2 | Different configurations |
| Webhook Deliveries | 3 | Success and failure examples |
| Billing Records | 2 | Plan and subscription data |

This comprehensive demo showcases every feature of the LaunchKit platform, from basic API usage to advanced observability and monitoring capabilities.
