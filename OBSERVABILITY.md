# LaunchKit Observability Stack

## Overview

LaunchKit uses a comprehensive observability stack built on OpenTelemetry, providing distributed tracing, metrics collection, and visualization. This setup gives you complete visibility into your application's performance, behavior, and health.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   LaunchKit     │    │  OpenTelemetry   │    │   Observability │
│     API         │───▶│    Collector     │───▶│     Stack       │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │     Jaeger      │
                    │   (Traces)      │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   Prometheus    │
                    │   (Metrics)     │
                    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │    Grafana      │
                    │ (Dashboards)    │
                    └─────────────────┘
```

## Components

### 1. OpenTelemetry (OTel)
**Purpose**: Standardized observability framework
**Location**: `api/src/instrumentation.ts`

**What it does**:
- Automatically instruments HTTP requests, Express routes, and Redis operations
- Creates distributed traces showing request flow through your application
- Collects performance metrics and custom business metrics
- Exports telemetry data to external systems

**Key Features**:
- **Auto-instrumentation**: Automatically traces HTTP requests, database calls, Redis operations
- **Custom spans**: Manual instrumentation for job processing and webhook delivery
- **Resource attributes**: Service name, version, environment metadata
- **OTLP export**: Sends data to OpenTelemetry Collector

### 2. Jaeger
**Purpose**: Distributed tracing system
**URL**: http://localhost:16686
**Login**: No authentication required

**What it shows**:
- **Request traces**: Complete request lifecycle from API call to response
- **Service map**: Visual representation of service interactions
- **Performance analysis**: Request duration, bottlenecks, error rates
- **Custom spans**: Job processing steps, webhook delivery attempts

**Key Features**:
- **Trace search**: Find traces by service, operation, tags, time range
- **Span details**: View individual operations with timing and metadata
- **Error tracking**: Identify failed requests and their causes
- **Performance profiling**: Understand where time is spent in your application

### 3. Prometheus
**Purpose**: Metrics storage and querying
**URL**: http://localhost:9090
**Login**: No authentication required

**What it stores**:
- **HTTP metrics**: Request count, duration, status codes
- **Custom metrics**: Job processing time, webhook delivery metrics
- **System metrics**: Memory usage, CPU, Redis operations
- **Business metrics**: API usage, error rates, throughput

**Key Features**:
- **Time-series database**: Stores metrics with timestamps
- **PromQL queries**: Powerful query language for metrics analysis
- **Alerting**: Set up alerts based on metric thresholds
- **Data retention**: Configurable retention policies

### 4. Grafana
**Purpose**: Metrics visualization and dashboards
**URL**: http://localhost:3010
**Login**: `admin` / `admin`

**What it displays**:
- **LaunchKit Overview Dashboard**: Pre-built dashboard with key metrics
- **Custom visualizations**: Charts, graphs, tables, heatmaps
- **Alerting**: Visual alerts and notifications
- **Multi-datasource**: Can query Prometheus, Jaeger, and other sources

**Key Features**:
- **Pre-built dashboards**: LaunchKit-specific metrics and visualizations
- **Real-time updates**: Live data refresh and monitoring
- **Custom queries**: Create your own metrics and visualizations
- **Export/Import**: Share dashboards and configurations

## Setup Instructions

### 1. Start the Observability Stack

```bash
# Start all observability services
docker compose -f docker-compose.observability.yml up -d

# Check service status
docker compose -f docker-compose.observability.yml ps
```

**Services started**:
- **Jaeger**: Port 16686 (UI), 14268 (collector)
- **Prometheus**: Port 9090 (UI)
- **Grafana**: Port 3010 (UI)
- **OTel Collector**: Ports 4317 (gRPC), 4318 (HTTP)

### 2. Start the API Server

```bash
cd api
pnpm dev
```

The API will automatically start sending telemetry data to the OTel Collector.

### 3. Generate Telemetry Data

```bash
# Get your API key from the dashboard
export API_KEY="lk_live_xxxxx"

# Create jobs to generate traces and metrics
for i in {1..5}; do
  curl -X POST http://localhost:3001/v1/jobs/summarize \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"text\": \"Test message $i for observability\"}"
  sleep 2
done
```

## Usage Guide

### Viewing Traces in Jaeger

1. **Open Jaeger UI**: http://localhost:16686
2. **Select Service**: Choose `launchkit-api`
3. **Find Traces**: Click "Find Traces"
4. **Explore Traces**: Click on individual traces to see detailed spans

**What to look for**:
- **HTTP spans**: API request/response cycles
- **Job processing spans**: Custom spans with events like `job.started`, `job.processing`, `job.completed`
- **Webhook spans**: Webhook delivery attempts with retry logic
- **Redis spans**: Database operations and queue interactions

### Querying Metrics in Prometheus

1. **Open Prometheus UI**: http://localhost:9090
2. **Set time range**: Use "Last 1 hour" or "Last 5 minutes"
3. **Try these queries**:
   - `up` - Service availability
   - `http_server_duration_milliseconds` - HTTP request duration
   - `job_processing_duration_seconds` - Job processing time (when metrics are enabled)
   - `webhook_delivery_duration_seconds` - Webhook delivery time (when metrics are enabled)

### Using Grafana Dashboards

1. **Open Grafana**: http://localhost:3010
2. **Login**: `admin` / `admin`
3. **Navigate**: Dashboards → LaunchKit API Overview
4. **View metrics**: Real-time charts and visualizations

**Dashboard panels**:
- **Job Processing Rate**: Jobs processed per second
- **Job Processing Duration**: 95th percentile processing time
- **Webhook Delivery Rate**: Webhooks delivered per second
- **Token Usage Rate**: API tokens consumed per second

## Custom Instrumentation

### Job Processing Spans

**Location**: `api/src/modules/queue/processors/ai-jobs.processor.ts`

```typescript
// Create custom span for job processing
const span = this.telemetryService.createJobSpan(jobType, jobId);

// Add events to the span
span.addEvent('job.started', { jobId, jobType });
span.addEvent('job.processing', { model: 'gpt-4' });
span.addEvent('job.completed', { tokens: 150, duration: 2.5 });

// Record custom metrics
this.telemetryService.recordJobMetrics(jobType, duration, tokens);
```

### Webhook Delivery Spans

**Location**: `api/src/modules/queue/processors/webhook.processor.ts`

```typescript
// Create custom span for webhook delivery
const span = this.telemetryService.createWebhookSpan(url, eventType);

// Add events to the span
span.addEvent('webhook.attempt', { attempt: 1, url });
span.addEvent('webhook.success', { statusCode: 200 });

// Record custom metrics
this.telemetryService.recordWebhookMetrics(url, duration, statusCode);
```

## Configuration Files

### OpenTelemetry Configuration
**File**: `api/src/instrumentation.ts`

```typescript
const sdk = new NodeSDK({
  resource: new Resource({
    'service.name': 'launchkit-api',
    'service.version': '1.0.0',
    'deployment.environment': process.env.NODE_ENV || 'development',
  }),
  traceExporter: new OTLPTraceExporter({
    url: 'http://localhost:4318/v1/traces',
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-http': { enabled: true },
      '@opentelemetry/instrumentation-express': { enabled: true },
      '@opentelemetry/instrumentation-ioredis': { enabled: true },
    }),
  ],
});
```

### Docker Compose Configuration
**File**: `docker-compose.observability.yml`

```yaml
services:
  jaeger:
    image: jaegertracing/all-in-one:1.51
    ports:
      - "16686:16686"  # Jaeger UI
      - "14268:14268"  # Jaeger HTTP collector

  prometheus:
    image: prom/prometheus:v2.45.0
    ports:
      - "9090:9090"   # Prometheus UI

  grafana:
    image: grafana/grafana:10.1.0
    ports:
      - "3010:3000"   # Grafana UI
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin

  otel-collector:
    image: otel/opentelemetry-collector-contrib:0.88.0
    ports:
      - "4317:4317"   # OTLP gRPC receiver
      - "4318:4318"   # OTLP HTTP receiver
```

### Prometheus Configuration
**File**: `api/prometheus.yml`

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'otel-collector'
    static_configs:
      - targets: ['otel-collector:8888']
  
  - job_name: 'launchkit-api'
    static_configs:
      - targets: ['host.docker.internal:3001']
```

## Troubleshooting

### Common Issues

1. **No traces in Jaeger**:
   - Ensure API server is running
   - Check that requests are being made to the API
   - Verify OTel Collector is running and accessible

2. **No metrics in Prometheus**:
   - Metrics are currently disabled due to package version conflicts
   - Traces are fully functional
   - HTTP metrics should still be available from auto-instrumentation

3. **Grafana shows "No data"**:
   - Set correct time range (Last 1 hour)
   - Ensure Prometheus is collecting metrics
   - Check datasource configuration

4. **Port conflicts**:
   - Grafana uses port 3010 (not 3001)
   - API server uses port 3001
   - Check `docker compose ps` for port mappings

### Debugging Commands

```bash
# Check container status
docker compose -f docker-compose.observability.yml ps

# View container logs
docker compose -f docker-compose.observability.yml logs jaeger
docker compose -f docker-compose.observability.yml logs prometheus
docker compose -f docker-compose.observability.yml logs grafana
docker compose -f docker-compose.observability.yml logs otel-collector

# Restart services
docker compose -f docker-compose.observability.yml restart

# Stop all services
docker compose -f docker-compose.observability.yml down
```

## Production Considerations

### Security
- Change default Grafana credentials
- Use authentication for Prometheus and Jaeger
- Secure OTLP endpoints with TLS
- Implement proper network segmentation

### Performance
- Configure appropriate retention policies
- Use sampling for high-volume traces
- Optimize metric collection intervals
- Monitor observability stack resource usage

### Scalability
- Use distributed tracing for microservices
- Implement metric aggregation
- Consider using managed observability services
- Plan for data storage and archival

## Next Steps

1. **Enable Metrics**: Resolve OpenTelemetry package version conflicts to enable custom metrics
2. **Add Alerts**: Configure Prometheus alerts for critical metrics
3. **Custom Dashboards**: Create additional Grafana dashboards for specific use cases
4. **Log Integration**: Add structured logging with correlation IDs
5. **APM Integration**: Consider integrating with Application Performance Monitoring tools

## Resources

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [OTel Collector Documentation](https://opentelemetry.io/docs/collector/)
