#!/bin/bash

echo "🔑 API Key Testing Script"
echo "========================="
echo ""

# Replace this with your actual API key from the dashboard
API_KEY="PASTE_YOUR_API_KEY_HERE"

if [ "$API_KEY" = "PASTE_YOUR_API_KEY_HERE" ]; then
    echo "❌ Please edit this script and paste your API key"
    echo "   Get it from: http://localhost:3000/dashboard/api-keys"
    exit 1
fi

echo "1️⃣  Testing with valid API key..."
echo "Request: GET /v1/usage"
echo "Headers: Authorization: Bearer $API_KEY"
echo ""

RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  http://localhost:3001/v1/usage)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ SUCCESS! API key is valid"
    echo "Response:"
    echo "$BODY" | jq . 2>/dev/null || echo "$BODY"
else
    echo "❌ FAILED with status: $HTTP_CODE"
    echo "Response: $BODY"
fi

echo ""
echo "2️⃣  Testing with invalid API key..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -H "Authorization: Bearer lk_test_pk_invalid_key" \
  http://localhost:3001/v1/usage)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$RESPONSE" | sed '/HTTP_CODE/d')

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Correctly rejected invalid key (401)"
else
    echo "⚠️  Got status: $HTTP_CODE (expected 401)"
fi

echo ""
echo "3️⃣  Testing without API key..."
RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  http://localhost:3001/v1/usage)

HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Correctly rejected missing key (401)"
else
    echo "⚠️  Got status: $HTTP_CODE (expected 401)"
fi

echo ""
echo "✅ API Key testing complete!"

