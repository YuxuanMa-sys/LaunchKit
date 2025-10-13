#!/bin/bash

echo "🔗 Testing Webhook System"
echo "========================="
echo ""

# Check if JWT token is provided
if [ -z "$1" ]; then
  echo "Usage: ./test-webhooks.sh YOUR_JWT_TOKEN"
  echo ""
  echo "Get your JWT token from: http://localhost:3000/dashboard"
  echo "(Open browser dev tools, go to Network tab, find any API call, copy the Authorization header)"
  exit 1
fi

JWT_TOKEN="$1"
API_URL="http://localhost:3001/v1"

echo "Step 1: Getting organization ID..."
ORGS_RESPONSE=$(curl -s $API_URL/orgs \
  -H "Authorization: Bearer $JWT_TOKEN")

ORG_ID=$(echo "$ORGS_RESPONSE" | jq -r '.[0].id')
echo "✅ Using organization: $ORG_ID"
echo ""

echo "Step 2: Creating webhook endpoint..."
WEBHOOK_RESPONSE=$(curl -s -X POST $API_URL/orgs/$ORG_ID/webhooks \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://webhook.site/unique-id-here"}')

WEBHOOK_ID=$(echo "$WEBHOOK_RESPONSE" | jq -r '.id')
WEBHOOK_URL=$(echo "$WEBHOOK_RESPONSE" | jq -r '.url')
WEBHOOK_SECRET=$(echo "$WEBHOOK_RESPONSE" | jq -r '.secret')

echo "✅ Webhook created:"
echo "   ID: $WEBHOOK_ID"
echo "   URL: $WEBHOOK_URL"
echo "   Secret: $WEBHOOK_SECRET"
echo ""

echo "Step 3: Testing webhook endpoint..."
TEST_RESPONSE=$(curl -s -X POST $API_URL/orgs/$ORG_ID/webhooks/$WEBHOOK_ID/test \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "✅ Test webhook queued:"
echo "$TEST_RESPONSE" | jq '.'
echo ""

echo "Step 4: Sending custom webhook..."
CUSTOM_RESPONSE=$(curl -s -X POST $API_URL/orgs/$ORG_ID/webhooks/send \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "custom.test",
    "data": {
      "message": "Hello from LaunchKit webhooks!",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)'",
      "testData": {
        "userId": "user123",
        "action": "test",
        "metadata": {
          "source": "test-script",
          "version": "1.0"
        }
      }
    }
  }')

echo "✅ Custom webhook sent:"
echo "$CUSTOM_RESPONSE" | jq '.'
echo ""

echo "Step 5: Checking delivery history..."
sleep 3  # Wait for webhook processing

DELIVERY_RESPONSE=$(curl -s $API_URL/orgs/$ORG_ID/webhooks/$WEBHOOK_ID/deliveries \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "✅ Delivery history:"
echo "$DELIVERY_RESPONSE" | jq '.deliveries[0]'
echo ""

echo "Step 6: Listing all webhooks..."
LIST_RESPONSE=$(curl -s $API_URL/orgs/$ORG_ID/webhooks \
  -H "Authorization: Bearer $JWT_TOKEN")

echo "✅ All webhooks:"
echo "$LIST_RESPONSE" | jq '.'
echo ""

echo "✅ Webhook Test Complete!"
echo ""
echo "Next steps:"
echo "  1. Check webhook.site for received webhooks"
echo "  2. Verify signature verification works"
echo "  3. Test retry logic with invalid URLs"
echo "  4. Monitor webhook queue metrics:"
echo "     curl $API_URL/admin/queue/metrics?queue=webhooks -H \"Authorization: Bearer $JWT_TOKEN\""
