#!/bin/bash

# Railway Deployment Script for LaunchKit
# This script helps deploy LaunchKit to Railway

set -e

echo "🚀 LaunchKit Railway Deployment Script"
echo "======================================"

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI is not installed"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if user is logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please log in to Railway first:"
    railway login
fi

echo "📋 Current Railway status:"
railway whoami

# Ask for deployment type
echo ""
echo "Choose deployment type:"
echo "1) Deploy API only (backend)"
echo "2) Deploy full stack (API + database + Redis)"
echo "3) Update existing deployment"

read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "🚀 Deploying API to Railway..."
        railway up
        ;;
    2)
        echo "🚀 Deploying full stack to Railway..."
        
        # Create new project
        echo "Creating new Railway project..."
        railway project new
        
        # Add PostgreSQL
        echo "Adding PostgreSQL database..."
        railway add postgresql
        
        # Add Redis
        echo "Adding Redis..."
        railway add redis
        
        # Deploy the app
        echo "Deploying application..."
        railway up
        
        echo "✅ Full stack deployed!"
        echo "📝 Don't forget to:"
        echo "   1. Set environment variables in Railway dashboard"
        echo "   2. Run database migrations: railway run pnpm prisma migrate deploy"
        echo "   3. Seed database: railway run pnpm prisma db seed"
        ;;
    3)
        echo "🔄 Updating existing deployment..."
        railway up
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo "📚 Check your deployment at: https://railway.app"
echo "🔍 View logs with: railway logs"
echo "🔧 Connect to database with: railway connect postgres"
