# Deployment Plan: NFT Collection Launcher

## Application Overview

**Tech Stack:**
- **Backend**: NestJS (Node.js), TypeORM, SQLite
- **Frontend**: Vue 3 + Vite, TypeScript
- **Database**: SQLite (file-based)
- **Ports**: Backend (4000), Frontend (3000/5173)

**Key Requirements:**
- Node.js 18+ runtime
- Persistent storage for SQLite database files
- Environment variables for GalaChain API configuration
- CORS configuration for production domain
- Build process for both frontend and backend

---

## Option 1: Railway Deployment

### Overview
Railway is a Platform-as-a-Service (PaaS) that simplifies deployment with automatic builds, environment management, and scaling.

### Pros
- ✅ **Zero server management** - No SSH, no server maintenance
- ✅ **Automatic deployments** from Git
- ✅ **Built-in environment variables** management
- ✅ **Automatic HTTPS** with custom domains
- ✅ **Easy scaling** and monitoring
- ✅ **Persistent volumes** for SQLite databases
- ✅ **Free tier** available for testing

### Cons
- ❌ **Cost** - Can be more expensive at scale ($5-20/month for small apps)
- ❌ **Less control** - Limited customization compared to VPS
- ❌ **Vendor lock-in** - Tied to Railway's platform

### Architecture
```
┌─────────────────────────────────────┐
│         Railway Platform            │
├─────────────────────────────────────┤
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │   Backend   │ │
│  │  (Static)    │  │  (NestJS)   │ │
│  │              │  │             │ │
│  │  Served via  │  │  Port 4000  │ │
│  │  Nginx/Vite  │  │             │ │
│  └──────────────┘  └─────────────┘ │
│         │                │          │
│         └────────┬───────┘          │
│                  │                  │
│         ┌────────▼────────┐        │
│         │  Persistent Vol │        │
│         │  (SQLite DBs)   │        │
│         └─────────────────┘        │
└─────────────────────────────────────┘
```

### Implementation Steps

#### 1. Prepare Repository
```bash
# Ensure .gitignore excludes node_modules and dist
# But includes necessary files
```

#### 2. Create Railway Configuration

**File: `railway.json`** (optional, for monorepo setup)
```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run start:prod",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### 3. Backend Service Setup

**Create: `backend/railway.toml`**
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "cd backend && npm run start:prod"
healthcheckPath = "/api"
healthcheckTimeout = 100
```

**Update: `backend/src/main.ts`** (CORS for production)
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || '*', // Set in Railway env vars
  credentials: true,
});
```

**Update: `backend/package.json`** (add production start)
```json
{
  "scripts": {
    "start:prod": "node dist/main.js"
  }
}
```

#### 4. Frontend Service Setup

**Option A: Serve via Backend (Recommended)**
- Build frontend and serve static files from NestJS
- Single service deployment

**Option B: Separate Frontend Service**
- Deploy as separate Railway service
- Use Railway's static site hosting

**For Option A, update backend to serve static files:**

**Update: `backend/src/main.ts`**
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files from frontend dist
  app.useStaticAssets(join(__dirname, '..', 'frontend-dist'));
  app.setBaseViewsDir(join(__dirname, '..', 'frontend-dist'));
  
  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
```

**Update: `package.json`** (root)
```json
{
  "scripts": {
    "build": "npm run build:frontend && npm run build:backend && npm run copy:frontend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "copy:frontend": "cp -r frontend/dist backend/frontend-dist",
    "start:prod": "cd backend && npm run start:prod"
  }
}
```

#### 5. Environment Variables (Railway Dashboard)

Set in Railway service settings:
```
PORT=4000
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
FRONTEND_URL=https://your-app.railway.app
NODE_ENV=production
```

#### 6. Database Persistence

**Add persistent volume in Railway:**
1. Go to service settings
2. Add volume: `/app/backend/data`
3. Update database path in `app.module.ts`:
```typescript
database: process.env.DATABASE_PATH || './data/nft-collection.db',
```

#### 7. Deployment Process

1. **Connect Railway to GitHub**
   - Go to Railway dashboard
   - New Project → Deploy from GitHub
   - Select repository

2. **Configure Service**
   - Railway auto-detects Node.js
   - Set root directory (if needed)
   - Add environment variables
   - Add persistent volume

3. **Deploy**
   - Railway builds automatically on push
   - Monitor build logs
   - Service starts automatically

#### 8. Custom Domain (Optional)
- Add custom domain in Railway settings
- Railway provides SSL automatically

### Estimated Cost
- **Free tier**: $5 credit/month
- **Hobby**: $5-20/month (depending on usage)
- **Pro**: $20+/month

---

## Option 2: Ubuntu VPS Deployment

### Overview
Self-managed virtual private server with full control over the environment.

### Pros
- ✅ **Full control** - Complete customization
- ✅ **Cost-effective** - $5-10/month for small apps
- ✅ **No vendor lock-in** - Standard Linux environment
- ✅ **Learning opportunity** - Understand infrastructure
- ✅ **Multiple services** - Can host multiple apps

### Cons
- ❌ **Server management** - SSH, updates, security
- ❌ **Manual setup** - More configuration required
- ❌ **No auto-scaling** - Manual scaling needed
- ❌ **SSL setup** - Need to configure Let's Encrypt
- ❌ **Monitoring** - Need to set up yourself

### Architecture
```
┌─────────────────────────────────────┐
│         Ubuntu VPS                  │
├─────────────────────────────────────┤
│  ┌──────────────────────────────┐  │
│  │      Nginx (Reverse Proxy)   │  │
│  │      Port 80/443             │  │
│  └──────────────┬───────────────┘  │
│                 │                  │
│  ┌──────────────▼───────────────┐  │
│  │   PM2 Process Manager        │  │
│  │   ┌────────┐  ┌──────────┐   │  │
│  │   │Backend │  │Frontend  │   │  │
│  │   │NestJS  │  │(Static)  │   │  │
│  │   │:4000   │  │:3000     │   │  │
│  │   └────────┘  └──────────┘   │  │
│  └───────────────────────────────┘  │
│                 │                  │
│  ┌──────────────▼───────────────┐  │
│  │   SQLite Databases           │  │
│  │   /var/app/data/*.db         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Implementation Steps

#### 1. Server Requirements
- **OS**: Ubuntu 22.04 LTS
- **RAM**: Minimum 1GB (2GB recommended)
- **Storage**: 20GB+ (for databases and logs)
- **CPU**: 1+ cores

#### 2. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Create app user
sudo adduser --disabled-password --gecos "" appuser
sudo usermod -aG sudo appuser
```

#### 3. Application Setup

```bash
# Switch to app user
sudo su - appuser

# Create app directory
mkdir -p /home/appuser/app
cd /home/appuser/app

# Clone repository (or upload files)
git clone https://github.com/yourusername/basic-nft-launcher.git .
# OR use scp/rsync to upload files

# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Create data directory for databases
mkdir -p /home/appuser/app/data
```

#### 4. Build Application

```bash
# Build frontend and backend
npm run build

# Copy frontend to backend for serving
cp -r frontend/dist backend/frontend-dist
```

#### 5. Environment Configuration

**Create: `/home/appuser/app/backend/.env`**
```env
NODE_ENV=production
PORT=4000
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
DATABASE_PATH=/home/appuser/app/data/nft-collection.db
FRONTEND_URL=https://yourdomain.com
```

**Update: `backend/src/app.module.ts`**
```typescript
database: process.env.DATABASE_PATH || './data/nft-collection.db',
```

**Update: `backend/src/main.ts`** (serve static files + CORS)
```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Serve static files
  app.useStaticAssets(join(__dirname, '..', 'frontend-dist'));
  app.setBaseViewsDir(join(__dirname, '..', 'frontend-dist'));
  
  // SPA fallback - serve index.html for all routes
  app.getHttpAdapter().get('*', (req, res) => {
    res.sendFile(join(__dirname, '..', 'frontend-dist', 'index.html'));
  });
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));
  
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 4000;
  await app.listen(port);
  
  console.log(`🚀 Server running on port ${port}`);
}

bootstrap();
```

#### 6. PM2 Configuration

**Create: `/home/appuser/app/ecosystem.config.js`**
```javascript
module.exports = {
  apps: [{
    name: 'nft-launcher',
    script: './backend/dist/main.js',
    cwd: '/home/appuser/app',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: '/home/appuser/app/logs/pm2-error.log',
    out_file: '/home/appuser/app/logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '500M'
  }]
};
```

**Start with PM2:**
```bash
# Create logs directory
mkdir -p /home/appuser/app/logs

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs (requires sudo)
```

#### 7. Nginx Configuration

**Create: `/etc/nginx/sites-available/nft-launcher`**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # For initial setup, use this:
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for long-running requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase client body size for file uploads
    client_max_body_size 10M;
}
```

**Enable site:**
```bash
sudo ln -s /etc/nginx/sites-available/nft-launcher /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

#### 8. SSL Setup (Let's Encrypt)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
# Test renewal: sudo certbot renew --dry-run
```

**Update Nginx config** (Certbot will do this automatically):
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:4000;
        # ... rest of config
    }
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 9. Firewall Configuration

```bash
# Install UFW
sudo apt install -y ufw

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
```

#### 10. Monitoring & Maintenance

**PM2 Monitoring:**
```bash
pm2 monit          # Real-time monitoring
pm2 logs           # View logs
pm2 status         # Check status
pm2 restart nft-launcher  # Restart app
```

**System Monitoring:**
```bash
# Install monitoring tools
sudo apt install -y htop

# Check disk space
df -h

# Check memory
free -h
```

**Log Rotation:**
```bash
# Install logrotate config
sudo nano /etc/logrotate.d/nft-launcher
```

Add:
```
/home/appuser/app/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    notifempty
    create 0640 appuser appuser
    sharedscripts
}
```

#### 11. Deployment Script

**Create: `/home/appuser/app/deploy.sh`**
```bash
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Pull latest changes
git pull origin main

# Install dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Build application
npm run build

# Copy frontend to backend
cp -r frontend/dist backend/frontend-dist

# Restart application
pm2 restart nft-launcher

echo "✅ Deployment complete!"
```

**Make executable:**
```bash
chmod +x deploy.sh
```

### Estimated Cost
- **VPS**: $5-10/month (DigitalOcean, Linode, Vultr)
- **Domain**: $10-15/year (optional)
- **Total**: ~$5-15/month

---

## Comparison Matrix

| Feature | Railway | Ubuntu VPS |
|---------|---------|------------|
| **Setup Time** | 15-30 min | 1-2 hours |
| **Maintenance** | Minimal | Regular |
| **Cost** | $5-20/month | $5-10/month |
| **Scalability** | Easy | Manual |
| **Control** | Limited | Full |
| **SSL/HTTPS** | Automatic | Manual (Let's Encrypt) |
| **Monitoring** | Built-in | Manual setup |
| **Backups** | Manual setup | Manual setup |
| **Learning Curve** | Low | Medium-High |
| **Best For** | Quick deployment, small teams | Full control, learning |

---

## Recommendation

### Choose Railway if:
- ✅ You want to deploy quickly
- ✅ You prefer minimal server management
- ✅ Budget allows $10-20/month
- ✅ You're a small team or solo developer
- ✅ You want automatic HTTPS and deployments

### Choose Ubuntu VPS if:
- ✅ You want full control over the environment
- ✅ You want to minimize costs ($5-10/month)
- ✅ You're comfortable with Linux/SSH
- ✅ You want to learn server management
- ✅ You plan to host multiple applications

---

## Next Steps

1. **Choose your deployment option** based on the comparison above
2. **Follow the implementation steps** for your chosen option
3. **Test thoroughly** before going live
4. **Set up monitoring** and alerts
5. **Configure backups** for SQLite databases
6. **Document your deployment** for future reference

---

## Additional Considerations

### Database Backups
Both options need database backup strategy:

**Railway:**
- Use Railway volumes + periodic backups
- Or migrate to PostgreSQL (better for production)

**VPS:**
- Cron job for daily backups:
```bash
0 2 * * * tar -czf /home/appuser/backups/db-$(date +\%Y\%m\%d).tar.gz /home/appuser/app/data/*.db
```

### Monitoring & Alerts
- **Railway**: Built-in monitoring dashboard
- **VPS**: Set up UptimeRobot or similar for uptime monitoring

### Security
- Keep dependencies updated
- Use environment variables for secrets
- Regular security updates (VPS)
- Enable firewall rules
- Use strong passwords/SSH keys

### Performance Optimization
- Enable gzip compression in Nginx
- Use CDN for static assets (optional)
- Consider caching strategies
- Monitor database size (SQLite limitations)
