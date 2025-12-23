# NFT Collection Manager

A Railway-optimized NFT collection management application for GalaChain Testnet.

## Features

- 🎨 Claim NFT Collections
- 🎯 Create Token Classes
- ✨ Mint NFTs
- 💼 Wallet Integration (MetaMask)
- 📊 Collection & Token Management

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm run install:all
   ```

2. **Setup PostgreSQL:**
   ```bash
   docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nft_collection -p 5432:5432 -d postgres
   ```

3. **Configure backend:**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env if needed
   ```

4. **Run migrations:**
   ```bash
   cd backend
   npm run migration:run
   ```

5. **Start backend:**
   ```bash
   npm run dev:backend
   ```

6. **Start frontend (in another terminal):**
   ```bash
   npm run dev:frontend
   ```

7. **Visit:** http://localhost:3000

## Railway Deployment

### Zero-Config Deployment

1. **Connect GitHub repo to Railway**
2. **Add PostgreSQL plugin**
3. **Generate domain (optional)**
4. **Deploy!**

That's it! Railway will:
- Auto-detect `backend/` as service root
- Build frontend and backend automatically
- Run migrations automatically
- Serve frontend from backend (unified service)
- Configure everything with smart defaults

### Environment Variables (Optional)

Railway provides these automatically:
- `PORT` - Railway assigns
- `DATABASE_*` - PostgreSQL plugin provides
- `NODE_ENV=production` - Railway sets

Optional overrides:
- `SERVE_STATIC=false` - Only if you want to disable static serving
- `GALACHAIN_API` - Only if using different API

## Project Structure

```
nft-collection-manager/
├── backend/          # NestJS backend (Railway service root)
│   ├── src/
│   ├── nixpacks.toml
│   └── package.json
├── frontend/        # Vue 3 frontend (built into backend)
│   ├── src/
│   └── package.json
└── railway.json     # Railway configuration
```

## Architecture

- **Unified Service**: Frontend served from backend
- **Zero Config**: Smart defaults for everything
- **Railway-Native**: Optimized for Railway deployment
- **PostgreSQL**: Production-ready database

## License

MIT

