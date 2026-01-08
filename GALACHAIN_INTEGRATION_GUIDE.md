# GalaChain Integration Guide

**Purpose:** This document provides essential information for connecting to GalaChain, executing transactions, and reading chain data. It is designed to give another agent or developer everything needed to integrate GalaChain into a new project.

**Focus:** GalaChain-specific operations (connections, transactions, chain data). Light on peripheral services (Redis, databases, etc.).

---

## Table of Contents

1. [Prerequisites & Installation](#prerequisites--installation)
2. [GalaChain API Endpoints](#galachain-api-endpoints)
3. [Connecting to GalaChain](#connecting-to-galachain)
4. [Wallet Connection](#wallet-connection)
5. [Using @gala-chain/api Types](#using-galachain-api-types)
6. [Reading Chain Data](#reading-chain-data)
7. [Executing Transactions](#executing-transactions)
   - [Fungible Token Operations](#granting-allowances)
   - [NFT Operations](#nft-operations)
8. [Understanding Responses](#understanding-responses)
9. [Common Patterns](#common-patterns)
10. [Error Handling](#error-handling)

---

## Prerequisites & Installation

### Required Packages

```bash
npm install @gala-chain/api@^2.6.1
npm install @gala-chain/connect@^2.3.4
npm install bignumber.js
```

### Environment Variables

```env
# GalaChain API Endpoints (Mainnet)
GALACHAIN_TOKEN_GATEWAY_API=https://gateway-mainnet.galachain.com/api/asset/token-contract
GALACHAIN_PUBLIC_KEY_GATEWAY_API=https://gateway-mainnet.galachain.com/api/asset/public-key-contract
GALACHAIN_CONNECT_API=https://api-galaswap.gala.com/galachain

# GalaChain API Endpoints (Testnet)
GALACHAIN_TOKEN_GATEWAY_API_TESTNET=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
```

**Note:** For frontend applications, prefix with `VITE_` (e.g., `VITE_TOKEN_GATEWAY_API`).

---

## GalaChain API Endpoints

GalaChain uses **REST API endpoints** (not WebSocket RPC). All operations are HTTP POST requests to gateway endpoints.

### Core Endpoints

| Endpoint | Purpose | Mainnet Base URL | Testnet Base URL |
|----------|---------|-----------------|------------------|
| Token Gateway | Token operations (balances, transfers, allowances, burns) | `https://gateway-mainnet.galachain.com/api/asset/token-contract` | `https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken` |
| Public Key Gateway | User registration/public key operations | `https://gateway-mainnet.galachain.com/api/asset/public-key-contract` | (Use mainnet for registration) |
| Connect API | Wallet creation/connection | `https://api-galaswap.gala.com/galachain` | (Use mainnet for registration) |

### Token Gateway Operations

All token operations use the Token Gateway base URL with these paths:

**Fungible Token Operations:**
- `/FetchBalances` - Get token balances
- `/FetchAllowances` - Get allowances
- `/TransferToken` - Execute token transfer
- `/GrantAllowance` - Grant an allowance
- `/BurnTokens` - Burn tokens

**NFT Operations:**
- `/GrantNftCollectionAuthorization` - Claim authorization for an NFT collection name
- `/CreateNftCollection` - Create a new NFT token class within a collection
- `/MintTokenWithAllowance` - Mint NFT tokens to a specific owner
- `/FetchNftCollectionAuthorizationsWithPagination` - Fetch NFT collection authorizations
- `/FetchTokenClassesWithSupply` - Fetch token classes with supply information
- `/DryRun` - Estimate transaction fees without executing

**Important:** All requests must be **POST** with `Content-Type: application/json` and `accept: application/json`.

**Endpoint Format:** `${BASE_URL}/${METHOD_NAME}`

Example:
- Mainnet: `https://gateway-mainnet.galachain.com/api/asset/token-contract/TransferToken`
- Testnet: `https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken/TransferToken`

---

## Connecting to GalaChain

### Backend Client Setup

```typescript
export class GalaChainClient {
  private tokenGatewayApi: string;

  constructor(tokenGatewayApi?: string) {
    this.tokenGatewayApi = tokenGatewayApi || 
      process.env.GALACHAIN_TOKEN_GATEWAY_API || 
      'https://gateway-mainnet.galachain.com/api/asset/token-contract';
  }

  // All methods make POST requests to this.tokenGatewayApi + endpoint
}
```

### Request Pattern

All GalaChain API calls follow this pattern:

```typescript
async makeRequest(endpoint: string, dto: any): Promise<any> {
  const url = `${this.tokenGatewayApi}/${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GalaChain API error: ${response.status}\n${errorText}`);
  }

  return await response.json();
}
```

**Key Points:**
- Always use POST
- Always send JSON
- Always include `Content-Type: application/json` and `accept: application/json` headers
- Always check `response.ok` before parsing
- Error responses are plain text, not JSON
- Many operations require DTOs to be signed before submission (see [Signing Transactions](#signing-transactions))
- DTOs that require signing must include `dtoExpiresAt` (Unix timestamp in milliseconds) and `uniqueKey` fields

---

## Wallet Connection

### Frontend: BrowserConnectClient

GalaChain uses `@gala-chain/connect`'s `BrowserConnectClient` for wallet connections. This works with MetaMask and other Ethereum-compatible wallets.

```typescript
import { BrowserConnectClient } from '@gala-chain/connect';

// Initialize client
const client = new BrowserConnectClient();

// Connect wallet
const connected = await client.connect();

if (connected && client.galaChainAddress) {
  // client.galaChainAddress is the GalaChain address (eth|... format)
  console.log('Connected:', client.galaChainAddress);
}
```

### Complete Wallet Service Pattern

```typescript
export const walletService = {
  client: null as BrowserConnectClient | null,
  
  async connect(): Promise<{ address: string }> {
    // Check MetaMask availability
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    this.client = new BrowserConnectClient();
    const connected = await this.client.connect();
    
    if (connected && this.client.galaChainAddress) {
      return { address: this.client.galaChainAddress };
    }
    throw new Error('Failed to connect wallet');
  },
  
  async signTransaction(methodName: string, dto: any): Promise<any> {
    if (!this.client) throw new Error('Wallet not connected');
    
    // BrowserConnectClient.sign() signs DTOs
    // Method names: "TransferToken", "GrantAllowance", "BurnTokens", etc.
    return await this.client.sign(methodName, dto);
  },
  
  disconnect() {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  },
  
  getAddress(): string | null {
    return this.client?.galaChainAddress || null;
  }
};
```

### User Registration

Before using a wallet, users must register on GalaChain:

```typescript
async function registerUser(client: BrowserConnectClient): Promise<void> {
  // Get public key from wallet
  const publicKey = await client.getPublicKey();
  
  // Register via Connect API
  const response = await fetch(`${CONNECT_API}/CreateHeadlessWallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey: publicKey.publicKey }),
  });
  
  if (!response.ok) {
    throw new Error('Registration failed');
  }
}

// Check if user is registered
async function checkRegistration(address: string): Promise<boolean> {
  const response = await fetch(`${PUBLIC_KEY_GATEWAY_API}/GetPublicKey`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: address }),
  });
  return response.ok;
}
```

**Flow:**
1. Connect wallet
2. Check registration (`GetPublicKey`)
3. If not registered, register (`CreateHeadlessWallet`)
4. Proceed with operations

---

## Using @gala-chain/api Types

The `@gala-chain/api` package provides TypeScript types and classes for all GalaChain operations. Using these types ensures type safety and compatibility with GalaChain's API.

### Key Types Overview

| Type | Purpose | When to Use |
|------|---------|-------------|
| `TokenInstanceKey` | Token identifier for queries and operations | Reading balances, transfers, allowances |
| `TokenInstanceQueryKey` | Token identifier for queries (extends TokenInstanceKey) | Granting allowances (required by GrantAllowanceDto) |
| `TokenBalance` | Balance information | Reading balances from chain |
| `TokenAllowance` | Allowance information | Reading/managing allowances |
| `TransferTokenDto` | Transfer transaction DTO | Creating transfer transactions |
| `GrantAllowanceDto` | Allowance grant DTO | Creating allowance grants |
| `GrantAllowanceQuantity` | Quantity specification for allowances | Part of GrantAllowanceDto |
| `UserRef` | GalaChain address format | Converting addresses |

### Importing Types

```typescript
import {
  // Token identifiers
  TokenInstanceKey,
  TokenInstanceQueryKey,
  
  // Data types
  TokenBalance,
  TokenAllowance,
  
  // Transaction DTOs
  TransferTokenDto,
  GrantAllowanceDto,
  GrantAllowanceQuantity,
  
  // Utilities
  asValidUserRef,
} from '@gala-chain/api';

import BigNumber from 'bignumber.js';
```

### TokenInstanceKey vs TokenInstanceQueryKey

**TokenInstanceKey** - Used for most operations (transfers, balance queries, etc.)

```typescript
const tokenInstance: TokenInstanceKey = {
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none',
  instance: new BigNumber('0'), // BigNumber required
};
```

**TokenInstanceQueryKey** - Required specifically for GrantAllowanceDto

```typescript
// Create instance using class constructor
const tokenQueryKey = new TokenInstanceQueryKey();
tokenQueryKey.collection = 'GALA';
tokenQueryKey.category = 'Unit';
tokenQueryKey.type = 'none';
tokenQueryKey.additionalKey = 'none';
tokenQueryKey.instance = new BigNumber('0');

// Or create from TokenInstanceKey
const baseInstance: TokenInstanceKey = {
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none',
  instance: new BigNumber('0'),
};

const tokenQueryKey = new TokenInstanceQueryKey();
Object.assign(tokenQueryKey, baseInstance);
```

**Key Difference:** `TokenInstanceQueryKey` is a class that must be instantiated, while `TokenInstanceKey` is an interface/type that can be used as a plain object.

### Creating Token Instances

#### GALA Token

```typescript
import { TokenInstanceKey } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

const galaToken: TokenInstanceKey = {
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none',
  instance: new BigNumber('0'),
};
```

#### Custom Fungible Tokens

```typescript
const customToken: TokenInstanceKey = {
  collection: 'Token',
  category: 'Unit',
  type: 'USDC', // Token ticker/symbol
  additionalKey: 'creator-address', // Creator's wallet address
  instance: new BigNumber('0'),
};
```

#### Helper Function

```typescript
function createGalaTokenInstance(): TokenInstanceKey {
  return {
    collection: 'GALA',
    category: 'Unit',
    type: 'none',
    additionalKey: 'none',
    instance: new BigNumber('0'),
  };
}

function parseTokenInstance(tokenId: string): TokenInstanceKey {
  // Parse format: "collection:category:type:additionalKey:instance"
  const parts = tokenId.split(':');
  if (parts.length !== 5) {
    throw new Error('Invalid token ID format');
  }
  
  return {
    collection: parts[0],
    category: parts[1],
    type: parts[2],
    additionalKey: parts[3],
    instance: new BigNumber(parts[4]),
  };
}
```

### Creating Transaction DTOs

#### TransferTokenDto

```typescript
import { TransferTokenDto, asValidUserRef } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

// Create DTO instance
const transferDto = new TransferTokenDto();

// Set required fields
transferDto.from = asValidUserRef('eth|0x123...'); // Must use asValidUserRef
transferDto.to = asValidUserRef('eth|0x456...');
transferDto.quantity = new BigNumber('100.5'); // Must be BigNumber
transferDto.tokenInstance = galaToken; // TokenInstanceKey
transferDto.uniqueKey = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Optional: specify allowances explicitly
// transferDto.useAllowances = ['allowance-key-1', 'allowance-key-2'];

// Sign before submitting
// const signedDto = await client.sign("TransferToken", transferDto);
```

**Important Fields:**
- `from` and `to`: Must use `asValidUserRef()` to convert addresses
- `quantity`: Must be `BigNumber`, not string or number
- `tokenInstance`: Must be `TokenInstanceKey` (not TokenInstanceQueryKey)
- `uniqueKey`: Unique identifier to prevent duplicate transactions

#### GrantAllowanceDto

```typescript
import { GrantAllowanceDto, GrantAllowanceQuantity, TokenInstanceQueryKey, asValidUserRef } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

// Create token instance query key (must use class)
const tokenQueryKey = new TokenInstanceQueryKey();
tokenQueryKey.collection = 'GALA';
tokenQueryKey.category = 'Unit';
tokenQueryKey.type = 'none';
tokenQueryKey.additionalKey = 'none';
tokenQueryKey.instance = new BigNumber('0');

// Create DTO instance
const grantDto = new GrantAllowanceDto();

// Set required fields
grantDto.tokenInstance = tokenQueryKey; // Must be TokenInstanceQueryKey
grantDto.allowanceType = 3; // 3 = transfer allowances, 4 = mint allowances
grantDto.uses = new BigNumber('9007199254740991'); // Max uses (effectively unlimited)
grantDto.expires = 0; // 0 = no expiry, or timestamp in milliseconds
grantDto.quantities = [
  {
    user: asValidUserRef('eth|0x456...'), // Who receives the allowance
    quantity: new BigNumber('1000'), // Amount granted
  } as GrantAllowanceQuantity,
];
grantDto.uniqueKey = `allowance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Sign before submitting
// const signedDto = await client.sign("GrantAllowance", grantDto);
```

**Important Fields:**
- `tokenInstance`: Must be `TokenInstanceQueryKey` (class instance), not `TokenInstanceKey`
- `allowanceType`: `3` for transfer allowances, `4` for mint allowances
- `uses`: BigNumber representing max uses (use max safe integer for unlimited)
- `expires`: `0` for no expiry, or timestamp in milliseconds
- `quantities`: Array of `GrantAllowanceQuantity` objects

### Working with TokenBalance

```typescript
import { TokenBalance } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

// TokenBalance from API response (mapped from flat API response)
// Note: TokenBalance is a class, so you may need to instantiate it or map from API response
const balance: TokenBalance = {
  owner: 'eth|0x123...',
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none',
  // ... other fields
} as TokenBalance;

// Access quantity (for fungible tokens)
const quantity = balance.getQuantityTotal(); // BigNumber - total quantity
const quantityString = quantity.toString(); // "1000.5"

// For NFTs, check if balance has NFT instances
const nftInstanceIds = balance.getNftInstanceIds(); // BigNumber[] - array of instance IDs
const nftCount = balance.getNftInstanceCount(); // number - count of NFTs owned

// Check if this is an NFT balance
const isNft = nftInstanceIds.length > 0;

if (isNft) {
  console.log(`Owns ${nftCount} NFTs of this class`);
  nftInstanceIds.forEach(instanceId => {
    console.log(`  NFT instance #${instanceId.toString()}`);
  });
} else {
  console.log(`Owns ${quantity.toString()} fungible tokens`);
}
```

**Important Notes:**
- `TokenBalance` is a class with methods like `getNftInstanceIds()` and `getQuantityTotal()`
- For NFTs, use `getNftInstanceIds()` to get array of owned instance numbers
- For fungible tokens, `getNftInstanceIds()` returns empty array
- `getQuantityTotal()` returns total quantity (for fungible) or count (for NFTs)

### Working with TokenAllowance

```typescript
import { TokenAllowance } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

// TokenAllowance from API response (needs mapping from flat response)
const allowance: TokenAllowance = {
  grantedTo: 'eth|0x456...',
  grantedBy: 'eth|0x123...',
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none',
  instance: new BigNumber('0'),
  allowanceType: 3,
  created: 1765081029251,
  uses: new BigNumber('9007199254740991'),
  usesSpent: new BigNumber('5'),
  expires: 0, // 0 = no expiry
  quantity: new BigNumber('1000'),
  quantitySpent: new BigNumber('100'),
};

// Calculate remaining amount
const remaining = allowance.quantity.minus(allowance.quantitySpent || new BigNumber(0));

// Check if expired
const isExpired = allowance.expires > 0 && allowance.expires < Date.now();

// Check if has remaining uses
const hasUses = allowance.uses.isZero() || 
  allowance.uses.minus(allowance.usesSpent || new BigNumber(0)).gt(0);

// Compare instances (must use BigNumber.isEqualTo)
const matchesToken = allowance.instance.isEqualTo(tokenInstance.instance);
```

**Mapping API Response to TokenAllowance:**

```typescript
// API returns flat objects, need to map to TokenAllowance
const apiResponse = {
  grantedTo: "eth|0x456...",
  grantedBy: "eth|0x123...",
  quantity: "1000.5", // String from API
  quantitySpent: "100.0",
  uses: "9007199254740991",
  usesSpent: "5",
  instance: "0", // String from API
  // ... other fields
};

const allowance: TokenAllowance = {
  grantedTo: apiResponse.grantedTo,
  grantedBy: apiResponse.grantedBy,
  collection: apiResponse.collection,
  category: apiResponse.category,
  type: apiResponse.type,
  additionalKey: apiResponse.additionalKey,
  instance: new BigNumber(apiResponse.instance), // Convert to BigNumber
  allowanceType: apiResponse.allowanceType,
  created: apiResponse.created,
  uses: new BigNumber(apiResponse.uses === 'Infinity' ? '9007199254740991' : apiResponse.uses),
  usesSpent: apiResponse.usesSpent ? new BigNumber(apiResponse.usesSpent) : undefined,
  expires: apiResponse.expires,
  quantity: new BigNumber(apiResponse.quantity), // Convert to BigNumber
  quantitySpent: apiResponse.quantitySpent ? new BigNumber(apiResponse.quantitySpent) : undefined,
};
```

### Using asValidUserRef()

The `asValidUserRef()` utility converts addresses to GalaChain's `UserRef` format:

```typescript
import { asValidUserRef } from '@gala-chain/api';

// Accepts addresses with or without prefix
const userRef1 = asValidUserRef('eth|0x123...'); // Returns "eth|0x123..."
const userRef2 = asValidUserRef('0x123...'); // Returns "eth|0x123..." (adds prefix)

// Use in DTOs
transferDto.from = asValidUserRef(walletAddress);
transferDto.to = asValidUserRef(recipientAddress);

// Use in allowance queries
const requestDto = {
  grantedTo: asValidUserRef(serviceWalletAddress),
};
```

### Type Safety Best Practices

1. **Always use BigNumber for quantities and instances:**
   ```typescript
   // ❌ Wrong
   transferDto.quantity = 100;
   transferDto.quantity = "100";
   
   // ✅ Correct
   transferDto.quantity = new BigNumber('100');
   ```

2. **Use TokenInstanceQueryKey for GrantAllowanceDto:**
   ```typescript
   // ❌ Wrong
   grantDto.tokenInstance = galaToken; // TokenInstanceKey
   
   // ✅ Correct
   const tokenQueryKey = new TokenInstanceQueryKey();
   Object.assign(tokenQueryKey, galaToken);
   grantDto.tokenInstance = tokenQueryKey;
   ```

3. **Always use asValidUserRef() for addresses:**
   ```typescript
   // ❌ Wrong
   transferDto.from = walletAddress;
   
   // ✅ Correct
   transferDto.from = asValidUserRef(walletAddress);
   ```

4. **Use BigNumber methods for comparisons:**
   ```typescript
   // ❌ Wrong
   if (allowance.instance === tokenInstance.instance) { }
   if (remaining > 0) { }
   
   // ✅ Correct
   if (allowance.instance.isEqualTo(tokenInstance.instance)) { }
   if (remaining.gt(0)) { }
   ```

5. **Map API responses to proper types:**
   ```typescript
   // API returns strings/numbers, convert to BigNumber
   const allowance: TokenAllowance = {
     quantity: new BigNumber(apiResponse.quantity),
     instance: new BigNumber(apiResponse.instance),
     // ...
   };
   ```

### Common Type Patterns

#### Creating DTOs from User Input

```typescript
function createTransferDto(
  from: string,
  to: string,
  amount: string,
  tokenInstance: TokenInstanceKey
): TransferTokenDto {
  const dto = new TransferTokenDto();
  dto.from = asValidUserRef(from);
  dto.to = asValidUserRef(to);
  dto.quantity = new BigNumber(amount);
  dto.tokenInstance = tokenInstance;
  dto.uniqueKey = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  return dto;
}
```

#### Type Guards

```typescript
function isTokenBalance(obj: any): obj is TokenBalance {
  return (
    obj &&
    typeof obj.owner === 'string' &&
    obj.collection &&
    obj.quantity !== undefined
  );
}

function isTokenAllowance(obj: any): obj is TokenAllowance {
  return (
    obj &&
    typeof obj.grantedTo === 'string' &&
    typeof obj.grantedBy === 'string' &&
    obj.allowanceType !== undefined &&
    obj.quantity !== undefined
  );
}
```

---

## Reading Chain Data

### Reading Balances

#### Get All Balances for a Wallet

```typescript
async getAllBalances(walletAddress: string): Promise<TokenBalance[]> {
  const dto = {
    owner: walletAddress, // GalaChain address (eth|... format)
  };

  const response = await fetch(`${this.tokenGatewayApi}/FetchBalances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  const result = await response.json();
  return result.Data || []; // Returns TokenBalance[] array
}
```

#### Get Balance for Specific Token Class

```typescript
import { TokenInstanceKey } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

async getBalance(
  walletAddress: string,
  tokenInstance: TokenInstanceKey
): Promise<TokenBalance | null> {
  // For fungible tokens, specify instance: "0"
  // For NFTs, you can omit instance or use "0" to get the balance for the entire token class
  const dto = {
    owner: walletAddress,
    collection: tokenInstance.collection,
    category: tokenInstance.category,
    type: tokenInstance.type,
    additionalKey: tokenInstance.additionalKey,
    instance: tokenInstance.instance.toString(), // For fungible: "0", for NFT queries: "0" to get all instances
  };

  const response = await fetch(`${this.tokenGatewayApi}/FetchBalances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  const result = await response.json();
  return result.Data?.[0] || null; // Returns single TokenBalance or null
}
```

#### Token Instance Structure

```typescript
// GALA token (fungible)
const galaToken: TokenInstanceKey = {
  collection: 'GALA',
  category: 'Unit',
  type: 'none',
  additionalKey: 'none',
  instance: new BigNumber('0'), // Always '0' for fungible tokens
};

// Other fungible tokens
const customToken: TokenInstanceKey = {
  collection: 'Token',
  category: 'Unit',
  type: 'USDC', // Token ticker
  additionalKey: 'creator-address',
  instance: new BigNumber('0'), // Always '0' for fungible tokens
};

// NFT tokens (non-fungible)
// Each NFT has a unique instance number
const nftToken: TokenInstanceKey = {
  collection: 'MyCollection',
  category: 'Art',
  type: 'Standard',
  additionalKey: 'none',
  instance: new BigNumber('1'), // Unique instance ID for each NFT (1, 2, 3, etc.)
};
```

**Key Difference:**
- **Fungible tokens**: Always use `instance: new BigNumber('0')`
- **NFTs**: Each token has a unique instance number (1, 2, 3, etc.)

#### Reading NFT Balances

When reading balances for NFTs, `FetchBalances` returns **one balance object per token class**. For NFTs, that balance object contains an `instances` array with all the instance numbers the user owns:

```typescript
import { TokenBalance } from '@gala-chain/api';

// Fetch all balances (includes both fungible tokens and NFTs)
const balances = await getAllBalances(walletAddress);

// Filter for NFTs from a specific collection
// TokenBalance has getNftInstanceIds() method that returns array of instance numbers
const nftBalances = balances.filter(b => {
  const balance = b as TokenBalance;
  // Check if this balance has NFT instances
  return balance.getNftInstanceIds && balance.getNftInstanceIds().length > 0;
});

// Each NFT balance object represents one token class
// The instances array contains all NFT instance numbers owned
nftBalances.forEach(balance => {
  const tokenBalance = balance as TokenBalance;
  const instanceIds = tokenBalance.getNftInstanceIds();
  console.log(`Token Class: ${tokenBalance.collection}/${tokenBalance.type}`);
  console.log(`Owned NFTs: ${instanceIds.length} instances`);
  instanceIds.forEach(instanceId => {
    console.log(`  - NFT #${instanceId.toString()}`);
  });
});
```

**Key Points:**
- **One balance object per token class** (not one per NFT instance)
- For NFTs, use `getNftInstanceIds()` method to get array of owned instance numbers
- For fungible tokens, `getNftInstanceIds()` returns empty array (or undefined)
- `quantity` field represents total count for fungible tokens, or count of NFTs owned for NFT token classes

### Reading Allowances

Allowances let one wallet authorize another to spend tokens on their behalf.

```typescript
import { TokenAllowance, asValidUserRef } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

async getAllowances(
  grantedTo: string, // Who the allowance was granted TO (your service wallet)
  grantedBy?: string, // Optional: filter by who granted it
  allowanceType: number = 3 // 3 = transfer allowances, 4 = mint allowances
): Promise<TokenAllowance[]> {
  const dto = {
    grantedTo: asValidUserRef(grantedTo), // Convert to UserRef format
  };

  const response = await fetch(`${this.tokenGatewayApi}/FetchAllowances`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });

  const result = await response.json();
  const allowancesData = result.Data || [];

  // Map flat response to TokenAllowance objects
  const allowances: TokenAllowance[] = allowancesData.map((a: any) => ({
    grantedTo: a.grantedTo,
    grantedBy: a.grantedBy,
    collection: a.collection,
    category: a.category,
    type: a.type,
    additionalKey: a.additionalKey,
    instance: new BigNumber(a.instance),
    allowanceType: a.allowanceType,
    created: a.created,
    uses: new BigNumber(a.uses === 'Infinity' ? '9007199254740991' : a.uses),
    usesSpent: a.usesSpent ? new BigNumber(a.usesSpent) : undefined,
    expires: a.expires, // 0 = no expiry
    quantity: new BigNumber(a.quantity),
    quantitySpent: a.quantitySpent ? new BigNumber(a.quantitySpent) : undefined,
  }));

  // Filter by grantedBy if provided
  if (grantedBy) {
    return allowances.filter(
      (a) => a.grantedBy === asValidUserRef(grantedBy)
    );
  }

  // Filter by allowanceType
  return allowances.filter((a) => a.allowanceType === allowanceType);
}
```

#### Allowance Response Structure

```typescript
// Example allowance response
{
  "allowanceType": 3,
  "grantedBy": "eth|0x123...", // Who granted it
  "grantedTo": "eth|0x456...", // Who can use it (your service)
  "quantity": "1000.5",        // Total amount granted
  "quantitySpent": "100.0",    // Amount already used
  "uses": "9007199254740991",   // Max uses (Infinity = max safe int)
  "usesSpent": "5",             // Times used
  "expires": 0,                 // 0 = no expiry, otherwise timestamp
  "created": 1765081029251,
  "collection": "GALA",
  "category": "Unit",
  "type": "none",
  "additionalKey": "none",
  "instance": "0"
}
```

**Key Points:**
- `quantity` - Total amount granted
- `quantitySpent` - Amount already used
- Remaining = `quantity.minus(quantitySpent)`
- `expires: 0` means no expiry
- Use BigNumber for all quantity/instance comparisons

---

## Executing Transactions

### Transaction Flow Overview

1. **Create DTO** - Build the transaction data structure
2. **Sign DTO** - User signs with their wallet using `client.sign(methodName, dto)`
3. **Submit to API** - POST signed DTO to GalaChain endpoint
4. **Handle Response** - Extract transaction ID and verify success

### Signing Transactions

**Critical:** All write operations require signing using `BrowserConnectClient.sign()`. Read operations do not require signing:

```typescript
// Pattern for signing any transaction
const signedDto = await client.sign("MethodName", dto);

// Method names match the endpoint:
// - "TransferToken" for /TransferToken
// - "GrantAllowance" for /GrantAllowance
// - "BurnTokens" for /BurnTokens
// - "GrantNftCollectionAuthorization" for /GrantNftCollectionAuthorization
// - "CreateNftCollection" for /CreateNftCollection
// - "MintTokenWithAllowance" for /MintTokenWithAllowance
// - etc.
```

**Operations Requiring Signing:**
- All write operations (transfers, grants, burns, mints, etc.)

**Operations NOT Requiring Signing:**
- `FetchBalances` (read-only)
- `FetchAllowances` (read-only)
- `FetchNftCollectionAuthorizationsWithPagination` (read-only)
- `FetchTokenClassesWithSupply` (read-only)
- `DryRun` (read-only, fee estimation)

### DTO Expiration and Unique Keys

DTOs that require signing must include:
- `dtoExpiresAt`: Unix timestamp in **milliseconds** (13 digits). Typically set to current time + 60 seconds buffer to allow time for signing.
- `uniqueKey`: Unique transaction identifier to prevent duplicate transactions. Format: `prefix-${Date.now()}-${randomString}`

```typescript
// Generate expiration (60 seconds from now)
const dtoExpiresAt = Date.now() + 60000;

// Generate unique key
const uniqueKey = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Include in DTO
const dto = {
  // ... other fields
  dtoExpiresAt,
  uniqueKey,
};
```

### Granting Allowances

Allowances must be granted before a service can transfer tokens on behalf of users.

#### Frontend: User Grants Allowance

```typescript
import { GrantAllowanceDto, GrantAllowanceQuantity, TokenInstanceQueryKey, asValidUserRef } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

async function grantAllowance(
  client: BrowserConnectClient,
  tokenInstance: TokenInstanceKey,
  amount: string,
  expiryDays: number,
  serviceWalletAddress: string
): Promise<{ transactionId: string }> {
  // Create token instance query key
  const tokenQueryKey = new TokenInstanceQueryKey();
  tokenQueryKey.collection = tokenInstance.collection;
  tokenQueryKey.category = tokenInstance.category;
  tokenQueryKey.type = tokenInstance.type;
  tokenQueryKey.additionalKey = tokenInstance.additionalKey;
  tokenQueryKey.instance = tokenInstance.instance;

  // Create GrantAllowanceDto
  const grantDto = new GrantAllowanceDto();
  grantDto.tokenInstance = tokenQueryKey;
  grantDto.allowanceType = 3; // Transfer allowance
  grantDto.uses = new BigNumber('9007199254740991'); // Max uses (effectively unlimited)
  grantDto.expires = expiryDays > 0 
    ? Date.now() + (expiryDays * 24 * 60 * 60 * 1000)
    : 0; // 0 = no expiry
  grantDto.quantities = [
    {
      user: asValidUserRef(serviceWalletAddress),
      quantity: new BigNumber(amount),
    } as GrantAllowanceQuantity,
  ];
  grantDto.uniqueKey = `allowance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Sign with wallet
  const signedDto = await client.sign("GrantAllowance", grantDto);

  // Submit to GalaChain
  const response = await fetch(`${TOKEN_GATEWAY_API}/GrantAllowance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedDto),
  });

  const result = await response.json();
  return { transactionId: result.transactionId || result.txId || `grant-${Date.now()}` };
}
```

### Transferring Tokens

#### Frontend: User Transfers Tokens

```typescript
import { TransferTokenDto, asValidUserRef } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

async function transferToken(
  client: BrowserConnectClient,
  from: string,
  to: string,
  amount: string,
  tokenInstance: TokenInstanceKey
): Promise<{ balances: TokenBalance[]; transactionId: string }> {
  // Create TransferTokenDto
  const transferDto = new TransferTokenDto();
  transferDto.from = asValidUserRef(from);
  transferDto.to = asValidUserRef(to);
  transferDto.quantity = new BigNumber(amount);
  transferDto.tokenInstance = tokenInstance;
  transferDto.uniqueKey = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // useAllowances is optional - omit to let chaincode find automatically

  // Sign with wallet
  const signedDto = await client.sign("TransferToken", transferDto);

  // Submit to GalaChain
  const response = await fetch(`${TOKEN_GATEWAY_API}/TransferToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedDto),
  });

  const result = await response.json();
  const balances: TokenBalance[] = result.Data || result || [];
  const transactionId = result.transactionId || result.txId || `tx-${transferDto.uniqueKey}-${Date.now()}`;

  return { balances, transactionId };
}
```

#### Backend: Transfer Using Allowances

When a service transfers on behalf of a user (using their allowance):

```typescript
import { TransferTokenDto, asValidUserRef } from '@gala-chain/api';
import BigNumber from 'bignumber.js';

async function transferWithAllowance(
  from: string, // User's wallet
  to: string,   // Recipient
  amount: string,
  tokenInstance: TokenInstanceKey,
  privateKey: string // Service's private key (signs on behalf using allowance)
): Promise<{ balances: TokenBalance[]; transactionId: string }> {
  // Create TransferTokenDto
  const transferDto = new TransferTokenDto();
  transferDto.from = asValidUserRef(from);
  transferDto.to = asValidUserRef(to);
  transferDto.quantity = new BigNumber(amount);
  transferDto.tokenInstance = tokenInstance;
  transferDto.uniqueKey = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  // Omit useAllowances - chaincode finds allowances automatically

  // Sign with service's private key
  transferDto.sign(privateKey);

  // Submit to GalaChain
  const url = `${this.tokenGatewayApi}/TransferToken`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transferDto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GalaChain transfer failed: ${response.status}\n${errorText}`);
  }

  const result = await response.json();
  const balances: TokenBalance[] = result.Data || result || [];
  const transactionId = result.transactionId || result.txId || result.Data?.transactionId || `tx-${transferDto.uniqueKey}-${Date.now()}`;

  return { balances, transactionId };
}
```

#### Transferring NFTs

NFTs can be transferred using the same `TransferToken` endpoint, but with specific instance numbers:

```typescript
async function transferNft(
  client: BrowserConnectClient,
  from: string,
  to: string,
  nftInstance: TokenInstanceKey // NFT with specific instance number
): Promise<{ balances: TokenBalance[]; transactionId: string }> {
  // Create TransferTokenDto
  const transferDto = new TransferTokenDto();
  transferDto.from = asValidUserRef(from);
  transferDto.to = asValidUserRef(to);
  transferDto.quantity = new BigNumber('1'); // NFTs always transfer quantity of 1
  transferDto.tokenInstance = nftInstance; // Must include the specific instance number
  transferDto.uniqueKey = `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Sign with wallet
  const signedDto = await client.sign("TransferToken", transferDto);

  // Submit to GalaChain
  const response = await fetch(`${TOKEN_GATEWAY_API}/TransferToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedDto),
  });

  const result = await response.json();
  const balances: TokenBalance[] = result.Data || result || [];
  const transactionId = result.transactionId || result.txId || `tx-${transferDto.uniqueKey}-${Date.now()}`;

  return { balances, transactionId };
}

// Example: Transfer NFT #5 from MyCollection
const nftToTransfer: TokenInstanceKey = {
  collection: 'MyCollection',
  category: 'Art',
  type: 'Standard',
  additionalKey: 'none',
  instance: new BigNumber('5'), // Specific NFT instance
};

await transferNft(client, fromAddress, toAddress, nftToTransfer);
```

**Important Notes:**
- NFT transfers always use `quantity: new BigNumber('1')` (one NFT at a time)
- Must specify the exact `instance` number of the NFT to transfer
- Each NFT has a unique instance number assigned during minting

### NFT Operations

GalaChain supports creating and managing NFT collections. The workflow is:
1. **Grant Collection Authorization** - Claim authorization for a collection name
2. **Create NFT Collection** - Create a token class within the collection
3. **Mint NFTs** - Mint individual NFTs from the token class

#### Granting NFT Collection Authorization

This operation claims authorization for a collection name. It must be done before creating token classes.

```typescript
async function grantCollectionAuthorization(
  client: BrowserConnectClient,
  walletAddress: string,
  collectionName: string
): Promise<{ transactionId: string }> {
  // Create DTO with expiration and unique key
  const dtoExpiresAt = Date.now() + 60000; // 60 seconds from now
  const uniqueKey = `auth-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const authDto = {
    authorizedUser: walletAddress, // GalaChain address (eth|... format)
    collection: collectionName,
    dtoExpiresAt,
    uniqueKey,
  };

  // Sign with wallet
  const signedDto = await client.sign("GrantNftCollectionAuthorization", authDto);

  // Submit to GalaChain
  const response = await fetch(`${TOKEN_GATEWAY_API}/GrantNftCollectionAuthorization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(signedDto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Authorization failed: ${errorText}`);
  }

  const result = await response.json();
  return { transactionId: result.transactionId || result.txId || `auth-${Date.now()}` };
}
```

**Important Notes:**
- Collection names must be unique - once authorized, they cannot be claimed by others
- Authorization must be completed before creating token classes
- Requires signing with wallet

#### Creating NFT Collection (Token Class)

After authorization, create a token class within the collection:

```typescript
async function createNftCollection(
  client: BrowserConnectClient,
  walletAddress: string,
  collectionData: {
    collection: string;
    type: string;
    category: string;
    additionalKey?: string;
    name?: string;
    description?: string;
    image?: string;
    symbol?: string;
    rarity?: string;
    maxSupply?: string;
    maxCapacity?: string;
  }
): Promise<{ transactionId: string }> {
  // Format maxSupply and maxCapacity as whole numbers (no decimals)
  const formatBigNumber = (value: string | undefined): string => {
    if (!value) return '';
    const num = Math.floor(parseFloat(value) || 0);
    return num.toString();
  };

  const dtoExpiresAt = Date.now() + 60000;
  const uniqueKey = `create-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const createDto = {
    collection: collectionData.collection,
    authorities: [walletAddress], // Array of authorized addresses
    category: collectionData.category,
    type: collectionData.type,
    additionalKey: collectionData.additionalKey || 'none',
    name: collectionData.name || collectionData.collection,
    description: collectionData.description || '',
    image: collectionData.image || '',
    symbol: collectionData.symbol || '',
    rarity: collectionData.rarity || '',
    maxSupply: formatBigNumber(collectionData.maxSupply), // Must be whole number
    maxCapacity: formatBigNumber(collectionData.maxCapacity), // Must be whole number
    metadataAddress: '',
    contractAddress: 'gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken',
    dtoExpiresAt,
    uniqueKey,
  };

  // Sign with wallet
  const signedDto = await client.sign("CreateNftCollection", createDto);

  // Submit to GalaChain
  const response = await fetch(`${TOKEN_GATEWAY_API}/CreateNftCollection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(signedDto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`CreateNftCollection failed: ${errorText}`);
  }

  const result = await response.json();
  return { transactionId: result.transactionId || result.txId || `create-${Date.now()}` };
}
```

**Important Notes:**
- `maxSupply` and `maxCapacity` must be **whole numbers** (no decimals) as strings
- `symbol` and `rarity` must contain **only letters** (a-z, A-Z)
- Collection must already be authorized via `GrantNftCollectionAuthorization`
- `authorities` array should contain the wallet address that will mint tokens

#### Minting NFTs

Mint NFTs from a token class:

```typescript
async function mintNftTokens(
  client: BrowserConnectClient,
  mintData: {
    owner: string; // GalaChain address to receive NFTs
    quantity: string; // Number of NFTs to mint (as string)
    tokenClass: {
      collection: string;
      type: string;
      category: string;
      additionalKey?: string;
    };
  }
): Promise<{ transactionId: string }> {
  const dtoExpiresAt = Date.now() + 60000;
  const uniqueKey = `mint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const mintDto = {
    owner: mintData.owner,
    quantity: mintData.quantity, // Number of NFTs to mint
    tokenClass: {
      collection: mintData.tokenClass.collection,
      type: mintData.tokenClass.type,
      category: mintData.tokenClass.category,
      additionalKey: mintData.tokenClass.additionalKey || 'none',
      dtoExpiresAt, // Token class also needs expiration
    },
    tokenInstance: '0', // Use '0' for minting (chain assigns instance numbers)
    dtoExpiresAt,
    uniqueKey,
  };

  // Sign with wallet
  const signedDto = await client.sign("MintTokenWithAllowance", mintDto);

  // Submit to GalaChain
  const response = await fetch(`${TOKEN_GATEWAY_API}/MintTokenWithAllowance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(signedDto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Minting failed: ${errorText}`);
  }

  const result = await response.json();
  return { transactionId: result.transactionId || result.txId || `mint-${Date.now()}` };
}
```

**Important Notes:**
- `quantity` is the number of NFTs to mint (as string)
- `tokenInstance` should be `'0'` when minting - GalaChain assigns unique instance numbers automatically
- Each minted NFT will have a unique instance number (1, 2, 3, etc.)

#### Fetching NFT Collection Authorizations

Retrieve all collections a user has authorized:

```typescript
async function fetchCollectionAuthorizations(
  bookmark?: string,
  limit: number = 100
): Promise<Array<{ authorizedUser: string; collection: string }>> {
  const dto = {
    bookmark: bookmark || '', // Empty string for first page
    limit, // Results per page
  };

  // Note: This endpoint does NOT require signing (read-only operation)
  const response = await fetch(`${TOKEN_GATEWAY_API}/FetchNftCollectionAuthorizationsWithPagination`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fetch failed: ${errorText}`);
  }

  const result = await response.json();
  return result.Data || []; // Array of { authorizedUser, collection, ... }
}
```

**Important Notes:**
- This endpoint does **NOT require signing** (read-only operation)
- Use `bookmark` for pagination (empty string for first page, use returned bookmark for next page)
- Response includes `Data` array with collection authorizations
- No `dtoExpiresAt` or `uniqueKey` needed since signing is not required

#### Fetching Token Classes with Supply

Get information about token classes including current supply:

```typescript
async function fetchTokenClassesWithSupply(
  tokenClasses: Array<{
    collection: string;
    type: string;
    category: string;
    additionalKey?: string;
  }>
): Promise<Array<{
  collection: string;
  type: string;
  category: string;
  additionalKey?: string;
  totalSupply: string; // Current total supply
  image?: string;
}>> {
  const dto = {
    tokenClasses: tokenClasses.map(tc => ({
      collection: tc.collection,
      type: tc.type,
      category: tc.category,
      additionalKey: tc.additionalKey || 'none',
    })),
  };

  const response = await fetch(`${TOKEN_GATEWAY_API}/FetchTokenClassesWithSupply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(dto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fetch failed: ${errorText}`);
  }

  const result = await response.json();
  return result.Data || []; // Array of token classes with supply info
}
```

**Important Notes:**
- This endpoint does **NOT require signing** (read-only)
- Returns `totalSupply` showing how many tokens have been minted
- Returns `isNonFungible` boolean flag indicating if the token class is an NFT
- Can query multiple token classes in one request

**Response Structure:**
```typescript
{
  Data: Array<{
    collection: string;
    type: string;
    category: string;
    additionalKey?: string;
    totalSupply: string;      // Current total supply
    isNonFungible: boolean;    // true = NFT, false = fungible token
    image?: string;
    // ... other fields
  }>;
}
```

**Example Usage:**
```typescript
const tokenClasses = await fetchTokenClassesWithSupply([
  { collection: 'MyCollection', type: 'Standard', category: 'Art', additionalKey: 'none' }
]);

tokenClasses.forEach(tokenClass => {
  if (tokenClass.isNonFungible) {
    console.log(`NFT Class: ${tokenClass.collection}/${tokenClass.type}`);
    console.log(`Total minted: ${tokenClass.totalSupply}`);
  } else {
    console.log(`Fungible Token: ${tokenClass.collection}/${tokenClass.type}`);
    console.log(`Total supply: ${tokenClass.totalSupply}`);
  }
});
```

#### Estimating Transaction Fees (DryRun)

Estimate fees before executing transactions:

```typescript
async function estimateFee(
  method: string, // Method name (e.g., 'CreateNftCollection', 'MintTokenWithAllowance')
  dto: any, // The DTO that would be submitted
  signerAddress?: string // Optional: address that will sign
): Promise<string> {
  const dryRunDto: any = {
    method,
    dto: typeof dto === 'string' ? dto : JSON.stringify(dto),
  };
  
  if (signerAddress) {
    dryRunDto.signerAddress = signerAddress;
  }

  const response = await fetch(`${TOKEN_GATEWAY_API}/DryRun`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
    },
    body: JSON.stringify(dryRunDto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DryRun failed: ${errorText}`);
  }

  const result = await response.json();
  
  // Extract fee from response
  // Fee is typically in writes collection with key pattern: \u0000GCFTU\u0000{method}\u0000{signerAddress}\u0000
  if (result.Data?.writes) {
    const writes = result.Data.writes;
    const feeKey = `\u0000GCFTU\u0000${method}\u0000${signerAddress || ''}\u0000`;
    
    if (writes[feeKey]) {
      const feeData = typeof writes[feeKey] === 'string' 
        ? JSON.parse(writes[feeKey]) 
        : writes[feeKey];
      return feeData.cumulativeFeeQuantity || '0';
    }
    
    // Try to find any fee key matching the pattern
    const feeKeyPrefix = `\u0000GCFTU\u0000${method}\u0000`;
    for (const key in writes) {
      if (key.startsWith(feeKeyPrefix)) {
        const feeData = typeof writes[key] === 'string' 
          ? JSON.parse(writes[key]) 
          : writes[key];
        if (feeData.cumulativeFeeQuantity) {
          return feeData.cumulativeFeeQuantity;
        }
      }
    }
  }
  
  return '0';
}
```

**Usage Example:**
```typescript
// Estimate fee for creating a token class
const createDto = { /* ... */ };
const estimatedFee = await estimateFee('CreateNftCollection', createDto, walletAddress);
console.log(`Estimated fee: ${estimatedFee} GALA`);
```

**Important Notes:**
- This endpoint does **NOT require signing** (read-only)
- `dto` should be the unsigned DTO (before signing)
- Fee is returned in GALA tokens
- Use this to show users transaction costs before they sign

### Burning Tokens

#### Frontend: User Burns Tokens

```typescript
async function burnTokens(
  client: BrowserConnectClient,
  walletAddress: string,
  amount: string,
  tokenInstance: TokenInstanceKey
): Promise<{ transactionId: string }> {
  // Create BurnTokens DTO
  const burnDto = {
    owner: walletAddress, // GalaChain address (eth|... format)
    tokenInstances: [{
      quantity: amount, // Amount as string
      tokenInstanceKey: {
        collection: tokenInstance.collection,
        category: tokenInstance.category,
        type: tokenInstance.type,
        additionalKey: tokenInstance.additionalKey,
        instance: tokenInstance.instance.toString(), // BigNumber to string
      }
    }],
    uniqueKey: `burn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };

  // Sign with wallet
  const signedDto = await client.sign("BurnTokens", burnDto);

  // Submit to GalaChain
  const response = await fetch(`${TOKEN_GATEWAY_API}/BurnTokens`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signedDto),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Burn failed: ${errorText}`);
  }

  const result = await response.json();
  return { transactionId: result.transactionId || result.txId || `burn-${Date.now()}` };
}
```

**BurnTokens DTO Structure:**
```typescript
{
  owner: string,              // GalaChain address
  tokenInstances: [{
    quantity: string,         // Amount to burn (as string)
    tokenInstanceKey: {
      collection: string,
      category: string,
      type: string,
      additionalKey: string,
      instance: string        // "0" for fungible tokens
    }
  }],
  uniqueKey: string          // Unique transaction identifier
}
```

---

## Understanding Responses

### TransferToken Response

```typescript
// Response structure
{
  Data: [
    {
      owner: "eth|0x123...", // Sender's address
      collection: "GALA",
      category: "Unit",
      type: "none",
      additionalKey: "none",
      instance: "0",
      quantity: "990.5", // Sender's balance AFTER transfer
      // ... other fields
    },
    {
      owner: "eth|0x456...", // Recipient's address
      collection: "GALA",
      category: "Unit",
      type: "none",
      additionalKey: "none",
      instance: "0",
      quantity: "110.5", // Recipient's balance AFTER transfer
      // ... other fields
    }
  ],
  transactionId: "tx-abc123...", // May be in different fields
  // ... other metadata
}
```

**Key Points:**
- `balances[0]` = sender's updated balance
- `balances[1]` = recipient's updated balance
- Balances reflect state **AFTER** the transfer
- Transaction ID may be in `transactionId`, `txId`, or `Data.transactionId`

### GrantAllowance Response

```typescript
// Response structure
{
  transactionId: "grant-xyz789...",
  // May also be in txId or Data.transactionId
}
```

### BurnTokens Response

```typescript
// Response structure
{
  transactionId: "burn-xyz789...",
  // May also be in txId or Data.transactionId
}
```

### Error Responses

GalaChain returns plain text errors (not JSON):

```typescript
// Error handling pattern
if (!response.ok) {
  const errorText = await response.text();
  // errorText is a plain string, e.g.:
  // "Insufficient balance"
  // "Allowance not found"
  // "Invalid token instance"
  throw new Error(`GalaChain error: ${errorText}`);
}
```

**Common Errors:**
- `Insufficient balance` - Not enough tokens
- `Allowance not found` - No matching allowance
- `Allowance expired` - Allowance has expired
- `Invalid token instance` - Token doesn't exist
- `User not registered` - Wallet not registered on GalaChain

---

## Common Patterns

### Complete Transfer Flow with Allowances

```typescript
// 1. Check user has sufficient allowance
const allowances = await getAllowances(serviceWalletAddress, userWalletAddress, 3);
const matchingAllowance = findMatchingAllowance(allowances, tokenInstance, serviceWalletAddress);

if (!matchingAllowance) {
  throw new Error('No allowance found');
}

const remaining = matchingAllowance.quantity.minus(
  matchingAllowance.quantitySpent || new BigNumber(0)
);

if (remaining.lt(transferAmount)) {
  throw new Error('Insufficient allowance');
}

// 2. Execute transfer (backend signs with private key)
const result = await transferWithAllowance(
  userWalletAddress,
  recipientAddress,
  transferAmount,
  tokenInstance,
  servicePrivateKey
);

// 3. Verify success
if (result.balances.length < 2) {
  throw new Error('Invalid transfer response');
}
```

### Address Format Conversion

GalaChain uses `UserRef` format for addresses. Use `asValidUserRef()`:

```typescript
import { asValidUserRef } from '@gala-chain/api';

// Convert wallet address to UserRef
const userRef = asValidUserRef('eth|0x123...'); // Returns "eth|0x123..."
// or
const userRef = asValidUserRef('0x123...'); // Also works, adds "eth|" prefix
```

### BigNumber Usage

All quantities, instances, and amounts use BigNumber:

```typescript
import BigNumber from 'bignumber.js';

// Create BigNumber
const amount = new BigNumber('1000.5');

// Comparisons
amount.isZero()           // Check if zero
amount.gt(other)          // Greater than
amount.lt(other)          // Less than
amount.gte(other)         // Greater than or equal
amount.lte(other)         // Less than or equal
amount.isEqualTo(other)   // Equality (use this, not ===)

// Operations
amount.plus(other)        // Addition
amount.minus(other)       // Subtraction
amount.times(other)       // Multiplication
amount.dividedBy(other)   // Division

// Convert to string
amount.toString()         // "1000.5"
```

### Finding Matching Allowances

```typescript
function findMatchingAllowance(
  allowances: TokenAllowance[],
  tokenInstance: TokenInstanceKey,
  serviceAddress: string
): TokenAllowance | undefined {
  return allowances.find((a) =>
    a.grantedTo === serviceAddress &&
    a.collection === tokenInstance.collection &&
    a.category === tokenInstance.category &&
    a.type === tokenInstance.type &&
    a.additionalKey === tokenInstance.additionalKey &&
    a.instance.isEqualTo(tokenInstance.instance) && // BigNumber comparison
    (a.expires === 0 || a.expires > Date.now()) && // Not expired
    a.quantity.minus(a.quantitySpent || new BigNumber(0)).gt(0) // Has remaining
  );
}
```

---

## Error Handling

### Network Errors

```typescript
try {
  const result = await galaChainClient.transferToken(signedDto);
} catch (error) {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    // Network error
    console.error('Network error:', error);
    // Retry logic here
  } else {
    // GalaChain API error
    console.error('GalaChain error:', error);
  }
}
```

### Validation Before Submission

```typescript
// Validate allowance before transfer
async function validateTransfer(
  userWallet: string,
  amount: string,
  tokenInstance: TokenInstanceKey
): Promise<void> {
  // Check allowance exists
  const allowances = await getAllowances(serviceWallet, userWallet, 3);
  const allowance = findMatchingAllowance(allowances, tokenInstance, serviceWallet);
  
  if (!allowance) {
    throw new Error('No allowance found for this token');
  }

  // Check not expired
  if (allowance.expires > 0 && allowance.expires < Date.now()) {
    throw new Error('Allowance has expired');
  }

  // Check sufficient quantity
  const remaining = allowance.quantity.minus(allowance.quantitySpent || new BigNumber(0));
  if (remaining.lt(new BigNumber(amount))) {
    throw new Error(`Insufficient allowance. Remaining: ${remaining.toString()}`);
  }
}
```

### Response Validation

```typescript
// Always validate responses
function validateTransferResponse(result: any): void {
  if (!result.balances || !Array.isArray(result.balances)) {
    throw new Error('Invalid response: missing balances array');
  }
  
  if (result.balances.length < 2) {
    throw new Error('Invalid response: expected 2 balances');
  }
  
  // Verify balances are for correct addresses
  if (result.balances[0].owner !== fromAddress) {
    throw new Error('Invalid response: sender balance mismatch');
  }
  
  if (result.balances[1].owner !== toAddress) {
    throw new Error('Invalid response: recipient balance mismatch');
  }
}
```

---

## Summary

### Key Takeaways

1. **API Pattern:** All operations are POST requests to gateway endpoints with JSON DTOs
2. **Signing:** All write operations require signing using `client.sign("MethodName", dto)` before submission. Read operations do not require signing.
3. **DTO Expiration:** DTOs that require signing must include `dtoExpiresAt` (Unix timestamp in milliseconds) and `uniqueKey` fields
4. **Addresses:** Use `asValidUserRef()` to convert addresses to GalaChain format
5. **BigNumber:** All quantities/amounts use BigNumber - use `.isEqualTo()`, `.minus()`, etc.
6. **Allowances:** Services need allowances to transfer on behalf of users
7. **Responses:** TransferToken returns `TokenBalance[]` with updated balances
8. **Errors:** GalaChain returns plain text errors, not JSON
9. **Testnet:** Use testnet URL for development/testing
10. **NFTs vs Fungible:** NFTs have unique instance numbers (> 0), fungible tokens always use instance 0
11. **Fee Estimation:** Use `DryRun` endpoint to estimate transaction fees before execution
12. **NFT Workflow:** Grant authorization → Create collection → Mint NFTs

### Essential Endpoints

**Fungible Token Operations:**
- `/FetchBalances` - Read balances
- `/FetchAllowances` - Read allowances
- `/TransferToken` - Execute transfers
- `/GrantAllowance` - Grant allowances
- `/BurnTokens` - Burn tokens

**NFT Operations:**
- `/GrantNftCollectionAuthorization` - Claim collection authorization (requires signing)
- `/CreateNftCollection` - Create token class (requires signing)
- `/MintTokenWithAllowance` - Mint NFTs (requires signing)
- `/FetchNftCollectionAuthorizationsWithPagination` - Fetch collections (read-only)
- `/FetchTokenClassesWithSupply` - Fetch token classes with supply (read-only)
- `/DryRun` - Estimate transaction fees (read-only)

### Essential Types

- `TokenBalance` - Balance information
- `TokenAllowance` - Allowance information
- `TokenInstanceKey` - Token identifier
- `TransferTokenDto` - Transfer transaction
- `GrantAllowanceDto` - Allowance grant transaction
- `UserRef` - GalaChain address format

### Essential Utilities

- `asValidUserRef()` - Convert address to UserRef
- `BrowserConnectClient` - Wallet connection and signing
- `BigNumber` - All numeric operations

### Signing Method Names

When calling `client.sign()`, use these method names:
- `"TransferToken"` for token transfers
- `"GrantAllowance"` for granting allowances
- `"BurnTokens"` for burning tokens
- `"GrantNftCollectionAuthorization"` for claiming collection authorization
- `"CreateNftCollection"` for creating token classes
- `"MintTokenWithAllowance"` for minting NFTs
- Method name matches the endpoint name (without leading slash)

---

**This guide provides the core information needed to integrate GalaChain. For specific implementation details, refer to the `@gala-chain/api` TypeScript types and the GalaChain SDK documentation.**
