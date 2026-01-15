# Railway Deployment Setup Guide

This guide will help you deploy the NFT Collection Launcher to Railway with the frontend served by the backend.

## Prerequisites

- ✅ Railway account (you already have this)
- ✅ GitHub repository connected (you already have this)
- ✅ Node.js 18+ (handled by Railway automatically)

## Step-by-Step Deployment

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `basic-nft-launcher` repository
5. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

In Railway dashboard, go to your service → **Variables** tab and add:

```env
NODE_ENV=production
PORT=4000
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
DATABASE_PATH=./data/nft-collection.db
```

**Note:** Railway automatically sets `PORT` and `RAILWAY_PUBLIC_DOMAIN`, but you can override PORT if needed.

### 3. Add Persistent Volume for Database

1. In Railway dashboard, go to your service
2. Click **"Settings"** tab
3. Scroll to **"Volumes"** section
4. Click **"Add Volume"**
5. Set mount path: `/app/backend/data`
6. This ensures your SQLite databases persist across deployments

### 4. Configure Build Settings

Railway should auto-detect the build from `nixpacks.toml` and `railway.json`, but verify:

1. Go to **Settings** → **Build**
2. Ensure **Root Directory** is set to `/` (project root)
3. Build command should be: `npm run build` (automatic)
4. Start command should be: `npm run start:prod` (automatic)

### 5. Deploy

1. Railway will automatically build and deploy when you push to your main branch
2. Or click **"Deploy"** button to trigger a manual deployment
3. Watch the build logs to ensure everything builds correctly

### 6. Get Your Application URL

1. After deployment, Railway will provide a URL like: `https://your-app.railway.app`
2. Click on the service → **Settings** → **Networking**
3. Railway automatically provides HTTPS
4. You can add a custom domain if desired

### 7. Verify Deployment

1. Visit your Railway URL
2. The frontend should load (served by the backend)
3. Test API endpoints: `https://your-app.railway.app/api`
4. Test frontend routes (they should all serve the Vue app)

## How It Works

### Build Process

1. Railway runs `npm install` (root, frontend, backend)
2. Runs `npm run build` which:
   - Builds frontend: `npm run build:frontend`
   - Builds backend: `npm run build:backend`
   - Copies frontend to backend: `npm run copy:frontend` (uses `scripts/copy-frontend.js`)

### Runtime

1. Railway runs `npm run start:prod`
2. This starts the NestJS backend on the port Railway provides
3. Backend serves:
   - API routes at `/api/*`
   - Static frontend files at `/*`
   - SPA fallback: all non-API routes serve `index.html`

### File Structure After Build

```
backend/
├── dist/              # Compiled backend
├── frontend-dist/     # Frontend build (copied during build)
│   ├── index.html
│   ├── assets/
│   └── ...
└── data/              # SQLite databases (persistent volume)
    └── nft-collection.db
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | - | Set to `production` |
| `PORT` | Auto | 4000 | Railway sets this automatically |
| `GALACHAIN_API` | Yes | - | GalaChain API endpoint |
| `DATABASE_PATH` | No | `./data/nft-collection.db` | Path to SQLite database |
| `RAILWAY_PUBLIC_DOMAIN` | Auto | - | Railway sets this automatically |

## Troubleshooting

### Build Fails

**Error: Frontend dist not found**
- Ensure `npm run build:frontend` completes successfully
- Check build logs in Railway dashboard

**Error: Module not found**
- Ensure all dependencies are installed
- Check that `package.json` files are correct

### Runtime Issues

**Frontend not loading**
- Check that `backend/frontend-dist` exists after build
- Verify build logs show "Frontend files copied"
- Check backend logs for errors

**Database errors**
- Ensure volume is mounted at `/app/backend/data`
- Check file permissions on database directory
- Verify `DATABASE_PATH` environment variable

**CORS errors**
- Railway automatically handles CORS since frontend is same origin
- If using custom domain, ensure it's configured in Railway

### Viewing Logs

1. Go to Railway dashboard
2. Click on your service
3. Click **"Deployments"** tab
4. Click on a deployment to see logs
5. Or use **"View Logs"** for real-time logs

## Custom Domain Setup

1. In Railway dashboard → Service → Settings → Networking
2. Click **"Add Domain"**
3. Enter your domain name
4. Railway provides DNS records to add
5. Add DNS records to your domain provider
6. Railway automatically provisions SSL certificate

## Updating the Application

Simply push to your main branch:
```bash
git add .
git commit -m "Update application"
git push origin main
```

Railway will automatically:
1. Detect the push
2. Build the application
3. Deploy the new version
4. Restart the service

## Monitoring

- **Metrics**: Railway dashboard shows CPU, memory, network usage
- **Logs**: View real-time logs in Railway dashboard
- **Deployments**: See deployment history and status

## Cost

- **Free tier**: $5 credit/month
- **Hobby plan**: $5-20/month (pay-as-you-go)
- **Pro plan**: $20+/month (includes more resources)

## Next Steps

1. ✅ Deploy to Railway
2. ✅ Test all functionality
3. ✅ Set up custom domain (optional)
4. ✅ Configure backups for database
5. ✅ Set up monitoring/alerting (optional)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Project Issues: Check GitHub repository
