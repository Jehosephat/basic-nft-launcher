# Railway Zero-Config Deployment

This project is designed to work seamlessly with Railway **without any manual configuration**.

## How It Works

### Automatic Detection
- Railway detects the `backend/` directory as the service root
- `nixpacks.toml` tells Railway exactly how to build
- Build process automatically includes frontend
- Static files are served automatically in production

### Zero Configuration Required

**You don't need to set these environment variables:**
- ❌ `SERVE_STATIC` - Automatically `true` in production
- ❌ `ALLOWED_ORIGINS` - Automatically uses Railway's domain
- ✅ Just add PostgreSQL plugin and deploy!

### What Railway Does Automatically

1. **Detects backend service** from `backend/` directory
2. **Runs build** using `nixpacks.toml`:
   - Installs dependencies (root, frontend, backend)
   - Builds frontend to `frontend/dist`
   - Builds backend
3. **Starts backend** which automatically serves frontend
4. **Provides domain** via `RAILWAY_PUBLIC_DOMAIN` environment variable
5. **CORS works automatically** - uses the same domain

## Deployment Steps

### 1. Connect Repository
- Railway → New Project → GitHub Repo
- Select this repository

### 2. Add PostgreSQL
- Click "New" → "Database" → "Add PostgreSQL"
- Railway provides database variables automatically

### 3. Deploy
- That's it! Railway does the rest automatically

### 4. Generate Domain (Optional)
- Settings → Networking → "Generate Domain"
- This happens automatically, but you can customize it

## Environment Variables (Auto-Configured)

| Variable | Source | Default |
|----------|--------|---------|
| `PORT` | Railway | Auto-provided |
| `NODE_ENV` | Railway | `production` |
| `DATABASE_*` | PostgreSQL Plugin | Auto-provided |
| `SERVE_STATIC` | Code | `true` in production (auto) |
| `ALLOWED_ORIGINS` | Code | `*` when `SERVE_STATIC=true` (not needed, same origin) |

## Manual Override (If Needed)

Only set these if you want to override defaults:

```env
# Disable static file serving
SERVE_STATIC=false

# Custom CORS origins (comma-separated)
ALLOWED_ORIGINS=https://custom-domain.com,https://another.com

# Custom GalaChain API (if not using testnet)
GALACHAIN_API=https://your-custom-api.com
```

## How Static File Serving Works

1. Frontend builds to `frontend/dist` during Railway build
2. Backend automatically detects and serves from multiple possible locations:
   - `backend/../frontend/dist` (relative from backend/)
   - `frontend/dist` (from project root)
   - Other common locations
3. API routes at `/api/*` work normally
4. All other routes serve `index.html` (SPA routing)

## Troubleshooting

### Frontend Not Loading
- Check build logs - frontend should build during Railway build
- Verify `SERVE_STATIC` is not set to `false`
- Check backend logs for "Serving frontend from: ..." message

### CORS Errors
- If `SERVE_STATIC=true` (default in production), CORS allows all origins automatically
- Frontend and backend are same origin, so CORS shouldn't be an issue
- If using separate frontend service, set `ALLOWED_ORIGINS` to your frontend URL

### Build Fails
- Check `nixpacks.toml` is in `backend/` directory
- Verify all dependencies are in `package.json`
- Check Railway build logs for specific errors

## Architecture

```
Railway Service (backend/)
├── Build Phase
│   ├── Install root deps
│   ├── Install frontend deps
│   ├── Build frontend → frontend/dist
│   └── Build backend → backend/dist
├── Deploy Phase
│   └── Start backend (serves frontend automatically)
└── Runtime
    ├── API: /api/*
    ├── Health: /health
    └── Frontend: /* (serves index.html)
```

## Benefits

✅ **Zero configuration** - Just connect repo and deploy
✅ **Automatic frontend serving** - No separate service needed
✅ **Smart defaults** - Works out of the box
✅ **Railway-native** - Uses Railway conventions
✅ **Single service** - Simpler and cheaper
✅ **No CORS issues** - Same origin for frontend and API

