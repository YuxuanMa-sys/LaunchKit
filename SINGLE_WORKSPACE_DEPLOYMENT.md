# LaunchKit Single Workspace Deployment Guide

Deploy all services (API, Frontend, Database, Redis) in one Railway workspace.

## 🏗️ Architecture

```
Railway Workspace: LaunchKit
├── 🗄️  PostgreSQL (Database Service)
├── 🔴 Redis (Cache/Queue Service)  
├── 🚀 API Service (subdirectory: /api)
└── 🌐 Frontend Service (subdirectory: /app)
```

## 🚀 Deployment Steps

### **Step 1: Add Frontend Service to Existing Workspace**

1. **Go to your existing Railway workspace** (with API already deployed)
2. **Click "New Service"** (not "New Project")
3. **Select "Deploy from GitHub repo"**
4. **Choose your LaunchKit repository**
5. **Select "Deploy from a subdirectory"**
6. **Enter subdirectory**: `app`
7. **Click "Deploy"**

### **Step 2: Configure Service Settings**

#### **API Service** (update existing):
- **Settings** → **Source**
- **Root Directory**: `api`
- **Build Command**: `pnpm --filter api build`
- **Start Command**: `cd api && node dist/main.js`

#### **Frontend Service** (new):
- **Settings** → **Source**  
- **Root Directory**: `app`
- **Build Command**: `pnpm --filter app build`
- **Start Command**: `cd .. && pnpm --filter app start`

### **Step 3: Environment Variables**

#### **API Service Variables**:
```
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
CLERK_SECRET_KEY=sk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### **Frontend Service Variables**:
```
NODE_ENV=production
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=${{API.PUBLIC_URL}}/v1
```

### **Step 4: Service Connections**

Railway will automatically detect and connect services:
- ✅ **API** → **PostgreSQL** (via `${{Postgres.DATABASE_URL}}`)
- ✅ **API** → **Redis** (via `${{Redis.REDIS_URL}}`)
- ✅ **Frontend** → **API** (via `${{API.PUBLIC_URL}}`)

## 🔧 Configuration Files

### **Root `nixpacks.toml`** (for API):
```toml
[phases.setup]
nixPkgs = ['nodejs_18', 'pnpm']

[phases.install]
cmds = ['pnpm install --no-frozen-lockfile']

[phases.build]
cmds = [
  'pnpm --filter api exec prisma generate',
  'pnpm --filter api build',
  'pnpm --filter app build'
]

[start]
cmd = 'cd api && node dist/main.js'
```

### **`app/nixpacks.toml`** (for Frontend):
```toml
[phases.setup]
nixPkgs = ['nodejs_18', 'pnpm']

[phases.install]
cmds = ['cd .. && pnpm install --no-frozen-lockfile']

[phases.build]
cmds = ['cd .. && pnpm --filter app build']

[start]
cmd = 'cd .. && pnpm --filter app start'
```

## 🌐 URLs After Deployment

- **Frontend**: `https://launchkit-frontend-production.up.railway.app`
- **API**: `https://launchkit-production.up.railway.app`
- **API Docs**: `https://launchkit-production.up.railway.app/api/docs`

## 🔄 Updates

To update any service:

1. **Push code to GitHub**
2. **Railway automatically detects changes**
3. **Rebuilds and redeploys affected services**

## 🎯 Benefits of Single Workspace

✅ **Unified Management**: All services in one place
✅ **Shared Environment Variables**: Easy to manage
✅ **Automatic Service Discovery**: Services can reference each other
✅ **Cost Effective**: Single workspace billing
✅ **Simplified Deployment**: One-click deployments
✅ **Better Monitoring**: All services in one dashboard

## 🔍 Troubleshooting

### Build Failures
- Check root directory settings
- Verify build commands use correct paths
- Ensure `package.json` scripts are correct

### Service Communication
- Verify environment variable references
- Check service URLs in Railway dashboard
- Test API endpoints directly

### Environment Variables
- Use `${{Service.VARIABLE}}` syntax for service references
- Set public variables in each service
- Check variable names are case-sensitive

## 📊 Monitoring

- **Railway Dashboard**: Monitor all services
- **Build Logs**: Check for build errors
- **Runtime Logs**: Monitor application performance
- **Metrics**: Track resource usage

## 🚀 Next Steps

After successful deployment:

1. **Update Clerk dashboard** with frontend URL
2. **Test all integrations** end-to-end
3. **Set up custom domains** (optional)
4. **Configure monitoring** and alerts
5. **Set up staging environment**
