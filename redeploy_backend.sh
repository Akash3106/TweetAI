#!/bin/bash

echo "🔧 Redeploying backend with CORS fix..."

# Navigate to backend directory
cd backend

# Deploy to Railway
echo "🚀 Deploying to Railway..."
railway up

echo "✅ Backend redeployment complete!"
echo "🌐 CORS now allows: https://tweet-ai-ivory.vercel.app"
echo ""
echo "📝 Next steps:"
echo "   1. Wait 2-3 minutes for deployment to complete"
echo "   2. Test the URL analysis feature in your frontend"
echo "   3. If still having issues, check Railway logs" 