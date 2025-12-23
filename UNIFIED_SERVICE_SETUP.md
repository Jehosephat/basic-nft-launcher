# Unified Service Setup Guide

Since Railway is detecting your project as a unified service (single service for both frontend and backend), here's how to configure it properly.

## Current Setup

Railway is showing a single service because:
- The `railway.json` is configured to deploy only the backend
- Railway auto-detected the monorepo structure
- No separate frontend service was created

## Configuration Steps

### 1. Update Railway Environment Variables

In your Railway service settings, set:

```env
NODE_ENV=production
PORT=${{PORT}}

# Database (from PostgreSQL plugin)
DATABASE_HOST=${{Postgres.DATABASE_HOST}}
DATABASE_PORT=${{Postgres.DATABASE_PORT}}
DATABASE_USER=${{Postgres.DATABASE_USER}}
DATABASE_PASSWORD=${{Postgres.DATABASE_PASSWORD}}
DATABASE_NAME=${{Postgres.DATABASE_NAME}}
DATABASE_SSL=true

# CORS - Use the same domain as your backend service
# Generate domain first, then use it here
ALLOWED_ORIGINS=https://your-backend-service.up.railway.app

# GalaChain API
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

# Enable static file serving
SERVE_STATIC=true
```

### 2. Generate Domain

1. Go to your service in Railway
2. Click **Settings** → **Networking**
3. Click **"Generate Domain"**
4. Copy the generated URL (e.g., `https://basic-nft-launcher-production.up.railway.app`)
5. Use this same URL in `ALLOWED_ORIGINS`

### 3. Build Process

The `railway.json` is now configured to:
1. Install all dependencies (root, frontend, backend)
2. Build the frontend (`frontend/dist`)
3. Build the backend
4. Start the backend (which serves the frontend if `SERVE_STATIC=true`)

### 4. How It Works

When `SERVE_STATIC=true`:
- Backend serves static files from `frontend/dist`
- API routes are at `/api/*`
- Frontend routes are served from root (`/`)
- Same domain for both frontend and API

## Alternative: Separate Services

If you prefer separate services:

### Create Frontend Service

1. In Railway, click **"New"** → **"GitHub Repo"**
2. Select the same repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npx serve -s dist -l $PORT`

### Update Backend Environment

Set in backend service:
```env
SERVE_STATIC=false
ALLOWED_ORIGINS=https://your-frontend-service.up.railway.app
```

### Frontend Environment Variables

In frontend service:
```env
VITE_API_URL=https://your-backend-service.up.railway.app/api
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
```

## Troubleshooting

### Frontend Not Loading

1. Check `SERVE_STATIC=true` is set
2. Verify frontend was built (check build logs)
3. Check that `frontend/dist` exists in the build
4. Check backend logs for static file serving messages

### CORS Errors

1. Ensure `ALLOWED_ORIGINS` matches your Railway domain exactly
2. No trailing slashes in the URL
3. Use `https://` not `http://`

### API Routes Not Working

1. API routes should be at `/api/*`
2. Frontend should call `/api/...` (relative URLs work)
3. Check backend logs for API errors

## Benefits of Unified Service

✅ Single service to manage
✅ Lower cost (one service instead of two)
✅ Simpler deployment
✅ Same domain for frontend and API
✅ No CORS issues (same origin)

## Benefits of Separate Services

✅ Independent scaling
✅ Separate deployments
✅ Better for large applications
✅ Frontend can use CDN

