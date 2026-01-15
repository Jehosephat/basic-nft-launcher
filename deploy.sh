#!/bin/bash
# Deployment script for Ubuntu VPS
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Pull latest changes (if using git)
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes..."
    git pull origin main || git pull origin master
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Build application
echo "🔨 Building application..."
npm run build

# Copy frontend to backend for serving
echo "📋 Copying frontend files..."
mkdir -p backend/frontend-dist
cp -r frontend/dist/* backend/frontend-dist/

# Create logs directory if it doesn't exist
mkdir -p logs

# Restart application with PM2
echo "🔄 Restarting application..."
if pm2 list | grep -q "nft-launcher"; then
    pm2 restart nft-launcher
else
    pm2 start ecosystem.config.js
    pm2 save
fi

echo "✅ Deployment complete!"
echo "📊 Check status with: pm2 status"
echo "📝 View logs with: pm2 logs nft-launcher"
