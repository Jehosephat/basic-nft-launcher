# Quick Start Guide

## 🚀 Railway Deployment (2 Minutes - Zero Config!)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Railway deployment ready"
git push
```

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository

### Step 3: Add PostgreSQL
1. In Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway automatically provides database variables

### Step 4: Deploy
**That's it!** Railway automatically:
- ✅ Detects `backend/` as the service
- ✅ Builds frontend and backend
- ✅ Serves frontend from backend (unified service)
- ✅ Sets up database connection
- ✅ Configures CORS automatically

### Step 5: Generate Domain (Optional)
1. Go to Settings → Networking
2. Click "Generate Domain"
3. Your app is live!

**No environment variables needed!** Everything works automatically.

## 🏠 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (or Docker)

### Setup

```bash
# 1. Install dependencies
npm run install:all

# 2. Start PostgreSQL (Docker)
docker run --name postgres-nft \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=nft_collection \
  -p 5432:5432 -d postgres

# 3. Configure backend
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for local)

# 4. Run migrations
npm run migration:run

# 5. Start development
cd ..
npm run dev
```

Visit:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Health Check: http://localhost:4000/health

## 📚 Documentation

- **Full Deployment Guide**: See `RAILWAY_DEPLOYMENT_README.md`
- **Architecture Plan**: See `RAILWAY_DEPLOYMENT_PLAN.md`
- **Implementation Summary**: See `IMPLEMENTATION_SUMMARY.md`

## ✅ What's Changed

- ✅ PostgreSQL instead of SQLite
- ✅ Database migrations
- ✅ Railway-optimized configuration
- ✅ Health check endpoints
- ✅ Environment variable management
- ✅ Better error handling

## ✅ What's the Same

- ✅ Same UI form structure
- ✅ Same functionality (collections, classes, minting)
- ✅ All existing features
- ✅ All API endpoints

## 🆘 Troubleshooting

**Database connection fails?**
- Check PostgreSQL is running
- Verify `.env` file has correct credentials
- For Railway: Ensure `DATABASE_SSL=true`

**Migrations fail?**
- Check database connection
- Verify migration files exist
- Check logs: `npm run migration:run`

**CORS errors?**
- Verify `ALLOWED_ORIGINS` includes frontend URL
- No trailing slashes in URLs
- Check frontend `VITE_API_URL` is correct

## 🎉 You're Ready!

The app is now Railway-ready while maintaining all existing functionality!

