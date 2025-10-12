#!/bin/bash

echo "🧪 Testing LaunchKit API - Step 3"
echo "=================================="
echo ""

BASE_URL="http://localhost:3001"

echo "1️⃣  Testing Root Endpoint"
echo "GET /"
curl -s $BASE_URL/v1/ | jq '.' || echo "❌ Failed"
echo ""

echo "2️⃣  Testing Health Check"
echo "GET /health"
curl -s $BASE_URL/v1/health | jq '.' || echo "❌ Failed"
echo ""

echo "3️⃣  Testing Swagger Docs"
echo "GET /api/docs (checking if available)"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" $BASE_URL/api/docs
echo ""

echo "✅ Step 3 API Test Complete!"
echo ""
echo "📚 View full API docs at: http://localhost:3001/api/docs"
echo "🚀 API is running on: http://localhost:3001"

