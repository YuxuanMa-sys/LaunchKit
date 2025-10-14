# 🚀 Railway Deployment Guide for LaunchKit

This guide will help you deploy LaunchKit to Railway, a modern platform for deploying full-stack applications.

## 📋 Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **Railway CLI**: Install with `npm install -g @railway/cli`
3. **Git Repository**: Your LaunchKit code pushed to GitHub/GitLab

## 🚀 Quick Deployment

### Option 1: Using the Deployment Script

```bash
# Make sure you're in the project root
cd /path/to/LaunchKit

# Run the deployment script
pnpm run railway:deploy
```

### Option 2: Manual Deployment

```bash
# Login to Railway
railway login

# Create a new project
railway project new

# Add PostgreSQL database
railway add postgresql

# Add Redis
railway add redis

# Deploy the application
railway up
```

## 🔧 Configuration

### 1. Environment Variables

Set these in your Railway dashboard:

#### Required Variables
```bash
# Database (Railway provides this automatically)
DATABASE_URL=postgresql://postgres:password@host:port/db

# Redis (Railway provides this automatically)  
REDIS_URL=redis://host:port

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ISSUER=https://your-app.railway.app
CLERK_SECRET_KEY=sk_live_...

# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Optional Variables
```bash
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=launchkit-production

# App Configuration
NODE_ENV=production
API_URL=https://your-api.railway.app
DASHBOARD_URL=https://your-app.railway.app
CORS_ORIGINS=https://your-app.railway.app

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

### 2. Database Setup

After deployment, run migrations:

```bash
# Connect to your Railway project
railway link

# Run migrations
pnpm run railway:migrate

# Seed database (optional)
pnpm run railway:seed
```

### 3. Custom Domain (Optional)

1. Go to your Railway project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Update environment variables with new domain

## 📊 Monitoring

### Health Checks

Railway automatically monitors your app using:
- **Health Check Endpoint**: `/v1/health`
- **Timeout**: 100 seconds
- **Restart Policy**: On failure with max 10 retries

### Logs

```bash
# View real-time logs
railway logs

# View logs with timestamps
railway logs --timestamps

# Filter logs by service
railway logs --service api
```

### Metrics

Railway provides built-in metrics:
- CPU usage
- Memory usage
- Network I/O
- Response times

## 🔄 Updates and Maintenance

### Deploy Updates

```bash
# Push changes to your repository
git push origin master

# Railway will automatically deploy
```

### Database Migrations

```bash
# Create new migration
cd api && pnpm prisma migrate dev --name migration_name

# Deploy migration
pnpm run railway:migrate
```

### Scaling

In Railway dashboard:
1. Go to your service
2. Navigate to Settings → Scaling
3. Adjust resources as needed

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database URL
railway variables

# Test connection
railway connect postgres
```

#### 2. Build Failures
```bash
# Check build logs
railway logs --service build

# Verify Node.js version in nixpacks.toml
```

#### 3. Environment Variables Not Set
```bash
# List all variables
railway variables

# Set missing variables
railway variables set KEY=value
```

### Debug Commands

```bash
# SSH into your Railway container
railway shell

# Check service status
railway status

# View deployment history
railway deployments
```

## 🔒 Security Best Practices

### 1. Environment Variables
- Never commit secrets to git
- Use Railway's secure variable storage
- Rotate keys regularly

### 2. Database Security
- Railway provides SSL connections by default
- Use strong passwords
- Enable connection pooling

### 3. API Security
- Set up proper CORS origins
- Use HTTPS (Railway provides this automatically)
- Implement rate limiting

## 📈 Performance Optimization

### 1. Database
- Use connection pooling
- Optimize queries
- Set up read replicas if needed

### 2. Redis
- Enable persistence
- Monitor memory usage
- Use appropriate data structures

### 3. Application
- Enable compression
- Use CDN for static assets
- Implement caching strategies

## 💰 Cost Optimization

### Railway Pricing
- **Hobby Plan**: $5/month (good for development)
- **Pro Plan**: $20/month (recommended for production)
- **Team Plan**: $99/month (for teams)

### Cost-Saving Tips
1. Use appropriate resource limits
2. Monitor usage regularly
3. Optimize database queries
4. Use Redis for caching
5. Implement efficient logging

## 🆘 Support

### Railway Support
- [Railway Documentation](https://docs.railway.app)
- [Railway Discord](https://discord.gg/railway)
- [Railway Status](https://status.railway.app)

### LaunchKit Support
- [GitHub Issues](https://github.com/your-org/launchkit/issues)
- [Documentation](https://docs.launchkit.ai)

## 🎯 Next Steps

After successful deployment:

1. **Test all endpoints**:
   ```bash
   curl https://your-app.railway.app/v1/health
   ```

2. **Set up monitoring**:
   - Configure alerts
   - Set up uptime monitoring
   - Monitor error rates

3. **Configure backups**:
   - Database backups
   - Redis persistence
   - Application logs

4. **Set up CI/CD**:
   - GitHub Actions
   - Automated testing
   - Staging environments

## 📝 Example Railway Configuration

### railway.json
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "cd api && PORT=$PORT node dist/main.js",
    "healthcheckPath": "/v1/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### nixpacks.toml
```toml
[phases.setup]
nixPkgs = ['nodejs_18', 'pnpm']

[phases.install]
cmds = ['pnpm install --no-frozen-lockfile']

[phases.build]
cmds = [
  'pnpm --filter api exec prisma generate',
  'pnpm --filter api build'
]

[phases.deploy]
cmds = [
  'cd api && pnpm prisma migrate deploy'
]

[start]
cmd = 'cd api && PORT=$PORT node dist/main.js'
```

---

**Happy Deploying! 🚀**

For more help, check the [Railway Documentation](https://docs.railway.app) or join the [Railway Discord](https://discord.gg/railway).
