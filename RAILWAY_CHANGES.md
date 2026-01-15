# Railway Deployment - Changes Made

This document summarizes all the changes made to support Railway deployment with frontend served by backend.

## Files Created

### 1. `scripts/copy-frontend.js`
- Cross-platform Node.js script to copy frontend build to backend
- Replaces shell commands that don't work on Windows
- Ensures frontend files are available for backend to serve

### 2. `nixpacks.toml`
- Railway build configuration
- Defines build phases: setup, install, build
- Specifies start command for production

### 3. `railway.json`
- Railway deployment configuration
- Sets start command and restart policy
- Works alongside nixpacks.toml

### 4. `RAILWAY_SETUP.md`
- Complete setup guide for Railway deployment
- Step-by-step instructions
- Troubleshooting tips

## Files Modified

### 1. `package.json` (root)
**Changes:**
- Updated `copy:frontend` script to use Node.js script instead of shell commands
- Added `start:prod` script for production deployment

**Before:**
```json
"copy:frontend": "mkdir -p backend/frontend-dist && cp -r frontend/dist/* backend/frontend-dist/"
```

**After:**
```json
"copy:frontend": "node scripts/copy-frontend.js",
"start:prod": "cd backend && npm run start:prod"
```

### 2. `backend/src/main.ts`
**Changes:**
- Added static file serving for frontend in production
- Added SPA fallback route (serves index.html for non-API routes)
- Updated CORS to work with Railway's dynamic domains
- Added check for frontend dist existence

**Key additions:**
- Serves frontend from `backend/frontend-dist` in production
- Handles Vue Router client-side routing
- CORS configured for Railway's `RAILWAY_PUBLIC_DOMAIN`

### 3. `backend/src/app.module.ts`
**Changes:**
- Updated database path to use `./data/nft-collection.db` in production
- This works with Railway's persistent volumes mounted at `/app/backend/data`

**Before:**
```typescript
database: process.env.DATABASE_PATH || 'nft-collection.db',
```

**After:**
```typescript
database: process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? './data/nft-collection.db' : 'nft-collection.db'),
```

### 4. `.gitignore`
**Changes:**
- Added `backend/frontend-dist/` to ignore list
- This directory is generated during build and shouldn't be committed

## Build Process

When Railway builds the application:

1. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install
   cd backend && npm install
   ```

2. **Build frontend:**
   ```bash
   cd frontend && npm run build
   ```
   Creates `frontend/dist/`

3. **Build backend:**
   ```bash
   cd backend && npm run build
   ```
   Creates `backend/dist/`

4. **Copy frontend to backend:**
   ```bash
   node scripts/copy-frontend.js
   ```
   Copies `frontend/dist/*` to `backend/frontend-dist/`

5. **Start application:**
   ```bash
   npm run start:prod
   ```
   Runs `cd backend && node dist/main.js`

## Runtime Behavior

### Production Mode (`NODE_ENV=production`)

1. **Backend serves:**
   - API routes: `/api/*` → Handled by NestJS controllers
   - Static assets: `/*.js`, `/*.css`, `/*.png`, etc. → Served from `frontend-dist`
   - SPA routes: All other routes → Serves `index.html` (Vue Router handles routing)

2. **CORS:**
   - Since frontend is served from same origin, CORS is mainly for external API calls
   - Configured to allow Railway's public domain

3. **Database:**
   - Stored in `./data/nft-collection.db` (relative to backend directory)
   - Railway volume should be mounted at `/app/backend/data`

## Environment Variables

Required in Railway:

```env
NODE_ENV=production
PORT=4000  # Railway sets this automatically
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
DATABASE_PATH=./data/nft-collection.db
```

Optional:
```env
RAILWAY_PUBLIC_DOMAIN=your-app.railway.app  # Railway sets this automatically
FRONTEND_URL=https://your-app.railway.app  # For CORS (usually not needed)
```

## Testing Locally

To test the production build locally:

```bash
# Build everything
npm run build

# Start in production mode
NODE_ENV=production npm run start:prod
```

Then visit `http://localhost:4000` - you should see the frontend served by the backend.

## Next Steps

1. ✅ Push changes to GitHub
2. ✅ Connect repository to Railway
3. ✅ Configure environment variables in Railway
4. ✅ Add persistent volume for database
5. ✅ Deploy and test

## Notes

- Frontend API calls use relative paths (`/api/...`), so they work automatically when served from the same origin
- No need to configure `VITE_PROJECT_API` in production since frontend is served by backend
- Railway automatically provides HTTPS
- Database persists via Railway volumes
