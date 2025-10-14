#!/bin/bash

echo "🔍 Testing LaunchKit Observability Setup"
echo "========================================"
echo ""

# Check if observability stack is running
echo "Step 1: Checking if observability stack is running..."
if docker ps | grep -q "launchkit-jaeger\|launchkit-otel-collector\|launchkit-prometheus\|launchkit-grafana"; then
    echo "✅ Observability stack is running"
else
    echo "❌ Observability stack is not running. Please start it with:"
    echo "   docker-compose -f docker-compose.observability.yml up -d"
    echo ""
    echo "Starting observability stack now..."
    docker-compose -f docker-compose.observability.yml up -d
    echo "⏳ Waiting 30 seconds for services to start..."
    sleep 30
fi

echo ""
echo "Step 2: Testing API server observability..."
echo "Making a test API call to generate telemetry data..."

# Get a fresh JWT token (you'll need to update this)
echo "⚠️  Please update this script with a fresh JWT token from your dashboard"
echo "   Then run: ./test-observability.sh"

# Uncomment and update with your token:
# JWT_TOKEN="your-fresh-jwt-token-here"
# 
# # Create a test job to generate telemetry
# echo "Creating test job..."
# curl -s -X POST http://localhost:3001/v1/jobs/summarize \
#   -H "Authorization: Bearer $JWT_TOKEN" \
#   -H "Content-Type: application/json" \
#   -d '{"text": "This is a test job to generate observability data"}' \
#   | jq '.'

echo ""
echo "Step 3: Accessing observability dashboards..."
echo ""
echo "🌐 Observability Dashboard URLs:"
echo "   • Jaeger (Traces):      http://localhost:16686"
echo "   • Prometheus (Metrics): http://localhost:9090"
echo "   • Grafana (Dashboards): http://localhost:3001 (admin/admin)"
echo "   • API Server:           http://localhost:3001/api/docs"
echo ""

echo "Step 4: Checking telemetry endpoints..."
echo "Testing OpenTelemetry endpoints..."

# Test OTLP HTTP endpoint
echo "Testing OTLP HTTP endpoint..."
if curl -s -X POST http://localhost:4318/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[{"resource":{"attributes":[{"key":"service.name","value":{"stringValue":"test-service"}}]},"scopeSpans":[{"spans":[{"traceId":"12345678901234567890123456789012","spanId":"1234567890123456","name":"test-span","startTimeUnixNano":"1640995200000000000","endTimeUnixNano":"1640995200000001000","status":{"code":"STATUS_CODE_OK"}}]}]}]}' > /dev/null; then
    echo "✅ OTLP HTTP endpoint is responding"
else
    echo "❌ OTLP HTTP endpoint is not responding"
fi

# Test Prometheus metrics endpoint
echo "Testing Prometheus metrics endpoint..."
if curl -s http://localhost:3001/metrics | grep -q "launchkit_"; then
    echo "✅ Prometheus metrics endpoint is working"
else
    echo "❌ Prometheus metrics endpoint is not working or no custom metrics found"
fi

echo ""
echo "Step 5: Verifying observability data..."
echo ""
echo "📊 What to look for in the dashboards:"
echo ""
echo "Jaeger (http://localhost:16686):"
echo "   • Search for 'launchkit-api' service"
echo "   • Look for traces with 'job.SUMMARIZE', 'webhook.deliver' spans"
echo "   • Check span attributes and events"
echo ""
echo "Prometheus (http://localhost:9090):"
echo "   • Query: launchkit_jobs_total"
echo "   • Query: launchkit_webhooks_total"
echo "   • Query: launchkit_job_duration_seconds"
echo ""
echo "Grafana (http://localhost:3001):"
echo "   • Login with admin/admin"
echo "   • View 'LaunchKit API Overview' dashboard"
echo "   • Check job processing rate, duration, and webhook metrics"
echo ""

echo "✅ Observability test complete!"
echo ""
echo "Next steps:"
echo "1. Create some jobs via the API to generate telemetry data"
echo "2. Check the dashboards for traces and metrics"
echo "3. Set up alerts in Grafana for production monitoring"
echo ""
echo "For production deployment:"
echo "• Update OTEL_EXPORTER_OTLP_*_ENDPOINT environment variables"
echo "• Configure proper sampling rates"
echo "• Set up log aggregation with Loki or similar"
echo "• Configure alerting rules in Prometheus/Grafana"
