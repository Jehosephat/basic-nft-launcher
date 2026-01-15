# Quick Deployment Reference

## Railway (Recommended for Quick Setup)

### 1. Setup (5 minutes)
1. Sign up at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select this repository
4. Railway auto-detects Node.js

### 2. Configure Environment Variables
In Railway dashboard → Variables:
```
PORT=4000
NODE_ENV=production
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
FRONTEND_URL=https://your-app.railway.app
DATABASE_PATH=./data/nft-collection.db
```

### 3. Add Persistent Volume
1. Service → Settings → Volumes
2. Add volume: `/app/backend/data`
3. This stores SQLite databases

### 4. Deploy
- Railway builds automatically on git push
- Service starts automatically
- Get your URL from Railway dashboard

### 5. Custom Domain (Optional)
- Settings → Domains → Add custom domain
- Railway provides SSL automatically

---

## Ubuntu VPS (Full Control)

### Prerequisites
- Ubuntu 22.04 VPS
- Domain name (optional, can use IP)
- SSH access

### Quick Setup Script
```bash
# Run on your local machine to prepare
chmod +x deploy.sh

# On VPS:
# 1. Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install PM2
sudo npm install -g pm2

# 3. Install Nginx
sudo apt install -y nginx

# 4. Clone/upload project
git clone <your-repo> /home/appuser/app
cd /home/appuser/app

# 5. Create .env file
cp backend/.env.production.example backend/.env
nano backend/.env  # Edit with your values

# 6. Build and start
npm run install:all
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions

# 7. Setup Nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/nft-launcher
sudo nano /etc/nginx/sites-available/nft-launcher  # Edit domain
sudo ln -s /etc/nginx/sites-available/nft-launcher /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 8. Setup SSL (if you have a domain)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Future Deployments
```bash
# Just run the deploy script
./deploy.sh
```

---

## Environment Variables Reference

### Required
- `NODE_ENV=production`
- `PORT=4000` (or Railway assigned port)
- `GALACHAIN_API` - GalaChain API endpoint
- `DATABASE_PATH` - Path to SQLite database file

### Optional
- `FRONTEND_URL` - For CORS configuration
- `TOKEN_GATEWAY_API` - Override token gateway
- `BURN_GATEWAY_API` - Override burn gateway

---

## Troubleshooting

### Railway
- **Build fails**: Check build logs in Railway dashboard
- **Database not persisting**: Ensure volume is mounted correctly
- **CORS errors**: Set `FRONTEND_URL` environment variable

### VPS
- **App won't start**: Check `pm2 logs nft-launcher`
- **Nginx 502**: Ensure backend is running on port 4000
- **Database locked**: Check file permissions on database directory
- **SSL issues**: Run `sudo certbot renew --dry-run` to test

---

## Monitoring

### Railway
- Built-in dashboard shows metrics
- View logs in Railway dashboard

### VPS
```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 monit           # Real-time monitoring
pm2 restart nft-launcher  # Restart
```

---

## Backups

### Railway
- Use Railway volumes + manual backups
- Or export database periodically

### VPS
```bash
# Add to crontab (crontab -e)
0 2 * * * tar -czf /home/appuser/backups/db-$(date +\%Y\%m\%d).tar.gz /home/appuser/app/data/*.db
```

---

## Cost Comparison

| Service | Monthly Cost |
|---------|--------------|
| Railway | $5-20 |
| VPS (DigitalOcean) | $5-10 |
| Domain | $1-2/month |

---

## Next Steps After Deployment

1. ✅ Test all functionality
2. ✅ Set up monitoring/uptime checks
3. ✅ Configure backups
4. ✅ Update DNS (if using custom domain)
5. ✅ Test SSL certificate
6. ✅ Document your deployment
