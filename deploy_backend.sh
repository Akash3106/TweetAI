#!/bin/bash

echo "🚀 Deploying updated backend to Railway..."

# Navigate to backend directory
cd backend

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "npm install -g @railway/cli"
    exit 1
fi

# Login to Railway (if not already logged in)
echo "📝 Checking Railway login status..."
railway whoami

# Install/update dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Backend deployment complete!"
echo "🌐 Your backend is now available at: https://fastapi-production-9cc6.up.railway.app"
echo ""
echo "📝 Important: Make sure to update your Twitter App settings:"
echo "   - Callback URL: https://fastapi-production-9cc6.up.railway.app/api/twitter/callback"
echo "   - Website URL: https://fastapi-production-9cc6.up.railway.app" 