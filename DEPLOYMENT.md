# 🚀 LaunchKit Deployment Guide

This guide covers multiple deployment options for the LaunchKit platform.

## 📋 Prerequisites

Before deploying, ensure you have:

1. **Environment Variables**:
   ```bash
   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Database
   DATABASE_URL=postgresql://user:pass@host:port/db
   
   # Redis
   REDIS_URL=redis://localhost:6379
   
   # Stripe
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   
   # Optional: OpenTelemetry
   OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
   ```

2. **External Services**:
   - Clerk account for authentication
   - Stripe account for billing
   - PostgreSQL database
   - Redis instance

## 🎯 Deployment Options

### Option 1: Vercel (Recommended)

**Best for**: Quick deployment, automatic scaling, built-in CDN

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts to configure:
# - Link to existing project or create new
# - Set environment variables
# - Configure build settings
```

**Configuration**:
- **Build Command**: `cd app && npm run build`
- **Output Directory**: `app/.next`
- **Install Command**: `npm install -g pnpm && pnpm install`

**Environment Variables** (set in Vercel dashboard):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Option 2: Railway

**Best for**: Full-stack deployment with managed database

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Services to add**:
- PostgreSQL database
- Redis instance
- Environment variables

### Option 3: DigitalOcean App Platform

**Best for**: Production-ready with managed services

1. **Connect Repository**:
   - Go to DigitalOcean App Platform
   - Connect your GitHub repository

2. **Configure Services**:
   - **Frontend**: Next.js app
   - **API**: Node.js service
   - **Database**: Managed PostgreSQL
   - **Cache**: Managed Redis

3. **Environment Variables**:
   Set all required environment variables in the dashboard

### Option 4: Docker Deployment

**Best for**: Maximum control and portability

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Or deploy to cloud provider with Docker support
# (AWS ECS, Google Cloud Run, Azure Container Instances)
```

## 🔧 Production Configuration

### Database Setup

```bash
# Run migrations
cd api && pnpm prisma db push

# Seed production data (optional)
cd api && pnpm prisma db seed
```

### Redis Configuration

Ensure Redis is accessible and configured for production:
- Enable persistence
- Set appropriate memory limits
- Configure authentication if needed

### Stripe Webhooks

Configure webhook endpoints in Stripe dashboard:
- **URL**: `https://yourdomain.com/v1/webhooks/stripe`
- **Events**: `customer.subscription.updated`, `invoice.payment_succeeded`, etc.

### Clerk Configuration

Update Clerk dashboard:
- **Frontend API URL**: `https://yourdomain.com`
- **Backend API URL**: `https://yourdomain.com/v1`

## 📊 Monitoring & Observability

### Health Checks

The API includes health check endpoints:
- `GET /health` - Basic health check
- `GET /v1/admin/queue/metrics` - Queue metrics

### OpenTelemetry

For production monitoring:
1. Set up Jaeger/Prometheus/Grafana
2. Configure `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`
3. Enable metrics collection

### Logging

Configure structured logging:
```bash
# Set log level
LOG_LEVEL=info

# Configure log format
LOG_FORMAT=json
```

## 🔒 Security Considerations

### Environment Variables
- Never commit secrets to version control
- Use secure secret management (Vercel, Railway, etc.)
- Rotate keys regularly

### Database Security
- Use connection pooling
- Enable SSL/TLS
- Restrict network access

### API Security
- Rate limiting (implement if needed)
- CORS configuration
- Input validation

## 🚀 Quick Start Commands

### Local Development
```bash
# Start all services
docker-compose up -d

# Run migrations
cd api && pnpm prisma db push

# Start development servers
cd api && pnpm dev &
cd app && pnpm dev
```

### Production Deployment
```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up -d

# Check health
curl http://localhost:3001/health
curl http://localhost:3000
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Use load balancer for multiple API instances
- Configure Redis clustering for high availability
- Use managed database with read replicas

### Performance Optimization
- Enable Redis caching
- Optimize database queries
- Use CDN for static assets
- Implement connection pooling

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection**:
   ```bash
   # Check connection
   cd api && pnpm prisma db pull
   ```

2. **Redis Connection**:
   ```bash
   # Test Redis
   redis-cli ping
   ```

3. **Environment Variables**:
   ```bash
   # Verify all required vars are set
   echo $DATABASE_URL
   echo $REDIS_URL
   ```

### Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Check Redis connectivity
5. Review Stripe webhook configuration

## 📝 Next Steps

After successful deployment:

1. **Test all features**:
   - User authentication
   - API key creation
   - Job processing
   - Billing integration
   - Webhook delivery

2. **Set up monitoring**:
   - Application metrics
   - Error tracking
   - Performance monitoring

3. **Configure backups**:
   - Database backups
   - Redis persistence
   - Application logs

4. **Plan scaling**:
   - Load testing
   - Capacity planning
   - Auto-scaling configuration
