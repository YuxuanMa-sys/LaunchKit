#!/bin/bash

# LaunchKit Frontend Deployment Script
echo "🚀 Deploying LaunchKit Frontend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Navigate to frontend directory
cd app

# Login to Railway (if not already logged in)
echo "🔐 Checking Railway authentication..."
if ! railway whoami &> /dev/null; then
    echo "Please login to Railway:"
    railway login
fi

# Create new Railway project for frontend
echo "📦 Creating Railway project for frontend..."
railway new --name launchkit-frontend

# Set environment variables
echo "🔧 Setting environment variables..."
railway variables set NODE_ENV=production
railway variables set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY"
railway variables set CLERK_SECRET_KEY="$CLERK_SECRET_KEY"

# Get API URL from Railway
echo "🔗 Getting API URL..."
API_URL=$(railway status --json | jq -r '.services[] | select(.name=="launchkit") | .url' 2>/dev/null || echo "")
if [ -z "$API_URL" ]; then
    echo "⚠️  Could not find API URL automatically. Please set it manually:"
    echo "railway variables set NEXT_PUBLIC_API_URL=https://your-api-url.railway.app/v1"
else
    echo "✅ Found API URL: $API_URL"
    railway variables set NEXT_PUBLIC_API_URL="$API_URL/v1"
fi

# Deploy
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Frontend deployment complete!"
echo "🌐 Your frontend will be available at: https://launchkit-frontend-production.up.railway.app"
echo ""
echo "📋 Next steps:"
echo "1. Update Clerk dashboard with new frontend URL"
echo "2. Test the frontend-backend integration"
echo "3. Update any hardcoded URLs in your code"
