#!/bin/bash

echo "🧪 Testing Job Queue System (BullMQ + Redis)"
echo "=============================================="
echo ""

# Check if API key is provided
if [ -z "$1" ]; then
  echo "Usage: ./test-queue.sh YOUR_API_KEY"
  echo ""
  echo "Get your API key from: http://localhost:3000/dashboard/api-keys"
  exit 1
fi

API_KEY="$1"
API_URL="http://localhost:3001/v1"

echo "Step 1: Checking Redis connection..."
if redis-cli ping > /dev/null 2>&1; then
  echo "✅ Redis is running"
else
  echo "❌ Redis is not running. Please start Redis:"
  echo "   brew services start redis"
  exit 1
fi

echo ""
echo "Step 2: Creating test jobs..."
echo ""

# Create 3 different types of jobs
echo "📝 Creating SUMMARIZE job..."
SUMMARIZE_RESPONSE=$(curl -s -X POST $API_URL/jobs/summarize \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "This is a long text that needs to be summarized. It contains multiple sentences and paragraphs. The summary should capture the main points while being concise. This is important for understanding the content quickly."}')

SUMMARIZE_JOB_ID=$(echo "$SUMMARIZE_RESPONSE" | jq -r '.id')
echo "✅ Job created: $SUMMARIZE_JOB_ID"

echo ""
echo "📊 Creating CLASSIFY job..."
CLASSIFY_RESPONSE=$(curl -s -X POST $API_URL/jobs/classify \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Apple announces new AI features in latest iOS update, revolutionizing smartphone technology."}')

CLASSIFY_JOB_ID=$(echo "$CLASSIFY_RESPONSE" | jq -r '.id')
echo "✅ Job created: $CLASSIFY_JOB_ID"

echo ""
echo "😊 Creating SENTIMENT job..."
SENTIMENT_RESPONSE=$(curl -s -X POST $API_URL/jobs/sentiment \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "I absolutely love this product! It exceeded all my expectations."}')

SENTIMENT_JOB_ID=$(echo "$SENTIMENT_RESPONSE" | jq -r '.id')
echo "✅ Job created: $SENTIMENT_JOB_ID"

echo ""
echo "Step 3: Waiting for jobs to process (5 seconds)..."
sleep 5

echo ""
echo "Step 4: Checking job status..."
echo ""

check_job() {
  JOB_ID=$1
  JOB_TYPE=$2
  
  RESPONSE=$(curl -s $API_URL/jobs/$JOB_ID \
    -H "Authorization: Bearer $API_KEY")
  
  STATUS=$(echo "$RESPONSE" | jq -r '.status')
  
  echo "┌─ $JOB_TYPE Job ($JOB_ID)"
  echo "│  Status: $STATUS"
  
  if [ "$STATUS" = "SUCCEEDED" ]; then
    echo "│  ✅ Completed"
    TOKENS=$(echo "$RESPONSE" | jq -r '.tokenUsed')
    COST=$(echo "$RESPONSE" | jq -r '.costCents')
    echo "│  Tokens: $TOKENS | Cost: \$$(echo "scale=2; $COST/100" | bc)"
    echo "│  Output: $(echo "$RESPONSE" | jq -c '.output')"
  elif [ "$STATUS" = "PROCESSING" ]; then
    echo "│  ⏳ Still processing..."
  elif [ "$STATUS" = "QUEUED" ]; then
    echo "│  📋 In queue..."
  elif [ "$STATUS" = "FAILED" ]; then
    echo "│  ❌ Failed"
    ERROR=$(echo "$RESPONSE" | jq -r '.error')
    echo "│  Error: $ERROR"
  fi
  echo "└─"
  echo ""
}

check_job "$SUMMARIZE_JOB_ID" "SUMMARIZE"
check_job "$CLASSIFY_JOB_ID" "CLASSIFY"
check_job "$SENTIMENT_JOB_ID" "SENTIMENT"

echo "Step 5: Listing all jobs..."
JOBS_LIST=$(curl -s $API_URL/jobs?limit=10 \
  -H "Authorization: Bearer $API_KEY")

TOTAL=$(echo "$JOBS_LIST" | jq -r '.total')
echo "Total jobs: $TOTAL"
echo ""

echo "✅ Test Complete!"
echo ""
echo "Next steps:"
echo "  1. Check usage dashboard: http://localhost:3000/dashboard/usage"
echo "  2. View API logs: tail -f /tmp/nest-api.log"
echo "  3. Monitor Redis: redis-cli monitor"
echo "  4. Check queue metrics:"
echo "     curl http://localhost:3001/v1/admin/queue/metrics/all -H \"Authorization: Bearer YOUR_JWT_TOKEN\""

