#!/bin/bash

# Test Usage Tracking System
# This script demonstrates how usage tracking works

echo "🧪 Testing Usage Tracking & Metering"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:3001/v1"
API_KEY="YOUR_API_KEY_HERE" # Replace with an actual API key from the dashboard

echo -e "${BLUE}Step 1: Check current usage limits${NC}"
echo ""

LIMIT_CHECK=$(curl -s -X GET "$API_URL/usage/check-limit" \
  -H "Authorization: Bearer $API_KEY")

echo "$LIMIT_CHECK" | jq '.'
echo ""

ALLOWED=$(echo "$LIMIT_CHECK" | jq -r '.allowed')

if [ "$ALLOWED" = "true" ]; then
  echo -e "${GREEN}✓ Usage within limits${NC}"
else
  echo -e "${RED}✗ Usage limit exceeded${NC}"
  echo "$LIMIT_CHECK" | jq -r '.reason'
  echo ""
  echo "Please upgrade your plan to continue"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 2: Create a test job (this will record usage)${NC}"
echo ""

JOB_CREATE=$(curl -s -X POST "$API_URL/jobs/summarize" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This is a test document for summarization. It will record usage metrics."
  }')

echo "$JOB_CREATE" | jq '.'
echo ""

JOB_ID=$(echo "$JOB_CREATE" | jq -r '.id // empty')

if [ -n "$JOB_ID" ]; then
  echo -e "${GREEN}✓ Job created: $JOB_ID${NC}"
else
  echo -e "${RED}✗ Failed to create job${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Check usage stats${NC}"
echo ""

USAGE_STATS=$(curl -s -X GET "$API_URL/usage" \
  -H "Authorization: Bearer $API_KEY")

echo "$USAGE_STATS" | jq '.'
echo ""

JOBS_USED=$(echo "$USAGE_STATS" | jq -r '.usage.jobs')
JOBS_LIMIT=$(echo "$USAGE_STATS" | jq -r '.limits.jobs')
PERCENT=$(echo "$USAGE_STATS" | jq -r '.percentUsed.jobs')

echo -e "${YELLOW}Usage Summary:${NC}"
echo "  Jobs Used: $JOBS_USED / $JOBS_LIMIT"
echo "  Percent Used: ${PERCENT}%"
echo ""

if (( $(echo "$PERCENT > 80" | bc -l) )); then
  echo -e "${YELLOW}⚠️  Warning: Usage is over 80%${NC}"
  echo "   Consider upgrading your plan"
elif (( $(echo "$PERCENT > 50" | bc -l) )); then
  echo -e "${YELLOW}📊 Usage is moderate (50-80%)${NC}"
else
  echo -e "${GREEN}✓ Usage is healthy (<50%)${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Verify usage was recorded${NC}"
echo ""

sleep 1  # Give the database time to update

USAGE_AFTER=$(curl -s -X GET "$API_URL/usage" \
  -H "Authorization: Bearer $API_KEY")

JOBS_AFTER=$(echo "$USAGE_AFTER" | jq -r '.usage.jobs')

echo "Previous: $JOBS_USED jobs"
echo "Current: $JOBS_AFTER jobs"
echo ""

if [ "$JOBS_AFTER" -gt "$JOBS_USED" ]; then
  echo -e "${GREEN}✓ Usage tracking is working!${NC}"
else
  echo -e "${YELLOW}⚠️  Usage may not have updated yet${NC}"
fi

echo ""
echo "======================================"
echo -e "${GREEN}✓ Usage tracking test complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. View usage in the dashboard: http://localhost:3000/dashboard/usage"
echo "  2. Test plan limits by creating multiple jobs"
echo "  3. Upgrade to PRO to increase limits"

