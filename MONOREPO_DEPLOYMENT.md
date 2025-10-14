# 🚀 Monorepo Deployment Guide for Railway

This guide explains how to deploy the LaunchKit monorepo to Railway, which will automatically detect and separate the API and frontend services.

## 📋 What Railway Auto-Detects

When you import the LaunchKit repository, Railway will automatically:

### 🎯 Service Detection
- **`/api`** → NestJS API service (backend)
- **`/app`** → Next.js frontend service (dashboard)
- **Root** → Monorepo configuration

### 🔧 Auto-Configuration
- Detects `package.json` in each service directory
- Uses service-specific `railway.json` and `nixpacks.toml` files
- Sets up proper build and start commands
- Configures health checks and restart policies

## 🚀 Deployment Steps

### Step 1: Import Repository

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your LaunchKit repository
5. Railway will automatically detect the monorepo structure

### Step 2: Add Required Services

Railway will create two services automatically. You need to add:

1. **PostgreSQL Database**
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
   - This will be shared between services

2. **Redis Instance**
   - Click **"+ New"** → **"Database"** → **"Redis"**
   - This will be shared between services

### Step 3: Configure Environment Variables

#### API Service Environment Variables
```bash
# Database (Railway provides this automatically)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (Railway provides this automatically)
REDIS_URL=${{Redis.REDIS_URL}}

# Authentication
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ISSUER=https://your-api.railway.app
CLERK_SECRET_KEY=sk_live_...

# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NODE_ENV=production
```

#### Frontend Service Environment Variables
```bash
# API URL (points to your deployed API service)
NEXT_PUBLIC_API_URL=https://your-api.railway.app/v1

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...

# App URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

### Step 4: Run Database Migrations

After deployment, run migrations for the API service:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Link to your project
railway link

# Switch to API service
railway service api

# Run migrations
railway run pnpm prisma migrate deploy

# Seed database (optional)
railway run pnpm prisma db seed
```

## 📁 File Structure for Railway

```
LaunchKit/
├── railway.json              # Root monorepo config
├── nixpacks.toml             # Root build config
├── package.json              # Root package.json
├── api/
│   ├── railway.json          # API service config
│   ├── nixpacks.toml         # API build config
│   ├── package.json          # API dependencies
│   └── src/                  # API source code
├── app/
│   ├── railway.json          # Frontend service config
│   ├── nixpacks.toml         # Frontend build config
│   ├── package.json          # Frontend dependencies
│   └── src/                  # Frontend source code
└── README.md
```

## 🔧 Service Configurations

### API Service (`/api`)

**railway.json**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "deploy": {
    "startCommand": "PORT=$PORT node dist/main.js",
    "healthcheckPath": "/v1/health",
    "healthcheckTimeout": 100
  }
}
```

**nixpacks.toml**:
```toml
[phases.build]
cmds = [
  'pnpm prisma generate',
  'pnpm build'
]

[phases.deploy]
cmds = ['pnpm prisma migrate deploy']

[start]
cmd = 'PORT=$PORT node dist/main.js'
```

### Frontend Service (`/app`)

**railway.json**:
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "deploy": {
    "startCommand": "pnpm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 60
  }
}
```

**nixpacks.toml**:
```toml
[phases.build]
cmds = ['pnpm build']

[start]
cmd = 'pnpm start'
```

## 🌐 Accessing Your Services

After deployment, you'll get:

- **API Service**: `https://your-api.railway.app`
- **Frontend Service**: `https://your-frontend.railway.app`
- **Database**: Accessible via Railway dashboard
- **Redis**: Accessible via Railway dashboard

## 🔄 Updates and Maintenance

### Deploy Updates
```bash
# Push changes to your repository
git push origin master

# Railway will automatically redeploy all services
```

### View Logs
```bash
# API service logs
railway logs --service api

# Frontend service logs
railway logs --service app

# All services logs
railway logs
```

### Database Operations
```bash
# Connect to database
railway connect postgres

# Run migrations
railway run pnpm prisma migrate deploy

# Open Prisma Studio
railway run pnpm prisma studio
```

## 🛠️ Troubleshooting

### Common Issues

1. **Build Failures**
   - Check service-specific logs
   - Verify environment variables are set
   - Ensure all dependencies are installed

2. **Database Connection Issues**
   - Verify `DATABASE_URL` is set correctly
   - Check if migrations have been run
   - Ensure database service is running

3. **Service Communication Issues**
   - Verify `NEXT_PUBLIC_API_URL` points to correct API service
   - Check CORS settings in API service
   - Ensure both services are deployed and healthy

### Debug Commands

```bash
# Check service status
railway status

# View service details
railway service api
railway service app

# Check environment variables
railway variables

# SSH into service
railway shell --service api
```

## 📈 Scaling

Railway automatically scales your services based on demand:

- **API Service**: Scales based on CPU/memory usage
- **Frontend Service**: Scales based on request volume
- **Database**: Managed scaling with connection pooling
- **Redis**: Managed scaling with clustering

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

## 🎯 Next Steps

After successful deployment:

1. **Test all endpoints**:
   - API health check: `https://your-api.railway.app/v1/health`
   - Frontend: `https://your-frontend.railway.app`

2. **Set up monitoring**:
   - Configure alerts
   - Set up uptime monitoring
   - Monitor error rates

3. **Configure custom domains**:
   - Set up custom domain for API
   - Set up custom domain for frontend
   - Update environment variables

4. **Set up CI/CD**:
   - Configure automatic deployments
   - Set up staging environments
   - Implement automated testing

---

**Happy Deploying! 🚀**

For more help, check the [Railway Documentation](https://docs.railway.app) or join the [Railway Discord](https://discord.gg/railway).
