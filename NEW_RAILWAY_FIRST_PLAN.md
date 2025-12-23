# Railway-First Project Plan

## Philosophy: Start Simple, Stay Simple

This plan recreates the NFT Collection Manager **from scratch** with Railway deployment as the **central, primary goal**. Every decision prioritizes simplicity and zero-configuration deployment.

---

## Core Principles

1. **Railway-First Design**: Every decision optimized for Railway's conventions
2. **Zero Configuration**: Works out of the box with minimal setup
3. **Unified Service**: One service, one deployment, one domain
4. **Smart Defaults**: Everything has sensible defaults that work
5. **YAGNI**: You Aren't Gonna Need It - no premature optimization

---

## Architecture: Unified Service

### Single Service Design

```
Railway Service (backend/)
├── Builds frontend automatically
├── Serves frontend from backend
├── API at /api/*
└── Frontend at /*
```

**Why?**
- Simplest possible setup
- Zero configuration needed
- Lower cost
- Easier to maintain
- Railway-optimized

**Trade-offs Accepted:**
- Can't scale frontend independently (not needed)
- No CDN (not critical for this app)
- Single deployment (simpler)

---

## Technology Stack

### Backend
- **Framework**: NestJS (same as current - works well)
- **Database**: PostgreSQL (Railway plugin)
- **ORM**: TypeORM (same as current)
- **Language**: TypeScript

### Frontend
- **Framework**: Vue 3 (same as current - maintain UI)
- **Build Tool**: Vite (same as current)
- **Language**: TypeScript

### Infrastructure
- **Platform**: Railway
- **Database**: Railway PostgreSQL Plugin
- **Build**: Railway Nixpacks (auto-detected)

**No Changes Needed**: Current stack is fine, just optimize deployment.

---

## Project Structure

```
nft-collection-manager/
├── backend/                    # Service root (Railway detects this)
│   ├── nixpacks.toml          # Build configuration
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.ts            # Entry point
│   │   ├── app.module.ts
│   │   ├── app.controller.ts  # Health check
│   │   ├── config/
│   │   │   ├── database.ts    # DB config with smart defaults
│   │   │   └── app.ts          # App config with smart defaults
│   │   ├── entities/           # Database entities
│   │   ├── migrations/        # Database migrations
│   │   ├── collection/
│   │   ├── token-class/
│   │   ├── mint/
│   │   └── services/
│   └── .env.example
│
├── frontend/                   # Source only (built into backend)
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   │   ├── main.ts
│   │   ├── App.vue
│   │   ├── components/         # Same 6 components
│   │   ├── services/
│   │   └── router/
│   └── .env.example
│
├── package.json                # Root workspace (dev only)
├── railway.json                # Minimal Railway config
└── README.md
```

**Key Points:**
- `backend/` is the service root (Railway auto-detects)
- Frontend is built during backend build
- No separate frontend service
- Minimal configuration files

---

## Database Design

### PostgreSQL Schema

Same as current, but optimized:
- Snake_case column names (PostgreSQL convention)
- Proper indexes
- Migration-based (no synchronize in production)

### Entities
- `Collection` - Same fields
- `TokenClass` - Same fields  
- `MintTransaction` - Same fields

**No Changes**: Current schema is fine.

---

## Build Process

### Railway Build (Automatic)

1. Railway detects `backend/` directory
2. Reads `backend/nixpacks.toml`
3. Installs dependencies (root, frontend, backend)
4. Builds frontend → `frontend/dist`
5. Builds backend → `backend/dist`
6. Starts backend

### Build Scripts

**backend/package.json:**
```json
{
  "scripts": {
    "build": "nest build",
    "build:all": "npm run build:frontend && npm run build",
    "build:frontend": "cd ../frontend && npm install && npm run build && cd ../backend",
    "start:prod": "node dist/main"
  }
}
```

**backend/nixpacks.toml:**
```toml
[phases.setup]
nixPkgs = ["nodejs-18_x"]

[phases.install]
cmds = [
  "npm install",
  "cd ../frontend && npm install && cd ../backend"
]

[phases.build]
cmds = ["npm run build:all"]

[start]
cmd = "npm run start:prod"
```

**Result**: Zero configuration needed. Railway just works.

---

## Configuration: Smart Defaults

### Backend Config (`backend/src/config/app.ts`)

```typescript
export const getAppConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    port: parseInt(process.env.PORT || '4000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    
    // Auto-serve static files in production
    serveStatic: process.env.SERVE_STATIC !== 'false' && isProduction,
    
    // CORS: Allow all when serving static (same origin)
    allowedOrigins: process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')
      : (isProduction ? ['*'] : ['http://localhost:3000', 'http://localhost:5173']),
    
    // Database: Use Railway variables if available, else defaults
    database: {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      user: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      name: process.env.DATABASE_NAME || 'nft_collection',
      ssl: process.env.DATABASE_SSL === 'true',
    },
    
    // GalaChain API
    galachainApi: process.env.GALACHAIN_API || 
      'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken',
  };
};
```

**Key Features:**
- ✅ Smart defaults for everything
- ✅ Works in development without config
- ✅ Works in production with Railway auto-vars
- ✅ Can override if needed

### Frontend Config

**frontend/vite.config.ts:**
```typescript
export default defineConfig({
  plugins: [vue(), nodePolyfills({ include: ['buffer'] })],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
```

**frontend/.env.example:**
```env
# Only needed if frontend is separate service (not our case)
VITE_API_URL=http://localhost:4000
```

**Result**: Frontend works in dev, builds for production automatically.

---

## Static File Serving

### Automatic Detection

**backend/src/main.ts:**
```typescript
// After API routes are registered
if (config.serveStatic) {
  const expressApp = app.getHttpAdapter().getInstance();
  const path = require('path');
  const fs = require('fs');
  
  // Try multiple locations (Railway build paths)
  const paths = [
    path.join(__dirname, '../frontend/dist'),
    path.join(__dirname, '../../frontend/dist'),
    path.join(process.cwd(), 'frontend/dist'),
  ];
  
  for (const staticPath of paths) {
    if (fs.existsSync(staticPath)) {
      expressApp.use(express.static(staticPath, { index: false }));
      
      // SPA routing - catch all non-API routes
      expressApp.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path === '/health') {
          return next();
        }
        res.sendFile(path.join(staticPath, 'index.html'));
      });
      
      console.log(`✅ Serving frontend from: ${staticPath}`);
      break;
    }
  }
}
```

**Result**: Automatically finds and serves frontend, no configuration needed.

---

## API Design

### Same Endpoints (No Changes)

- `POST /api/collections/claim`
- `GET /api/collections/:address`
- `POST /api/token-classes/create`
- `GET /api/token-classes/user/:address`
- `POST /api/mint/tokens`
- `GET /api/mint/transactions/:address`
- `GET /health` (new - for Railway)

**No Changes**: Current API is fine.

---

## Frontend Design

### Same Components (No Changes)

- `WalletConnect.vue`
- `ClaimCollection.vue`
- `MyCollections.vue`
- `CreateTokenClass.vue`
- `MyTokenClasses.vue`
- `MintTokens.vue`

### API Service

**frontend/src/services/api.ts:**
```typescript
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export const api = {
  async request(endpoint: string, options?: RequestInit) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },
  
  collections: {
    claim: (data: any) => api.request('/collections/claim', { method: 'POST', body: JSON.stringify(data) }),
    getUserCollections: (addr: string) => api.request(`/collections/${addr}`),
    // ... same as current
  },
  // ... same as current
};
```

**Result**: Same functionality, cleaner API client.

---

## Database Migrations

### Automatic Migration Running

**backend/src/config/database.ts:**
```typescript
export const getDatabaseConfig = (config: AppConfig) => ({
  type: 'postgres',
  host: config.database.host,
  port: config.database.port,
  username: config.database.user,
  password: config.database.password,
  database: config.database.name,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: config.nodeEnv === 'development', // Only in dev
  migrationsRun: config.nodeEnv === 'production', // Auto-run in prod
  ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
});
```

**Result**: Migrations run automatically in production, no manual steps.

---

## Railway Configuration

### Minimal railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "cd backend && npm run start:prod",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Result**: Railway auto-detects everything else from `nixpacks.toml`.

---

## Environment Variables

### Development (.env)

```env
# Optional - all have defaults
NODE_ENV=development
PORT=4000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nft_collection
DATABASE_SSL=false
```

### Production (Railway)

**Auto-provided by Railway:**
- `PORT` - Railway provides
- `NODE_ENV` - Railway sets to `production`
- `DATABASE_*` - PostgreSQL plugin provides
- `RAILWAY_PUBLIC_DOMAIN` - When domain generated

**Optional overrides:**
- `SERVE_STATIC=false` - Only if you want to disable
- `ALLOWED_ORIGINS` - Only if using separate frontend
- `GALACHAIN_API` - Only if using different API

**Result**: Zero configuration needed in Railway.

---

## Implementation Steps

### Phase 1: Project Setup (Day 1)

1. **Create project structure**
   ```bash
   mkdir nft-collection-manager
   cd nft-collection-manager
   ```

2. **Initialize backend**
   ```bash
   cd backend
   npm init -y
   npm install @nestjs/core @nestjs/common @nestjs/platform-express
   npm install @nestjs/typeorm typeorm pg
   npm install @nestjs/config @nestjs/terminus
   npm install -D @nestjs/cli typescript @types/node
   ```

3. **Initialize frontend**
   ```bash
   cd ../frontend
   npm create vite@latest . -- --template vue-ts
   npm install @gala-chain/connect vue-router
   ```

4. **Create Railway configs**
   - `backend/nixpacks.toml`
   - `railway.json` (root)

### Phase 2: Backend Core (Day 2)

1. **Setup NestJS**
   - `main.ts` with smart config
   - `app.module.ts` with TypeORM
   - `app.controller.ts` with health check

2. **Database config**
   - `config/database.ts` with smart defaults
   - `config/app.ts` with smart defaults

3. **Create entities**
   - `Collection`, `TokenClass`, `MintTransaction`
   - Snake_case columns, proper indexes

4. **Create migration**
   - Initial migration with all tables

### Phase 3: Backend Services (Day 3)

1. **GalaChain service**
   - Same as current, use ConfigService

2. **Collection service**
   - Same logic as current

3. **TokenClass service**
   - Same logic as current

4. **Mint service**
   - Same logic as current

### Phase 4: Backend Controllers (Day 4)

1. **Collection controller**
   - Same endpoints as current

2. **TokenClass controller**
   - Same endpoints as current

3. **Mint controller**
   - Same endpoints as current

### Phase 5: Frontend (Day 5)

1. **Setup Vue app**
   - Router, services, components

2. **Create components**
   - Same 6 components as current
   - Same UI, same functionality

3. **API service**
   - Centralized API client

### Phase 6: Static File Serving (Day 6)

1. **Update main.ts**
   - Add static file serving logic
   - SPA routing handler

2. **Test locally**
   - Build frontend
   - Serve from backend
   - Verify routing works

### Phase 7: Railway Deployment (Day 7)

1. **Test build locally**
   ```bash
   cd backend
   npm run build:all
   npm run start:prod
   ```

2. **Deploy to Railway**
   - Connect GitHub repo
   - Add PostgreSQL plugin
   - Generate domain
   - Verify deployment

3. **Test production**
   - Verify frontend loads
   - Verify API works
   - Verify database connection
   - Test all functionality

---

## Testing Strategy

### Local Testing

1. **Database**
   ```bash
   docker run --name postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=nft_collection -p 5432:5432 -d postgres
   ```

2. **Backend**
   ```bash
   cd backend
   npm run migration:run
   npm run start:dev
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Unified test**
   ```bash
   cd backend
   npm run build:all
   npm run start:prod
   # Visit http://localhost:4000
   ```

### Railway Testing

1. **Deploy**
   - Push to GitHub
   - Railway auto-deploys

2. **Verify**
   - Health check: `https://your-domain.railway.app/health`
   - Frontend: `https://your-domain.railway.app/`
   - API: `https://your-domain.railway.app/api/collections/...`

---

## Key Differences from Original Plan

### What We're NOT Doing

1. ❌ Separate frontend service
2. ❌ Complex environment variable setup
3. ❌ Manual CORS configuration
4. ❌ Multiple deployment strategies
5. ❌ Over-engineering

### What We ARE Doing

1. ✅ Unified service (simplest)
2. ✅ Smart defaults (zero config)
3. ✅ Automatic static serving
4. ✅ Railway-native design
5. ✅ Start simple, stay simple

---

## Success Criteria

### Deployment

- [ ] Push to GitHub → Railway auto-deploys
- [ ] No manual configuration needed
- [ ] Frontend and API work on same domain
- [ ] Database migrations run automatically
- [ ] Health check works

### Functionality

- [ ] Wallet connection works
- [ ] Collection claiming works
- [ ] Token class creation works
- [ ] Minting works
- [ ] All UI components render correctly

### Developer Experience

- [ ] Local development works with defaults
- [ ] Build process is clear
- [ ] Deployment is one-click
- [ ] Documentation is minimal but complete

---

## Documentation

### Minimal Docs Needed

1. **README.md**
   - What it is
   - How to run locally
   - How to deploy to Railway (2 steps)

2. **.env.example**
   - Show optional variables
   - Explain defaults

3. **RAILWAY_ZERO_CONFIG.md**
   - Explain zero-config approach
   - Troubleshooting

**No need for:**
- Complex architecture diagrams
- Multiple deployment guides
- Environment variable reference tables
- Separate service documentation

---

## Timeline

- **Day 1**: Project setup
- **Day 2**: Backend core
- **Day 3**: Backend services
- **Day 4**: Backend controllers
- **Day 5**: Frontend
- **Day 6**: Static serving & testing
- **Day 7**: Railway deployment

**Total: 7 days** (vs. 6 weeks in original plan)

---

## Cost Comparison

### Original Plan (Separate Services)
- Backend service: $5-20/month
- Frontend service: $5-20/month
- **Total: $10-40/month**

### New Plan (Unified Service)
- Single service: $5-20/month
- **Total: $5-20/month**

**Savings: 50%**

---

## Maintenance

### What Needs Maintenance

1. **Dependencies** - Update npm packages
2. **Database** - Run migrations when needed
3. **Code** - Feature updates

### What Doesn't Need Maintenance

1. ❌ Separate service configurations
2. ❌ CORS settings
3. ❌ Environment variable management
4. ❌ Deployment pipelines
5. ❌ Domain configurations

**Result: Less maintenance, fewer things to break**

---

## Future Considerations

### When to Split Services

Only split if:
1. Frontend traffic is 10x backend traffic
2. Need global CDN distribution
3. Different teams need independent deploys
4. Cost savings from free frontend hosting

**Otherwise: Keep it unified.**

### When to Add Complexity

Only add if:
1. There's a real, measurable problem
2. The solution clearly fixes it
3. The complexity is worth it

**Otherwise: Keep it simple.**

---

## Conclusion

This plan prioritizes:

1. **Simplicity** - Unified service, zero config
2. **Railway-Native** - Uses platform conventions
3. **Smart Defaults** - Works out of the box
4. **YAGNI** - No premature optimization
5. **Developer Experience** - Easy to work with

**Result**: A project that deploys to Railway with zero configuration, minimal maintenance, and maximum simplicity.

---

## Next Steps

1. Review this plan
2. Start implementation
3. Deploy to Railway
4. Verify it works
5. Done!

**No tweaking, no fiddling, no bullshit. Just works.**

