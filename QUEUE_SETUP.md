# Job Queue System with BullMQ

## Overview

LaunchKit uses **BullMQ** with **Redis** for asynchronous job processing. This enables:

- ⚡ **Async Processing**: Jobs run in background workers
- 🔄 **Auto Retry**: Failed jobs retry with exponential backoff  
- 📊 **Monitoring**: Real-time queue metrics
- 🎯 **Prioritization**: Priority-based job execution
- 🛡️ **Reliability**: Jobs persisted in Redis, survive crashes

---

## Architecture

```
API Request → Create Job → Add to Queue → Worker Processes → Update DB
                  ↓            ↓              ↓
               [Database]   [Redis]      [Processor]
```

### Components

1. **QueueModule** (`api/src/modules/queue/`)
   - BullMQ configuration
   - Queue registration (ai-jobs, webhooks)
   - Redis connection

2. **QueueService** (`queue.service.ts`)
   - Add jobs to queue
   - Get job status
   - Queue management (pause/resume/clean)

3. **AIJobsProcessor** (`processors/ai-jobs.processor.ts`)
   - Worker that processes jobs
   - Handles: SUMMARIZE, CLASSIFY, SENTIMENT, TRANSLATE, EXTRACT
   - Records usage and updates database

4. **JobsService** (`api/src/modules/jobs/jobs.service.ts`)
   - Creates jobs in database
   - Adds jobs to BullMQ queue
   - Retrieves job status

---

## Prerequisites

### Install Redis

#### macOS (Homebrew)
```bash
brew install redis
brew services start redis
```

#### Ubuntu/Debian
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

#### Docker
```bash
docker run -d -p 6379:6379 --name redis redis:7-alpine
```

#### Verify Redis is Running
```bash
redis-cli ping
# Should return: PONG
```

---

## Configuration

### Environment Variables

Create or update `api/.env`:

```bash
# Redis Configuration
REDIS_HOST="localhost"
REDIS_PORT="6379"
REDIS_PASSWORD=""  # Leave empty for local development

# Or use connection string:
# REDIS_URL="redis://localhost:6379"
```

### Queue Settings

Configured in `queue.module.ts`:
- **Connection**: Redis host, port, password
- **Queues**: ai-jobs (AI processing), webhooks (outbound)
- **Concurrency**: 5 concurrent jobs per worker

Configured in `queue.service.ts`:
- **Attempts**: 3 retries for AI jobs, 5 for webhooks
- **Backoff**: Exponential (2s base delay)
- **Retention**: Keep completed jobs 1hr, failed jobs 7 days

---

## Usage

### API Endpoints

#### Create Jobs (API Key Required)

**Summarize**
```bash
curl -X POST http://localhost:3001/v1/jobs/summarize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Your long text here..."}'
```

**Classify**
```bash
curl -X POST http://localhost:3001/v1/jobs/classify \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Text to classify..."}'
```

**Sentiment Analysis**
```bash
curl -X POST http://localhost:3001/v1/jobs/sentiment \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Text for sentiment analysis..."}'
```

#### Get Job Status
```bash
curl http://localhost:3001/v1/jobs/{jobId} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### List All Jobs
```bash
curl http://localhost:3001/v1/jobs?limit=10&offset=0 \
  -H "Authorization: Bearer YOUR_API_KEY"
```

#### Queue Admin Endpoints (JWT Required)

**Get Queue Metrics**
```bash
curl http://localhost:3001/v1/admin/queue/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Get All Queues Metrics**
```bash
curl http://localhost:3001/v1/admin/queue/metrics/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Pause Queue**
```bash
curl -X POST http://localhost:3001/v1/admin/queue/pause?queue=ai-jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resume Queue**
```bash
curl -X POST http://localhost:3001/v1/admin/queue/resume?queue=ai-jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Testing

### Step 1: Start Redis
```bash
# If using Homebrew
brew services start redis

# Or manually
redis-server

# Verify
redis-cli ping  # Should return PONG
```

### Step 2: Start API Server
```bash
cd api
pnpm dev
```

Check logs for:
```
QueueService initialized
AI Jobs Queue: ai-jobs
Webhooks Queue: webhooks
```

### Step 3: Create Test Jobs

Use the test script:
```bash
cd /path/to/LaunchKit
./test-queue.sh YOUR_API_KEY
```

Or manually:
```bash
curl -X POST http://localhost:3001/v1/jobs/summarize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a test job to verify the queue system is working properly. It should be processed asynchronously by a worker."}'
```

### Step 4: Monitor Job Processing

Watch the API logs:
```bash
tail -f /tmp/nest-api.log
```

You should see:
```
Processing job clx... of type SUMMARIZE for org ...
Job clx... completed successfully. Tokens: 45, Cost: $0.00
```

### Step 5: Check Job Status
```bash
# Get the jobId from the create response
curl http://localhost:3001/v1/jobs/{jobId} \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected response:
```json
{
  "id": "clx...",
  "status": "SUCCEEDED",
  "type": "SUMMARIZE",
  "input": {...},
  "output": {
    "summary": "...",
    "originalLength": 123,
    "summaryLength": 100
  },
  "tokenUsed": 45,
  "costCents": 0,
  "createdAt": "...",
  "completedAt": "..."
}
```

---

## Job States

Jobs progress through these states:

1. **QUEUED** - Job created and added to queue
2. **PROCESSING** - Worker picked up job and is processing
3. **SUCCEEDED** - Job completed successfully
4. **FAILED** - Job failed after all retries

---

## Monitoring

### Queue Metrics

Get real-time queue statistics:
```bash
curl http://localhost:3001/v1/admin/queue/metrics/all \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Returns:
```json
{
  "aiJobs": {
    "queue": "ai-jobs",
    "waiting": 2,
    "active": 1,
    "completed": 150,
    "failed": 3,
    "delayed": 0,
    "total": 156
  },
  "webhooks": {
    "queue": "webhooks",
    "waiting": 0,
    "active": 0,
    "completed": 75,
    "failed": 1,
    "delayed": 0,
    "total": 76
  }
}
```

### Redis CLI Monitoring

```bash
# Monitor Redis commands
redis-cli monitor

# List all queue keys
redis-cli keys "bull:*"

# Get queue length
redis-cli llen "bull:ai-jobs:wait"
```

---

## Production Considerations

### Scaling Workers

Run multiple worker instances:
```bash
# Terminal 1
NODE_ENV=production pnpm start

# Terminal 2 (additional worker)
NODE_ENV=production pnpm start
```

Workers will automatically distribute load.

### Redis Configuration

For production, configure Redis with:
- **Persistence**: AOF + RDB snapshots
- **Max Memory**: Set `maxmemory` policy
- **Replication**: Master-slave setup for HA

### Error Handling

Jobs automatically retry with exponential backoff:
- Attempt 1: Immediate
- Attempt 2: After 2 seconds
- Attempt 3: After 4 seconds
- After 3 failures: Marked as FAILED

### Monitoring

Consider adding:
- **Bull Board**: Web UI for queue monitoring
- **Prometheus**: Metrics export
- **AlertManager**: Alerts for queue backlogs

---

## Troubleshooting

### Redis Connection Errors

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: Start Redis:
```bash
brew services start redis
```

### Jobs Not Processing

**Check**:
1. Redis is running: `redis-cli ping`
2. Worker is running: Check API logs for "QueueService initialized"
3. Queue is not paused: Check metrics endpoint
4. No errors in logs: `tail -f /tmp/nest-api.log`

### Memory Issues

If Redis uses too much memory:
```bash
# Check memory usage
redis-cli info memory

# Clean old jobs
curl -X POST http://localhost:3001/v1/admin/queue/clean?queue=ai-jobs \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Next Steps

- [ ] Add Bull Board for visual queue monitoring
- [ ] Implement webhook delivery queue processor
- [ ] Add Prometheus metrics
- [ ] Set up alerts for queue backlogs
- [ ] Configure Redis persistence for production

