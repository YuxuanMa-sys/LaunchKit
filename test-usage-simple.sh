#!/bin/bash

echo "🧪 Testing Usage Tracking"
echo "========================"
echo ""
echo "Please enter your API key (from http://localhost:3000/dashboard/api-keys):"
read -r API_KEY

if [ -z "$API_KEY" ]; then
  echo "Error: API key is required"
  exit 1
fi

echo ""
echo "Creating 5 test jobs to generate usage data..."
echo ""

for i in {1..5}; do
  echo "Creating job $i..."
  curl -s -X POST http://localhost:3001/v1/jobs/summarize \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"Test job $i - This will increment usage counter\"}" | jq -r '.id // "Failed"'
  sleep 1
done

echo ""
echo "✅ Done! Created 5 jobs"
echo ""
echo "Now refresh the usage page to see the stats update:"
echo "👉 http://localhost:3000/dashboard/usage"
echo ""
echo "You should see:"
echo "  - API Calls: 5"
echo "  - Usage bar partially filled"
echo "  - Chart showing today's usage"

