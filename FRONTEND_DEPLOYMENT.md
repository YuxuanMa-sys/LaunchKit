# LaunchKit Frontend Deployment Guide

This guide shows how to deploy the LaunchKit frontend to Railway as a separate service.

## 🏗️ Architecture

After deployment, you'll have:
- **Frontend**: `https://launchkit-frontend.railway.app`
- **API**: `https://launchkit-api.railway.app` (your existing API)

## 🚀 Quick Deployment

### Option 1: Automated Script
```bash
./deploy-frontend.sh
```

### Option 2: Manual Deployment

1. **Navigate to frontend directory:**
   ```bash
   cd app
   ```

2. **Create new Railway project:**
   ```bash
   railway new --name launchkit-frontend
   ```

3. **Set environment variables:**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
   railway variables set CLERK_SECRET_KEY="sk_test_..."
   railway variables set NEXT_PUBLIC_API_URL="https://your-api-url.railway.app/v1"
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

## 🔧 Configuration Files

### `app/railway.json`
- Railway-specific configuration
- Health check endpoint: `/`
- Timeout: 60 seconds

### `app/nixpacks.toml`
- Build configuration for Railway
- Uses Node.js 18 and pnpm
- Builds and starts the Next.js app

### `app/.railwayignore`
- Excludes development files
- Excludes API directory (frontend only)

## 🌐 Environment Variables

Set these in Railway dashboard:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key | `pk_test_...` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `NEXT_PUBLIC_API_URL` | API base URL | `https://api.railway.app/v1` |

## 🔗 Update Clerk Configuration

After deployment, update your Clerk dashboard:

1. Go to **Domains** in Clerk dashboard
2. Add your new frontend URL:
   - `https://launchkit-frontend.railway.app`
   - `https://launchkit-frontend.railway.app/dashboard`

## 🧪 Testing

1. **Visit your frontend URL**
2. **Test authentication flow**
3. **Verify API calls work**
4. **Check dashboard functionality**

## 🔍 Troubleshooting

### Build Failures
- Check `nixpacks.toml` configuration
- Verify `package.json` scripts
- Check Railway build logs

### Environment Variables
- Ensure all required variables are set
- Check variable names (case-sensitive)
- Verify API URL format

### CORS Issues
- Update API CORS settings to include frontend domain
- Check `NEXT_PUBLIC_API_URL` is correct

## 📊 Monitoring

- **Railway Dashboard**: Monitor deployment status
- **Build Logs**: Check for build errors
- **Runtime Logs**: Monitor application performance

## 🎯 Next Steps

After successful deployment:

1. **Update DNS** (if using custom domain)
2. **Set up monitoring** and alerts
3. **Configure CI/CD** for automatic deployments
4. **Test all features** end-to-end
5. **Set up staging environment**

## 🔄 Updates

To update the frontend:

```bash
cd app
git add .
git commit -m "Update frontend"
git push origin master
railway up
```

Railway will automatically rebuild and deploy!
