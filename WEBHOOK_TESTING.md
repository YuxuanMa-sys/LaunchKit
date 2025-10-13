# 🔗 Webhook System Testing Guide

## Overview

The webhook system allows LaunchKit to send real-time notifications to external URLs when events occur (e.g., job completion, job failure).

---

## Prerequisites

1. **Running Services:**
   - Redis: `brew services start redis`
   - API Server: `cd api && pnpm dev`
   - Frontend: `cd app && pnpm dev`

2. **Webhook Receiver:**
   - Option 1: Use [webhook.site](https://webhook.site) (easiest)
   - Option 2: Use [ngrok](https://ngrok.com) + local server
   - Option 3: Use [RequestBin](https://requestbin.com)

---

## Quick Test (5 minutes)

### Step 1: Get a Webhook URL

Go to https://webhook.site and copy your unique URL (e.g., `https://webhook.site/abc123...`)

### Step 2: Get Your JWT Token

1. Open http://localhost:3000/dashboard in your browser
2. Open Developer Tools (F12)
3. Go to Network tab
4. Refresh the page
5. Click any API request
6. Copy the `Authorization` header value (starts with `Bearer ey...`)

### Step 3: Run the Test Script

```bash
./test-webhooks.sh "YOUR_JWT_TOKEN_HERE"
```

Replace the webhook URL in the script with your webhook.site URL first:

```bash
# Edit the script
nano test-webhooks.sh

# Find this line:
"url": "https://webhook.site/unique-id-here"

# Replace with your actual webhook.site URL
"url": "https://webhook.site/YOUR-UNIQUE-ID"
```

### Step 4: Check Results

1. Go back to webhook.site
2. You should see 2 webhook deliveries:
   - `webhook.test` - Test webhook
   - `custom.test` - Custom webhook

---

## Manual Testing Steps

### 1. Create a Webhook Endpoint

```bash
curl -X POST http://localhost:3001/v1/orgs/YOUR_ORG_ID/webhooks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://webhook.site/YOUR-UNIQUE-ID"
  }'
```

**Response:**
```json
{
  "id": "clxxx...",
  "url": "https://webhook.site/...",
  "secret": "whsec_abc123...",
  "enabled": true,
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

Save the `id` and `secret` for later!

---

### 2. Test the Webhook

```bash
curl -X POST http://localhost:3001/v1/orgs/YOUR_ORG_ID/webhooks/WEBHOOK_ID/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Check webhook.site** - You should see a delivery with:
- Event: `webhook.test`
- Headers: `X-LK-Signature`, `X-LK-Event`, `X-LK-Timestamp`
- Body: Test message

---

### 3. Trigger a Real Webhook (Job Completion)

Create a job that will trigger a webhook when it completes:

```bash
# First, get your API key from http://localhost:3000/dashboard/api-keys

# Create a job
curl -X POST http://localhost:3001/v1/jobs/summarize \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test job that will trigger a webhook when it completes."
  }'
```

**Response:**
```json
{
  "id": "job_123",
  "status": "QUEUED",
  "createdAt": "2024-01-15T10:00:00.000Z"
}
```

**Wait 2-3 seconds**, then check webhook.site for a `job.completed` event!

---

### 4. Send a Custom Webhook

```bash
curl -X POST http://localhost:3001/v1/orgs/YOUR_ORG_ID/webhooks/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "user.signup",
    "data": {
      "userId": "user_123",
      "email": "test@example.com",
      "timestamp": "2024-01-15T10:00:00.000Z"
    }
  }'
```

---

### 5. View Delivery History

```bash
curl http://localhost:3001/v1/orgs/YOUR_ORG_ID/webhooks/WEBHOOK_ID/deliveries \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "deliveries": [
    {
      "id": "delivery_123",
      "eventType": "job.completed",
      "status": "SUCCESS",
      "attempt": 1,
      "responseStatus": 200,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "total": 5,
  "limit": 50,
  "offset": 0
}
```

---

### 6. Disable/Enable a Webhook

```bash
# Disable
curl -X PUT http://localhost:3001/v1/orgs/YOUR_ORG_ID/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'

# Enable
curl -X PUT http://localhost:3001/v1/orgs/YOUR_ORG_ID/webhooks/WEBHOOK_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

---

## Webhook Signature Verification

All webhooks include a signature in the `X-LK-Signature` header for verification.

### Verify in Node.js:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}

// Usage
const isValid = verifyWebhook(
  req.body,
  req.headers['x-lk-signature'],
  'whsec_abc123...' // Your webhook secret
);

if (!isValid) {
  return res.status(401).send('Invalid signature');
}
```

### Verify in Python:

```python
import hmac
import hashlib
import json

def verify_webhook(payload, signature, secret):
    expected_signature = hmac.new(
        secret.encode(),
        json.dumps(payload).encode(),
        hashlib.sha256
    ).hexdigest()
    
    return signature == expected_signature
```

---

## Webhook Events

### Available Events:

1. **`job.completed`** - Job finished successfully
   ```json
   {
     "event": "job.completed",
     "data": {
       "jobId": "job_123",
       "type": "SUMMARIZE",
       "status": "SUCCEEDED",
       "result": { ... },
       "tokensUsed": 45,
       "costCents": 1,
       "completedAt": "2024-01-15T10:00:00.000Z"
     },
     "timestamp": "2024-01-15T10:00:00.000Z",
     "orgId": "org_123"
   }
   ```

2. **`job.failed`** - Job failed
   ```json
   {
     "event": "job.failed",
     "data": {
       "jobId": "job_123",
       "type": "SUMMARIZE",
       "status": "FAILED",
       "error": "Processing error",
       "failedAt": "2024-01-15T10:00:00.000Z",
       "attempts": 3
     },
     "timestamp": "2024-01-15T10:00:00.000Z",
     "orgId": "org_123"
   }
   ```

3. **`webhook.test`** - Test webhook
   ```json
   {
     "event": "webhook.test",
     "data": {
       "message": "This is a test webhook from LaunchKit",
       "timestamp": "2024-01-15T10:00:00.000Z",
       "webhookId": "webhook_123"
     },
     "timestamp": "2024-01-15T10:00:00.000Z",
     "orgId": "org_123"
   }
   ```

4. **Custom Events** - Any event you send via `/webhooks/send`

---

## Retry Logic

Webhooks automatically retry on failure:

- **Retryable Errors:**
  - Network errors (ECONNREFUSED, ETIMEDOUT)
  - 5xx server errors
  - 429 Too Many Requests

- **Non-Retryable Errors:**
  - 4xx client errors (except 429)
  - Invalid URLs

- **Retry Schedule:**
  - Attempt 1: Immediate
  - Attempt 2: 1 second delay
  - Attempt 3: 2 seconds delay
  - Attempt 4: 4 seconds delay
  - Attempt 5: 8 seconds delay (final)

---

## Monitoring Webhooks

### Check Queue Metrics:

```bash
curl http://localhost:3001/v1/admin/queue/webhooks/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "name": "webhooks",
  "counts": {
    "waiting": 5,
    "active": 2,
    "completed": 150,
    "failed": 3
  },
  "waiting": 5,
  "active": 2,
  "completed": 150,
  "failed": 3
}
```

### View Failed Webhooks:

```bash
curl http://localhost:3001/v1/admin/queue/webhooks/jobs/failed \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting

### Webhooks Not Delivering?

1. **Check Redis is running:**
   ```bash
   redis-cli ping  # Should return "PONG"
   ```

2. **Check API logs:**
   ```bash
   tail -f api/logs/app.log
   ```

3. **Check webhook is enabled:**
   ```bash
   curl http://localhost:3001/v1/orgs/YOUR_ORG_ID/webhooks \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

4. **Check delivery history for errors:**
   ```bash
   curl http://localhost:3001/v1/orgs/YOUR_ORG_ID/webhooks/WEBHOOK_ID/deliveries \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Signature Verification Failing?

- Make sure you're using the exact payload body (no modifications)
- Use the secret from the webhook creation response
- Ensure you're using HMAC-SHA256

---

## Production Considerations

1. **HTTPS Only:** Only use HTTPS URLs in production
2. **Timeouts:** Webhook endpoints should respond within 30 seconds
3. **Idempotency:** Handle duplicate deliveries gracefully
4. **Rate Limiting:** Implement rate limiting on your webhook receiver
5. **Monitoring:** Set up alerts for failed webhook deliveries
6. **Secrets Rotation:** Regularly rotate webhook secrets

---

## Next Steps

- Add more webhook events (user.created, subscription.updated, etc.)
- Implement webhook replay functionality
- Add webhook filtering by event type
- Create webhook delivery dashboard in the frontend

