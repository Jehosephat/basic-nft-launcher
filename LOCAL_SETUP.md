# Local Development Setup Guide

Complete guide to running the NFT Collection Launcher application locally.

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)
- **MetaMask** browser extension installed ([Download](https://metamask.io/))
- A GalaChain wallet with testnet GALA tokens (for testing)

## Quick Start

### 1. Install Dependencies

**Option A: Use the install script (Recommended)**

**Windows:**
```bash
install.bat
```

**Mac/Linux:**
```bash
chmod +x install.sh
./install.sh
```

**Option B: Manual Installation**
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install backend dependencies
cd backend
npm install
cd ..
```

Or use the npm workspace command:
```bash
npm run install:all
```

### 2. Configure Environment Variables

**Frontend Configuration:**

Copy the example environment file:
```bash
# Windows
copy frontend\env.example frontend\.env

# Mac/Linux
cp frontend/env.example frontend/.env
```

The `frontend/.env` file should contain:
```env
# GalaChain Testnet API
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

# Project Configuration
VITE_PROJECT_API=http://localhost:4000
```

**Backend Configuration:**

The backend uses default configuration. You can optionally set:
- `GALACHAIN_API` - Override the GalaChain Gateway API URL (defaults to testnet)
- `PORT` - Backend server port (defaults to 4000)

Create `backend/.env` if you need custom configuration:
```env
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
PORT=4000
```

### 3. Start the Development Servers

**Start both frontend and backend simultaneously:**
```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:4000
- **Frontend**: http://localhost:5173 (Vite default) or http://localhost:3000

**Or start them separately:**

Terminal 1 (Backend):
```bash
npm run dev:backend
# or
cd backend
npm run start:dev
```

Terminal 2 (Frontend):
```bash
npm run dev:frontend
# or
cd frontend
npm run dev
```

### 4. Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173 (or http://localhost:3000)
- **Backend API**: http://localhost:4000/api

## Project Structure

```
basic-nft-launcher/
├── frontend/              # Vue 3 + TypeScript + Vite
│   ├── src/
│   │   ├── components/   # Vue components
│   │   ├── services/     # API services
│   │   └── main.ts       # Entry point
│   ├── .env              # Frontend environment variables
│   └── package.json
├── backend/               # NestJS + TypeScript
│   ├── src/
│   │   ├── collection/   # Collection module
│   │   ├── token-class/  # Token class module
│   │   ├── mint/         # Mint module
│   │   ├── services/     # GalaChain service
│   │   └── main.ts       # Entry point
│   ├── *.db              # SQLite database files
│   └── package.json
└── package.json          # Root package.json (workspaces)
```

## Available Scripts

### Root Level Scripts

```bash
# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend

# Build both frontend and backend
npm run build

# Install all dependencies
npm run install:all
```

### Frontend Scripts

```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check
```

### Backend Scripts

```bash
cd backend

# Start development server (with hot reload)
npm run start:dev

# Start production server
npm run start:prod

# Build TypeScript
npm run build
```

## Database

The application uses **SQLite** databases stored in the `backend/` directory:
- `nft-collection.db` - Main database for collections, token classes, and transactions

The database is automatically created on first run. No additional setup required.

## Troubleshooting

### Port Already in Use

If port 4000 or 5173 is already in use:

**Backend:**
```bash
# Set custom port via environment variable
PORT=4001 cd backend && npm run start:dev
```

**Frontend:**
```bash
# Vite will automatically use the next available port
# Or specify in vite.config.ts
```

### Dependencies Not Installing

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules frontend/node_modules backend/node_modules
npm run install:all
```

### MetaMask Connection Issues

1. **MetaMask not detected:**
   - Ensure MetaMask extension is installed and enabled
   - Refresh the browser page
   - Check browser console for errors

2. **Wrong network:**
   - Ensure you're connected to the correct GalaChain network
   - Check your MetaMask network settings

3. **Transaction signing fails:**
   - Ensure you have sufficient GALA tokens
   - Check that the wallet address matches your GalaChain address

### CORS Errors

If you see CORS errors, ensure:
- Backend is running on port 4000
- Frontend is accessing the correct backend URL
- Backend CORS is configured (already set in `main.ts`)

### TypeScript Errors

```bash
# Type check frontend
cd frontend
npm run type-check

# Build backend to check for errors
cd backend
npm run build
```

## Development Workflow

### 1. Making Changes

- **Frontend changes**: Automatically hot-reloaded by Vite
- **Backend changes**: Automatically restarted by NestJS watch mode

### 2. Testing API Endpoints

You can test backend endpoints using:
- Browser: http://localhost:4000/api/collections/:address
- Postman/Insomnia
- curl:
```bash
curl http://localhost:4000/api/collections/eth|0xYourAddress
```

### 3. Viewing Logs

**Backend logs:**
- Check the terminal where `npm run dev:backend` is running
- Logs include API requests, errors, and database operations

**Frontend logs:**
- Open browser DevTools (F12)
- Check Console tab for errors and debug logs

## Environment Configuration

### Frontend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_GALACHAIN_API` | GalaChain Gateway API URL | Testnet URL |
| `VITE_PROJECT_API` | Backend API URL | http://localhost:4000 |

### Backend Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GALACHAIN_API` | GalaChain Gateway API URL | Testnet URL |
| `PORT` | Backend server port | 4000 |

## Production Build

### Build for Production

```bash
# Build both frontend and backend
npm run build
```

This creates:
- `frontend/dist/` - Frontend production build
- `backend/dist/` - Backend compiled JavaScript

### Run Production Build

**Backend:**
```bash
cd backend
npm run start:prod
```

**Frontend:**
```bash
cd frontend
npm run preview
```

## Common Issues

### Issue: "Cannot find module" errors

**Solution:**
```bash
# Reinstall dependencies
npm run install:all
```

### Issue: Database locked errors

**Solution:**
- Stop all running instances
- Delete `backend/*.db` files (will recreate on restart)
- Restart the application

### Issue: Frontend can't connect to backend

**Solution:**
1. Verify backend is running: http://localhost:4000/api
2. Check `VITE_PROJECT_API` in `frontend/.env`
3. Check browser console for CORS errors
4. Verify backend CORS configuration

### Issue: GalaChain API errors

**Solution:**
1. Check your network connection
2. Verify the GalaChain API URL is correct
3. Check if you're using testnet vs mainnet URLs
4. Ensure your wallet has the correct network selected

## Next Steps

Once the application is running:

1. **Connect Wallet**: Click "Connect Wallet" in the frontend
2. **Claim Collection**: Create a new NFT collection
3. **Create Token Class**: Define token types for your collection
4. **Mint Tokens**: Mint NFTs to addresses

For detailed API documentation, see:
- `GALACHAIN_API_GUIDE.md` - GalaChain Gateway API reference
- `WALLET_CONNECT_GUIDE.md` - Wallet integration guide

## Additional Resources

- [Vue.js Documentation](https://vuejs.org/)
- [NestJS Documentation](https://nestjs.com/)
- [GalaChain Connect Library](https://github.com/GalaGames/gala-chain-connect)
- [MetaMask Documentation](https://docs.metamask.io/)

---

**Need Help?** Check the troubleshooting section above or review the error messages in your terminal/browser console.

