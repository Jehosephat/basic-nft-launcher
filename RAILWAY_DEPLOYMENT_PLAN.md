# Railway Deployment Plan - NFT Collection Manager

## Executive Summary

This document provides an extremely detailed plan for recreating the NFT Collection Manager application optimized for Railway deployment. The new architecture will maintain the same UI form structure and functionality (creating collections, classes, and minting) while being built from the ground up with Railway deployment in mind.

---

## Table of Contents

1. [Current Architecture Analysis](#current-architecture-analysis)
2. [Railway Deployment Requirements](#railway-deployment-requirements)
3. [New Architecture Design](#new-architecture-design)
4. [Technology Stack Decisions](#technology-stack-decisions)
5. [Project Structure](#project-structure)
6. [Database Design](#database-design)
7. [API Design](#api-design)
8. [Frontend Architecture](#frontend-architecture)
9. [Backend Architecture](#backend-architecture)
10. [Environment Configuration](#environment-configuration)
11. [Railway Configuration](#railway-configuration)
12. [Migration Strategy](#migration-strategy)
13. [Implementation Phases](#implementation-phases)
14. [Testing Strategy](#testing-strategy)
15. [Deployment Checklist](#deployment-checklist)

---

## Current Architecture Analysis

### Current Stack
- **Frontend**: Vue 3 + TypeScript + Vite
  - Runs on port 3000 (dev) / 5173 (prod)
  - Proxies API requests to backend via Vite proxy
  - Uses Vue Router for navigation
  - Components: WalletConnect, ClaimCollection, MyCollections, CreateTokenClass, MyTokenClasses, MintTokens
  
- **Backend**: NestJS + TypeScript
  - Runs on port 4000
  - RESTful API with `/api` prefix
  - Modules: Collection, TokenClass, Mint, Wallet, Transaction
  - SQLite database (file-based, `nft-collection.db`)
  - TypeORM with synchronize: true (development only)
  
- **Database**: SQLite
  - File-based database
  - Entities: Collection, TokenClass, MintTransaction, User, Transaction
  - No migrations (synchronize: true)
  
- **External Services**:
  - GalaChain Testnet API
  - MetaMask wallet integration via @gala-chain/connect

### Current Issues for Railway Deployment
1. **SQLite**: File-based database doesn't work well with Railway's ephemeral filesystem
2. **Two separate services**: Frontend and backend need separate Railway services or unified deployment
3. **Hardcoded ports**: Ports are hardcoded, Railway provides dynamic ports
4. **Environment variables**: Some hardcoded values, need proper env var management
5. **Build process**: Separate build commands for frontend and backend
6. **CORS**: Hardcoded CORS origins, needs dynamic configuration
7. **Database migrations**: No migration system, uses synchronize

---

## Railway Deployment Requirements

### Railway Platform Characteristics
1. **Ephemeral filesystem**: Files written to disk are lost on restart
2. **Dynamic ports**: Railway assigns ports via `PORT` environment variable
3. **PostgreSQL support**: Native PostgreSQL plugin available
4. **Environment variables**: Secure environment variable management
5. **Build and deploy**: Supports npm, Docker, or custom build commands
6. **Multiple services**: Can deploy multiple services from monorepo
7. **Health checks**: Supports health check endpoints
8. **Static file serving**: Can serve static files from backend or use separate service

### Railway Best Practices
1. Use PostgreSQL instead of SQLite
2. Use environment variables for all configuration
3. Implement proper database migrations
4. Use dynamic port binding
5. Implement health check endpoints
6. Use Railway's PostgreSQL plugin
7. Consider monorepo structure for multiple services
8. Use Railway's static file serving or separate frontend service

---

## New Architecture Design

### Architecture Decision: Monorepo with Separate Services

**Decision**: Use a monorepo structure with separate frontend and backend services that can be deployed independently on Railway.

**Rationale**:
- Allows independent scaling
- Clear separation of concerns
- Railway supports multiple services from one repo
- Can deploy frontend as static files or separate service
- Easier to manage environment variables per service

### Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Railway Platform                      │
│                                                          │
│  ┌──────────────────┐      ┌──────────────────┐         │
│  │  Frontend       │      │  Backend API     │         │
│  │  Service        │◄─────┤  Service        │         │
│  │  (Static/Vue)   │      │  (NestJS)       │         │
│  └──────────────────┘      └────────┬─────────┘       │
│                                      │                   │
│                                      ▼                   │
│                              ┌──────────────────┐        │
│                              │  PostgreSQL      │        │
│                              │  (Railway Plugin)│        │
│                              └──────────────────┘        │
└─────────────────────────────────────────────────────────┘
         │                              │
         │                              │
         ▼                              ▼
┌──────────────────┐      ┌──────────────────┐
│  MetaMask        │      │  GalaChain API   │
│  (Browser)       │      │  (External)      │
└──────────────────┘      └──────────────────┘
```

### Alternative: Unified Service (Simpler)

**Alternative Decision**: Serve frontend as static files from backend service.

**Rationale**:
- Single service to deploy
- Simpler configuration
- Lower cost (one service instead of two)
- Still allows separation in codebase

**Trade-offs**:
- Frontend and backend scale together
- Less flexibility for independent deployments

**Recommendation**: Start with unified service, can split later if needed.

---

## Technology Stack Decisions

### Frontend Stack
- **Framework**: Vue 3 (same as current)
- **Language**: TypeScript (same as current)
- **Build Tool**: Vite (same as current)
- **Router**: Vue Router (same as current)
- **Wallet**: @gala-chain/connect (same as current)
- **HTTP Client**: Native fetch (same as current)
- **Styling**: CSS (same as current, maintain same styles)

**Rationale**: Keep frontend stack identical to maintain UI form structure and functionality.

### Backend Stack
- **Framework**: NestJS (same as current)
- **Language**: TypeScript (same as current)
- **Database ORM**: TypeORM (same as current)
- **Database**: PostgreSQL (changed from SQLite)
- **Validation**: class-validator (same as current)
- **HTTP Framework**: Express (via NestJS, same as current)

**Rationale**: Minimal changes to backend, only database changes.

### Database Stack
- **Database**: PostgreSQL (changed from SQLite)
- **ORM**: TypeORM (same as current)
- **Migrations**: TypeORM migrations (new, replaces synchronize)
- **Connection**: Railway PostgreSQL plugin

**Rationale**: PostgreSQL is production-ready and works perfectly with Railway.

### Infrastructure
- **Platform**: Railway
- **Database**: Railway PostgreSQL Plugin
- **Environment**: Railway Environment Variables
- **Build**: Railway Build System (npm)

---

## Project Structure

### Monorepo Structure

```
nft-collection-manager/
├── .gitignore
├── .railwayignore
├── package.json                    # Root package.json (workspace config)
├── railway.json                    # Railway configuration
├── README.md
├── docker-compose.yml              # Local development
├── .env.example                    # Environment variable template
│
├── frontend/                       # Frontend service
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   ├── index.html
│   ├── public/
│   └── src/
│       ├── main.ts
│       ├── App.vue
│       ├── style.css
│       ├── components/
│       │   ├── WalletConnect.vue
│       │   ├── ClaimCollection.vue
│       │   ├── MyCollections.vue
│       │   ├── CreateTokenClass.vue
│       │   ├── MyTokenClasses.vue
│       │   └── MintTokens.vue
│       ├── services/
│       │   ├── walletService.ts
│       │   ├── galachainService.ts
│       │   └── apiService.ts        # NEW: Centralized API client
│       ├── router/
│       │   └── index.ts
│       └── types/
│           └── index.ts             # NEW: Shared types
│
├── backend/                        # Backend service
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts       # NEW: Health check endpoint
│   │   ├── config/
│   │   │   ├── database.config.ts  # NEW: Database configuration
│   │   │   └── app.config.ts       # NEW: App configuration
│   │   ├── entities/
│   │   │   ├── collection.entity.ts
│   │   │   ├── token-class.entity.ts
│   │   │   └── mint-transaction.entity.ts
│   │   ├── migrations/             # NEW: Database migrations
│   │   │   └── 0001-initial.ts
│   │   ├── collection/
│   │   │   ├── collection.module.ts
│   │   │   ├── collection.controller.ts
│   │   │   └── collection.service.ts
│   │   ├── token-class/
│   │   │   ├── token-class.module.ts
│   │   │   ├── token-class.controller.ts
│   │   │   └── token-class.service.ts
│   │   ├── mint/
│   │   │   ├── mint.module.ts
│   │   │   ├── mint.controller.ts
│   │   │   └── mint.service.ts
│   │   ├── services/
│   │   │   └── galachain.service.ts
│   │   └── common/
│   │       ├── filters/
│   │       │   └── http-exception.filter.ts  # NEW: Error handling
│   │       └── interceptors/
│   │           └── logging.interceptor.ts   # NEW: Logging
│   │
└── shared/                         # NEW: Shared types/utilities
    └── types/
        └── index.ts
```

### Alternative: Unified Service Structure

If using unified service (frontend served from backend):

```
nft-collection-manager/
├── .gitignore
├── .railwayignore
├── package.json
├── railway.json
├── README.md
├── .env.example
│
├── frontend/                       # Frontend source (not separate service)
│   └── [same structure as above]
│
├── backend/                        # Backend service (serves frontend)
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   └── app.config.ts
│   │   ├── entities/
│   │   ├── migrations/
│   │   ├── collection/
│   │   ├── token-class/
│   │   ├── mint/
│   │   ├── services/
│   │   └── common/
│   │
└── shared/
    └── types/
```

**Recommendation**: Use unified service structure for simplicity.

---

## Database Design

### PostgreSQL Schema

#### Collections Table
```sql
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  collection_name VARCHAR(255) UNIQUE NOT NULL,
  wallet_address VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),
  category VARCHAR(100),
  symbol VARCHAR(50),
  contract_address VARCHAR(255),
  name VARCHAR(255),
  type VARCHAR(100),
  rarity VARCHAR(100),
  max_supply VARCHAR(50),
  max_capacity VARCHAR(50),
  metadata_address VARCHAR(255),
  transaction_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_collections_wallet_address ON collections(wallet_address);
CREATE INDEX idx_collections_collection_name ON collections(collection_name);
```

#### Token Classes Table
```sql
CREATE TABLE token_classes (
  id SERIAL PRIMARY KEY,
  collection VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  additional_key VARCHAR(255) DEFAULT 'none',
  wallet_address VARCHAR(255) NOT NULL,
  transaction_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  current_supply VARCHAR(50) DEFAULT '0',
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(collection, type, category, additional_key)
);

CREATE INDEX idx_token_classes_wallet_address ON token_classes(wallet_address);
CREATE INDEX idx_token_classes_collection ON token_classes(collection);
CREATE INDEX idx_token_classes_composite ON token_classes(collection, type, category, additional_key);
```

#### Mint Transactions Table
```sql
CREATE TABLE mint_transactions (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(255) NOT NULL,
  collection VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  additional_key VARCHAR(255),
  owner VARCHAR(255) NOT NULL,
  quantity VARCHAR(50) NOT NULL,
  token_instance VARCHAR(50) DEFAULT '0',
  transaction_id VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mint_transactions_wallet_address ON mint_transactions(wallet_address);
CREATE INDEX idx_mint_transactions_collection ON mint_transactions(collection);
CREATE INDEX idx_mint_transactions_created_at ON mint_transactions(created_at DESC);
```

### TypeORM Entities

#### Collection Entity
```typescript
@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'collection_name', unique: true })
  collectionName: string;

  @Column({ name: 'wallet_address' })
  walletAddress: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ name: 'contract_address', nullable: true })
  contractAddress: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  rarity: string;

  @Column({ name: 'max_supply', nullable: true })
  maxSupply: string;

  @Column({ name: 'max_capacity', nullable: true })
  maxCapacity: string;

  @Column({ name: 'metadata_address', nullable: true })
  metadataAddress: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### Token Class Entity
```typescript
@Entity('token_classes')
@Unique(['collection', 'type', 'category', 'additionalKey'])
export class TokenClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  collection: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ name: 'additional_key', default: 'none' })
  additionalKey: string;

  @Column({ name: 'wallet_address' })
  walletAddress: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'current_supply', default: '0' })
  currentSupply: string;

  @Column({ nullable: true })
  image: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

#### Mint Transaction Entity
```typescript
@Entity('mint_transactions')
export class MintTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'wallet_address' })
  walletAddress: string;

  @Column()
  collection: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ name: 'additional_key', nullable: true })
  additionalKey: string;

  @Column()
  owner: string;

  @Column()
  quantity: string;

  @Column({ name: 'token_instance', default: '0' })
  tokenInstance: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Database Migrations

#### Initial Migration (0001-initial.ts)
```typescript
import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class InitialMigration1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create collections table
    await queryRunner.createTable(
      new Table({
        name: 'collections',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'collection_name', type: 'varchar', length: '255', isUnique: true, isNullable: false },
          { name: 'wallet_address', type: 'varchar', length: '255', isNullable: false },
          // ... other columns
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'collections',
      new TableIndex({
        name: 'idx_collections_wallet_address',
        columnNames: ['wallet_address'],
      }),
    );

    // Repeat for token_classes and mint_transactions tables
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('mint_transactions');
    await queryRunner.dropTable('token_classes');
    await queryRunner.dropTable('collections');
  }
}
```

---

## API Design

### API Endpoints (Same as Current)

#### Collections
- `POST /api/collections/claim` - Claim a collection
- `GET /api/collections/:address` - Get user's collections
- `GET /api/collections/single/:collectionName` - Get single collection
- `POST /api/collections/estimate-fee` - Estimate claim fee
- `GET /api/collections/estimate-fee/:address` - Estimate fee (GET variant)

#### Token Classes
- `POST /api/token-classes/create` - Create a token class
- `GET /api/token-classes/user/:address` - Get user's token classes
- `GET /api/token-classes/collection/:collection` - Get collection's token classes
- `POST /api/token-classes/estimate-fee` - Estimate creation fee
- `GET /api/token-classes/estimate-fee/:address` - Estimate fee (GET variant)

#### Minting
- `POST /api/mint/tokens` - Mint NFTs
- `GET /api/mint/transactions/:address` - Get mint transactions
- `POST /api/mint/estimate-fee` - Estimate minting fee
- `GET /api/mint/estimate-fee/:address` - Estimate fee (GET variant)

#### Health Check (NEW)
- `GET /health` - Health check endpoint for Railway
- `GET /api/health` - Alternative health check endpoint

### API Response Format

```typescript
// Success Response
{
  success: true,
  message?: string,
  data?: any,
  // ... other fields
}

// Error Response
{
  success: false,
  statusCode: number,
  message: string,
  error?: string
}
```

### API Error Handling

```typescript
// Global Exception Filter
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    response.status(status).json({
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: typeof message === 'string' ? message : (message as any).message,
    });
  }
}
```

---

## Frontend Architecture

### Component Structure (Same as Current)

1. **WalletConnect.vue** - Wallet connection component
2. **ClaimCollection.vue** - Collection claiming form
3. **MyCollections.vue** - Collections list view
4. **CreateTokenClass.vue** - Token class creation form
5. **MyTokenClasses.vue** - Token classes list view
6. **MintTokens.vue** - Minting form

### API Service Layer (NEW)

```typescript
// src/services/apiService.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiService = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },

  // Collections
  collections: {
    claim: (data: ClaimCollectionDto) =>
      apiService.request('/collections/claim', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getUserCollections: (address: string) =>
      apiService.request(`/collections/${address}`),
    // ... other methods
  },

  // Token Classes
  tokenClasses: {
    create: (data: CreateTokenClassDto) =>
      apiService.request('/token-classes/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    // ... other methods
  },

  // Mint
  mint: {
    mintTokens: (data: MintTokensDto) =>
      apiService.request('/mint/tokens', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    // ... other methods
  },
};
```

### Environment Variables

```env
# Frontend .env.example
VITE_API_URL=http://localhost:4000/api
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
```

### Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    vue(),
    nodePolyfills({
      include: ['buffer'],
    }),
  ],
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
    // For serving from backend
    // emptyOutDir: false,
  },
});
```

---

## Backend Architecture

### Main Application Setup

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:5173'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global prefix
  app.setGlobalPrefix('api');

  // Serve static files (if unified service)
  if (process.env.SERVE_STATIC === 'true') {
    const path = require('path');
    app.useStaticAssets(path.join(__dirname, '../frontend/dist'));
    app.setBaseViewsDir(path.join(__dirname, '../frontend/dist'));
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
}

bootstrap();
```

### Database Configuration

```typescript
// src/config/database.config.ts
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USER'),
    password: configService.get<string>('DATABASE_PASSWORD'),
    database: configService.get<string>('DATABASE_NAME'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: configService.get<string>('NODE_ENV') === 'development',
    migrationsRun: configService.get<string>('NODE_ENV') !== 'development',
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl: configService.get<string>('DATABASE_SSL') === 'true' ? {
      rejectUnauthorized: false,
    } : false,
  };
};
```

### App Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getDatabaseConfig } from './config/database.config';
import { CollectionModule } from './collection/collection.module';
import { TokenClassModule } from './token-class/token-class.module';
import { MintModule } from './mint/mint.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    CollectionModule,
    TokenClassModule,
    MintModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

### Health Check Controller

```typescript
// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller()
export class AppController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get('health')
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }

  @Get('api/health')
  @HealthCheck()
  apiHealth() {
    return this.check();
  }
}
```

### Environment Variables

```env
# Backend .env.example
NODE_ENV=production
PORT=4000

# Database (Railway PostgreSQL)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nft_collection
DATABASE_SSL=false

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# GalaChain
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

# Static File Serving (if unified)
SERVE_STATIC=false
```

---

## Environment Configuration

### Development Environment

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:4000/api
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
```

#### Backend (.env)
```env
NODE_ENV=development
PORT=4000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=nft_collection_dev
DATABASE_SSL=false

ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

SERVE_STATIC=false
```

### Production Environment (Railway)

#### Frontend Service Variables
```env
VITE_API_URL=https://your-backend-service.railway.app/api
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
```

#### Backend Service Variables
```env
NODE_ENV=production
PORT=${{PORT}}  # Railway provides this

# Railway PostgreSQL Plugin provides these:
DATABASE_HOST=${{Postgres.DATABASE_HOST}}
DATABASE_PORT=${{Postgres.DATABASE_PORT}}
DATABASE_USER=${{Postgres.DATABASE_USER}}
DATABASE_PASSWORD=${{Postgres.DATABASE_PASSWORD}}
DATABASE_NAME=${{Postgres.DATABASE_NAME}}
DATABASE_SSL=true

ALLOWED_ORIGINS=https://your-frontend-service.railway.app

GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

SERVE_STATIC=false  # If using separate frontend service
```

---

## Railway Configuration

### Railway.json (Root)

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

### Railway Service Configuration

#### Backend Service
- **Build Command**: `cd backend && npm install && npm run build`
- **Start Command**: `cd backend && npm run start:prod`
- **Health Check Path**: `/health`
- **Health Check Timeout**: 100
- **Root Directory**: `backend`

#### Frontend Service (if separate)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Start Command**: `cd frontend && npx serve -s dist -l $PORT`
- **Health Check Path**: `/`
- **Health Check Timeout**: 100
- **Root Directory**: `frontend`

### Railway PostgreSQL Plugin

1. Add PostgreSQL plugin to Railway project
2. Railway automatically provides environment variables:
   - `DATABASE_HOST`
   - `DATABASE_PORT`
   - `DATABASE_USER`
   - `DATABASE_PASSWORD`
   - `DATABASE_NAME`
   - `DATABASE_URL` (connection string)

### Railway Environment Variables Setup

1. Go to Railway project settings
2. Add environment variables for each service
3. Use Railway's variable references for PostgreSQL:
   - `${{Postgres.DATABASE_HOST}}`
   - `${{Postgres.DATABASE_PORT}}`
   - etc.

### Railway Deployment Process

1. **Connect Repository**: Connect GitHub repo to Railway
2. **Create Services**: Create backend (and optionally frontend) service
3. **Add PostgreSQL**: Add PostgreSQL plugin
4. **Configure Environment**: Set environment variables
5. **Deploy**: Railway automatically builds and deploys on push
6. **Run Migrations**: Migrations run automatically on startup (if configured)

---

## Migration Strategy

### Data Migration (if needed)

If migrating from existing SQLite database:

1. **Export SQLite Data**:
   ```bash
   sqlite3 nft-collection.db .dump > dump.sql
   ```

2. **Transform SQL**:
   - Convert SQLite syntax to PostgreSQL
   - Update column names (snake_case)
   - Update data types

3. **Import to PostgreSQL**:
   ```bash
   psql -h $DATABASE_HOST -U $DATABASE_USER -d $DATABASE_NAME -f transformed_dump.sql
   ```

### Code Migration Steps

1. **Update Database Configuration**:
   - Change from SQLite to PostgreSQL
   - Update TypeORM configuration
   - Add migration support

2. **Update Entities**:
   - Add column name mappings (snake_case)
   - Update column types if needed
   - Add indexes

3. **Create Migrations**:
   - Generate initial migration
   - Test migrations locally

4. **Update Environment Variables**:
   - Add PostgreSQL connection variables
   - Update CORS origins
   - Update API URLs

5. **Update Build/Deploy Scripts**:
   - Update package.json scripts
   - Add migration commands

---

## Implementation Phases

### Phase 1: Project Setup (Week 1)

#### 1.1 Initialize Monorepo
- [ ] Create root directory structure
- [ ] Initialize root package.json
- [ ] Set up workspace configuration
- [ ] Create .gitignore and .railwayignore
- [ ] Create README.md

#### 1.2 Backend Setup
- [ ] Initialize NestJS project in `backend/`
- [ ] Install dependencies (NestJS, TypeORM, PostgreSQL driver)
- [ ] Set up TypeScript configuration
- [ ] Create .env.example
- [ ] Set up ConfigModule

#### 1.3 Frontend Setup
- [ ] Initialize Vite + Vue project in `frontend/`
- [ ] Install dependencies (Vue 3, Vue Router, @gala-chain/connect)
- [ ] Set up TypeScript configuration
- [ ] Create .env.example
- [ ] Set up Vite configuration

#### 1.4 Database Setup
- [ ] Create PostgreSQL database locally
- [ ] Set up TypeORM entities
- [ ] Create initial migration
- [ ] Test database connection

### Phase 2: Backend Implementation (Week 2)

#### 2.1 Core Infrastructure
- [ ] Implement database configuration
- [ ] Set up AppModule
- [ ] Create health check endpoint
- [ ] Set up global exception filter
- [ ] Set up logging interceptor
- [ ] Configure CORS

#### 2.2 Collection Module
- [ ] Create Collection entity
- [ ] Implement CollectionService
- [ ] Implement CollectionController
- [ ] Add validation DTOs
- [ ] Test collection endpoints

#### 2.3 Token Class Module
- [ ] Create TokenClass entity
- [ ] Implement TokenClassService
- [ ] Implement TokenClassController
- [ ] Add validation DTOs
- [ ] Test token class endpoints

#### 2.4 Mint Module
- [ ] Create MintTransaction entity
- [ ] Implement MintService
- [ ] Implement MintController
- [ ] Add validation DTOs
- [ ] Test mint endpoints

#### 2.5 GalaChain Service
- [ ] Implement GalaChainService
- [ ] Add all GalaChain API methods
- [ ] Add error handling
- [ ] Test GalaChain integration

### Phase 3: Frontend Implementation (Week 3)

#### 3.1 Core Setup
- [ ] Set up Vue Router
- [ ] Create API service layer
- [ ] Set up wallet service
- [ ] Create shared types

#### 3.2 Components
- [ ] Implement WalletConnect component
- [ ] Implement ClaimCollection component
- [ ] Implement MyCollections component
- [ ] Implement CreateTokenClass component
- [ ] Implement MyTokenClasses component
- [ ] Implement MintTokens component

#### 3.3 App Integration
- [ ] Set up App.vue with routing
- [ ] Add navigation
- [ ] Add global styles
- [ ] Test component integration

### Phase 4: Database Migrations (Week 4)

#### 4.1 Migration Setup
- [ ] Configure TypeORM migrations
- [ ] Create initial migration
- [ ] Test migration up/down
- [ ] Add migration scripts to package.json

#### 4.2 Migration Testing
- [ ] Test migrations on clean database
- [ ] Test migrations on existing data (if applicable)
- [ ] Document migration process

### Phase 5: Railway Configuration (Week 4)

#### 5.1 Railway Setup
- [ ] Create Railway project
- [ ] Connect GitHub repository
- [ ] Add PostgreSQL plugin
- [ ] Configure environment variables

#### 5.2 Service Configuration
- [ ] Configure backend service
- [ ] Configure frontend service (if separate)
- [ ] Set up health checks
- [ ] Configure build commands

#### 5.3 Deployment Testing
- [ ] Test deployment process
- [ ] Test database connection
- [ ] Test API endpoints
- [ ] Test frontend connection

### Phase 6: Testing & Refinement (Week 5)

#### 6.1 Integration Testing
- [ ] Test wallet connection flow
- [ ] Test collection claiming
- [ ] Test token class creation
- [ ] Test minting
- [ ] Test error handling

#### 6.2 Performance Testing
- [ ] Test database queries
- [ ] Test API response times
- [ ] Test frontend load times
- [ ] Optimize if needed

#### 6.3 Documentation
- [ ] Update README.md
- [ ] Document environment variables
- [ ] Document deployment process
- [ ] Create API documentation

### Phase 7: Production Deployment (Week 6)

#### 7.1 Pre-Deployment
- [ ] Final code review
- [ ] Security audit
- [ ] Performance optimization
- [ ] Backup strategy

#### 7.2 Deployment
- [ ] Deploy to Railway
- [ ] Run database migrations
- [ ] Verify all services are running
- [ ] Test production endpoints

#### 7.3 Post-Deployment
- [ ] Monitor logs
- [ ] Test user flows
- [ ] Fix any issues
- [ ] Document production setup

---

## Testing Strategy

### Unit Testing

#### Backend
- [ ] Test CollectionService methods
- [ ] Test TokenClassService methods
- [ ] Test MintService methods
- [ ] Test GalaChainService methods
- [ ] Test validation DTOs

#### Frontend
- [ ] Test API service methods
- [ ] Test wallet service methods
- [ ] Test component logic (computed properties, methods)

### Integration Testing

- [ ] Test collection claiming flow
- [ ] Test token class creation flow
- [ ] Test minting flow
- [ ] Test error scenarios
- [ ] Test database operations

### End-to-End Testing

- [ ] Test complete user journey:
  1. Connect wallet
  2. Claim collection
  3. Create token class
  4. Mint NFTs
  5. View history

### Performance Testing

- [ ] Test database query performance
- [ ] Test API response times
- [ ] Test concurrent requests
- [ ] Test large data sets

---

## Deployment Checklist

### Pre-Deployment

- [ ] All code committed and pushed to repository
- [ ] All tests passing
- [ ] Environment variables documented
- [ ] Database migrations tested
- [ ] Build process tested locally
- [ ] Railway project created
- [ ] PostgreSQL plugin added
- [ ] Environment variables configured in Railway

### Deployment

- [ ] Backend service deployed
- [ ] Frontend service deployed (if separate)
- [ ] Database migrations run successfully
- [ ] Health checks passing
- [ ] All services running

### Post-Deployment Verification

- [ ] API endpoints accessible
- [ ] Frontend loads correctly
- [ ] Wallet connection works
- [ ] Collection claiming works
- [ ] Token class creation works
- [ ] Minting works
- [ ] Database operations work
- [ ] Error handling works
- [ ] Logs are accessible

### Monitoring

- [ ] Set up error monitoring
- [ ] Set up performance monitoring
- [ ] Set up database monitoring
- [ ] Set up uptime monitoring

---

## Key Differences from Current Implementation

### Database
- **Current**: SQLite (file-based)
- **New**: PostgreSQL (Railway plugin)
- **Impact**: Better for production, requires connection string

### Port Configuration
- **Current**: Hardcoded ports (3000, 4000)
- **New**: Dynamic ports via `PORT` environment variable
- **Impact**: Works with Railway's dynamic port assignment

### Environment Variables
- **Current**: Some hardcoded values
- **New**: All configuration via environment variables
- **Impact**: Better for deployment, more flexible

### Database Migrations
- **Current**: `synchronize: true` (no migrations)
- **New**: TypeORM migrations
- **Impact**: Better for production, version-controlled schema

### CORS Configuration
- **Current**: Hardcoded origins
- **New**: Configurable via environment variables
- **Impact**: Works with Railway's dynamic URLs

### Static File Serving
- **Current**: Separate frontend service
- **New**: Option to serve from backend or separate service
- **Impact**: More deployment flexibility

### Health Checks
- **Current**: None
- **New**: Health check endpoints for Railway
- **Impact**: Better monitoring and reliability

---

## Conclusion

This plan provides a comprehensive roadmap for recreating the NFT Collection Manager application optimized for Railway deployment. The new architecture maintains the same UI form structure and functionality while being built from the ground up with Railway deployment in mind.

Key improvements:
1. PostgreSQL instead of SQLite
2. Proper database migrations
3. Environment variable configuration
4. Health check endpoints
5. Railway-optimized deployment configuration
6. Better error handling and logging
7. Flexible deployment options (unified or separate services)

The implementation can proceed in phases, with each phase building on the previous one. The plan is detailed enough to guide development while remaining flexible enough to adapt to changing requirements.

