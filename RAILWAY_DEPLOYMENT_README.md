# Railway Deployment Guide

This guide explains how to deploy the NFT Collection Manager to Railway.

## Prerequisites

1. A Railway account (sign up at [railway.app](https://railway.app))
2. A GitHub account with this repository
3. PostgreSQL database (Railway provides this via plugin)

## Quick Start

### 1. Connect Repository to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose this repository
5. Railway will automatically detect the project structure

### 2. Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically create a PostgreSQL database
4. Railway provides environment variables automatically:
   - `DATABASE_HOST`
   - `DATABASE_PORT`
   - `DATABASE_USER`
   - `DATABASE_PASSWORD`
   - `DATABASE_NAME`
   - `DATABASE_URL` (connection string)

### 3. Configure Backend Service

1. Railway should auto-detect the backend service
2. If not, create a new service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`

### 4. Set Environment Variables

In the Railway dashboard, go to your backend service → Variables tab and add:

```env
NODE_ENV=production
PORT=${{PORT}}

# Database (automatically provided by PostgreSQL plugin)
DATABASE_HOST=${{Postgres.DATABASE_HOST}}
DATABASE_PORT=${{Postgres.DATABASE_PORT}}
DATABASE_USER=${{Postgres.DATABASE_USER}}
DATABASE_PASSWORD=${{Postgres.DATABASE_PASSWORD}}
DATABASE_NAME=${{Postgres.DATABASE_NAME}}
DATABASE_SSL=true

# CORS - Replace with your frontend URL
ALLOWED_ORIGINS=https://your-frontend-service.railway.app

# GalaChain API
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

# Static file serving (set to false if using separate frontend service)
SERVE_STATIC=false
```

**Note**: Railway automatically provides the `PORT` variable. Use `${{PORT}}` to reference it.

### 5. Database Migrations

Migrations run automatically on startup when `NODE_ENV=production` and `migrationsRun: true` is set in the database config.

To manually run migrations:
1. Connect to Railway CLI: `railway link`
2. Run: `railway run npm run migration:run`

### 6. Deploy Frontend (Optional - Separate Service)

If deploying frontend as a separate service:

1. Create a new service in Railway
2. **Root Directory**: `frontend`
3. **Build Command**: `npm install && npm run build`
4. **Start Command**: `npx serve -s dist -l $PORT`

Set environment variables:
```env
VITE_API_URL=https://your-backend-service.railway.app/api
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
```

**Note**: Vite environment variables need to be set at build time, not runtime.

### 7. Alternative: Unified Service (Frontend Served from Backend)

To serve frontend from backend:

1. Build frontend: `cd frontend && npm run build`
2. Copy `frontend/dist` to `backend/frontend/dist`
3. Set `SERVE_STATIC=true` in backend environment variables
4. Update backend to serve static files (already configured in `main.ts`)

## Environment Variables Reference

### Backend Service

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment | Yes | `production` |
| `PORT` | Server port | No | `4000` (Railway provides this) |
| `DATABASE_HOST` | PostgreSQL host | Yes | From Railway PostgreSQL plugin |
| `DATABASE_PORT` | PostgreSQL port | Yes | From Railway PostgreSQL plugin |
| `DATABASE_USER` | PostgreSQL user | Yes | From Railway PostgreSQL plugin |
| `DATABASE_PASSWORD` | PostgreSQL password | Yes | From Railway PostgreSQL plugin |
| `DATABASE_NAME` | PostgreSQL database name | Yes | From Railway PostgreSQL plugin |
| `DATABASE_SSL` | Enable SSL | Yes | `true` (for Railway) |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | Yes | - |
| `GALACHAIN_API` | GalaChain API URL | Yes | Testnet URL |
| `SERVE_STATIC` | Serve frontend from backend | No | `false` |

### Frontend Service (if separate)

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_API_URL` | Backend API URL | Yes | - |
| `VITE_GALACHAIN_API` | GalaChain API URL | Yes | Testnet URL |

## Health Checks

Railway automatically checks the `/health` endpoint. The health check:
- Verifies database connectivity
- Returns 200 OK if healthy
- Returns 503 if unhealthy

## Monitoring

### View Logs

1. In Railway dashboard, select your service
2. Click "Logs" tab
3. View real-time logs

### View Metrics

1. In Railway dashboard, select your service
2. View CPU, Memory, and Network metrics

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL plugin is added
2. Check environment variables are set correctly
3. Ensure `DATABASE_SSL=true` for Railway
4. Check database logs in Railway dashboard

### Migration Issues

1. Check migration files exist in `backend/src/migrations/`
2. Verify database connection
3. Check logs for migration errors
4. Manually run migrations: `railway run npm run migration:run`

### CORS Issues

1. Verify `ALLOWED_ORIGINS` includes your frontend URL
2. Check frontend is using correct API URL
3. Ensure no trailing slashes in URLs

### Build Failures

1. Check build logs in Railway
2. Verify all dependencies in `package.json`
3. Check Node.js version (Railway uses latest LTS)

## Local Development Setup

### 1. Install Dependencies

```bash
npm run install:all
```

### 2. Set Up PostgreSQL Locally

```bash
# Using Docker
docker run --name postgres-nft -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nft_collection -p 5432:5432 -d postgres
```

### 3. Configure Environment

Copy `.env.example` to `.env` in backend:

```bash
cd backend
cp .env.example .env
```

Update `.env` with local PostgreSQL credentials.

### 4. Run Migrations

```bash
npm run migration:run
```

### 5. Start Development Servers

```bash
npm run dev
```

This starts:
- Backend on `http://localhost:4000`
- Frontend on `http://localhost:3000`

## Production Checklist

Before deploying to production:

- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] CORS origins set correctly
- [ ] Health checks working
- [ ] Frontend API URL configured
- [ ] GalaChain API URL correct
- [ ] SSL enabled for database
- [ ] Logs accessible
- [ ] Error handling tested

## Support

For issues or questions:
1. Check Railway documentation: [docs.railway.app](https://docs.railway.app)
2. Check application logs in Railway dashboard
3. Review this deployment guide

## Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [NestJS Documentation](https://docs.nestjs.com)
- [TypeORM Migrations](https://typeorm.io/migrations)
- [Vue.js Documentation](https://vuejs.org)

