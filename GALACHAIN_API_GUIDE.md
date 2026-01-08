# GalaChain Gateway API Developer Guide

This guide provides everything you need to properly communicate with the GalaChain Gateway API for this NFT launcher application.

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication & Signing](#authentication--signing)
3. [Critical Endpoints](#critical-endpoints)
4. [DTO Reference](#dto-reference)
5. [Complete Examples](#complete-examples)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Base Configuration

### Gateway Base URL

The GalaChain Gateway API base URL is configured in the `GalaChainService`:

```typescript
// Default (Testnet)
baseUrl = 'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken'

// Can be overridden via environment variable
GALACHAIN_API=https://gateway-mainnet.galachain.com/api/...
```

### Request Headers

All requests to the GalaChain Gateway API require these headers:

```typescript
{
  'Content-Type': 'application/json',
  'accept': 'application/json'
}
```

---

## Authentication & Signing

### When to Sign vs When NOT to Sign

**REQUIRES SIGNING** (Write Operations):
- `GrantNftCollectionAuthorization` - Claiming a collection
- `CreateNftCollection` - Creating a token class
- `MintTokenWithAllowance` - Minting tokens

**NO SIGNING REQUIRED** (Read Operations):
- `FetchNftCollectionAuthorizationsWithPagination` - Fetching collections
- `FetchTokenClassesWithSupply` - Fetching token classes
- `FetchBalances` - Fetching user balances
- `DryRun` - Estimating transaction fees

### Signing Process

1. **Get Unsigned DTO** from your backend
2. **Sign with Wallet** using `BrowserConnectClient.sign(method, dto)`
3. **Submit Signed Transaction** to GalaChain Gateway API

```typescript
// Example signing flow
const unsignedDto = await fetch('/api/collections/claim', {
  method: 'POST',
  body: JSON.stringify({ walletAddress, collection })
}).then(r => r.json())

// Sign with wallet
const signedTransaction = await walletClient.sign(
  'GrantNftCollectionAuthorization',
  unsignedDto.unsignedAuthDto
)

// Submit to GalaChain
const response = await fetch(`${baseUrl}/GrantNftCollectionAuthorization`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'accept': 'application/json' },
  body: JSON.stringify(signedTransaction)
})
```

### DTO Expiration

All DTOs that require signing include a `dtoExpiresAt` field:
- Format: Unix timestamp in **milliseconds** (13 digits)
- Default: Current time + 60 seconds buffer
- Purpose: Prevents replay attacks and ensures freshness

---

## Critical Endpoints

### 1. GrantNftCollectionAuthorization

**Purpose**: Claim authorization for an NFT collection name.

**Method**: `POST`  
**Requires Signing**: ✅ Yes  
**Endpoint**: `${baseUrl}/GrantNftCollectionAuthorization`

**Request DTO**:
```typescript
{
  authorizedUser: string;      // GalaChain address (eth|0x...)
  collection: string;          // Collection name to claim
  dtoExpiresAt: number;       // Unix timestamp in milliseconds
  uniqueKey: string;           // Unique transaction identifier
}
```

**Response**:
```typescript
{
  transactionId: string;       // GalaChain transaction ID
  // ... other response fields
}
```

**Example Flow**:
```typescript
// Step 1: Get unsigned DTO from backend
const response = await fetch('/api/collections/claim', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: 'eth|0x123...',
    collection: 'MyCollection'
  })
})
const { unsignedAuthDto } = await response.json()

// Step 2: Sign with wallet
const signedAuth = await walletClient.sign(
  'GrantNftCollectionAuthorization',
  unsignedAuthDto
)

// Step 3: Submit to GalaChain
const submitResponse = await fetch(`${baseUrl}/GrantNftCollectionAuthorization`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  },
  body: JSON.stringify(signedAuth)
})
const result = await submitResponse.json()
```

---

### 2. CreateNftCollection

**Purpose**: Create a new NFT token class within a collection.

**Method**: `POST`  
**Requires Signing**: ✅ Yes  
**Endpoint**: `${baseUrl}/CreateNftCollection`

**Request DTO**:
```typescript
{
  collection: string;          // Collection name (must be authorized)
  authorities: string[];       // Array of authorized addresses [walletAddress]
  category: string;            // Token category
  type: string;               // Token type
  additionalKey?: string;     // Optional additional key (default: 'none')
  name?: string;              // Display name
  description?: string;       // Token description
  image?: string;             // Image URL
  symbol?: string;            // Token symbol (letters only)
  rarity?: string;            // Rarity level (letters only)
  maxSupply?: string;         // Maximum supply (whole number as string)
  maxCapacity?: string;        // Maximum capacity (whole number as string)
  metadataAddress?: string;    // Metadata contract address
  contractAddress?: string;   // Contract address
  dtoExpiresAt: number;       // Unix timestamp in milliseconds
  uniqueKey: string;          // Unique transaction identifier
}
```

**Important Notes**:
- `maxSupply` and `maxCapacity` must be **whole numbers** (no decimals)
- `symbol` and `rarity` must contain **only letters** (a-z, A-Z)
- Collection must already be authorized via `GrantNftCollectionAuthorization`

**Response**:
```typescript
{
  transactionId: string;
  // ... other response fields
}
```

**Example Flow**:
```typescript
// Step 1: Get unsigned DTO
const response = await fetch('/api/token-classes/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: 'eth|0x123...',
    collection: 'MyCollection',
    type: 'Standard',
    category: 'Art',
    additionalKey: 'none',
    name: 'My Token',
    description: 'A cool token',
    image: 'https://example.com/image.jpg',
    symbol: 'MTK',
    rarity: 'Common',
    maxSupply: '1000',
    maxCapacity: '1000'
  })
})
const { unsignedCreateDto } = await response.json()

// Step 2: Sign
const signedCreate = await walletClient.sign(
  'CreateNftCollection',
  unsignedCreateDto
)

// Step 3: Submit
const submitResponse = await fetch(`${baseUrl}/CreateNftCollection`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  },
  body: JSON.stringify(signedCreate)
})
```

---

### 3. MintTokenWithAllowance

**Purpose**: Mint NFT tokens to a specific owner.

**Method**: `POST`  
**Requires Signing**: ✅ Yes  
**Endpoint**: `${baseUrl}/MintTokenWithAllowance`

**Request DTO**:
```typescript
{
  owner: string;              // GalaChain address to receive tokens
  quantity: string;           // Number of tokens to mint (as string)
  tokenClass: {
    collection: string;
    type: string;
    category: string;
    additionalKey?: string;
    dtoExpiresAt: number;     // Unix timestamp in milliseconds
  };
  tokenInstance?: string;    // Instance ID (default: '0')
  dtoExpiresAt: number;       // Unix timestamp in milliseconds
  uniqueKey: string;          // Unique transaction identifier
}
```

**Response**:
```typescript
{
  transactionId: string;
  // ... other response fields
}
```

**Example Flow**:
```typescript
// Step 1: Get unsigned DTO
const response = await fetch('/api/mint/tokens', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    walletAddress: 'eth|0x123...',
    collection: 'MyCollection',
    type: 'Standard',
    category: 'Art',
    additionalKey: 'none',
    owner: 'eth|0x456...',
    quantity: '5'
  })
})
const { unsignedMintDto } = await response.json()

// Step 2: Sign
const signedMint = await walletClient.sign(
  'MintTokenWithAllowance',
  unsignedMintDto
)

// Step 3: Submit
const submitResponse = await fetch(`${baseUrl}/MintTokenWithAllowance`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  },
  body: JSON.stringify(signedMint)
})
```

---

### 4. FetchNftCollectionAuthorizationsWithPagination

**Purpose**: Fetch NFT collection authorizations (read-only).

**Method**: `POST`  
**Requires Signing**: ❌ No  
**Endpoint**: `${baseUrl}/FetchNftCollectionAuthorizationsWithPagination`

**Request DTO**:
```typescript
{
  bookmark?: string;          // Pagination bookmark (empty string for first page)
  limit?: number;             // Results per page (default: 100)
}
```

**Response**:
```typescript
{
  Data: Array<{
    authorizedUser: string;
    collection: string;
    transactionId?: string;
    // ... other fields
  }>;
  bookmark?: string;          // Next page bookmark
  // ... other response fields
}
```

**Example**:
```typescript
const response = await fetch(
  `${baseUrl}/FetchNftCollectionAuthorizationsWithPagination`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      bookmark: '',
      limit: 100
    })
  }
)
const result = await response.json()
// result.Data contains array of authorizations
```

---

### 5. FetchTokenClassesWithSupply

**Purpose**: Fetch token classes with their current supply information (read-only).

**Method**: `POST`  
**Requires Signing**: ❌ No  
**Endpoint**: `${baseUrl}/FetchTokenClassesWithSupply`

**Request DTO**:
```typescript
{
  tokenClasses: Array<{
    collection: string;
    type: string;
    category: string;
    additionalKey?: string;
  }>;
}
```

**Response**:
```typescript
{
  Data: Array<{
    collection: string;
    type: string;
    category: string;
    additionalKey?: string;
    totalSupply: string;      // Current total supply
    image?: string;
    // ... other fields
  }>;
}
```

**Example**:
```typescript
const response = await fetch(`${baseUrl}/FetchTokenClassesWithSupply`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  },
  body: JSON.stringify({
    tokenClasses: [
      {
        collection: 'MyCollection',
        type: 'Standard',
        category: 'Art',
        additionalKey: 'none'
      }
    ]
  })
})
const result = await response.json()
// result.Data[0].totalSupply contains current supply
```

---

### 6. FetchBalances

**Purpose**: Fetch token balances for a specific owner (read-only).

**Method**: `POST`  
**Requires Signing**: ❌ No  
**Endpoint**: `${baseUrl}/FetchBalances`

**Request DTO**:
```typescript
{
  owner: string;              // GalaChain address (eth|0x...)
}
```

**Response**:
```typescript
{
  Data: {
    // Balance information structure
    // Format may vary - check actual response
  };
}
```

**Example**:
```typescript
const response = await fetch(`${baseUrl}/FetchBalances`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  },
  body: JSON.stringify({
    owner: 'eth|0x123...'
  })
})
const result = await response.json()
```

---

### 7. DryRun

**Purpose**: Estimate transaction fees without executing the transaction (read-only).

**Method**: `POST`  
**Requires Signing**: ❌ No  
**Endpoint**: `${baseUrl}/DryRun`

**Request DTO**:
```typescript
{
  method: string;            // Method name (e.g., 'CreateNftCollection')
  dto: string;              // JSON stringified DTO
  signerAddress?: string;   // Optional: address that will sign
}
```

**Response**:
```typescript
{
  Data: {
    writes: {
      // Fee information stored in writes with special key format:
      // \u0000GCFTU\u0000{method}\u0000{userAddress}\u0000
      // Contains cumulativeFeeQuantity field
    };
  };
}
```

**Fee Extraction**:
The fee is stored in a special key format:
```
\u0000GCFTU\u0000{method}\u0000{userAddress}\u0000
```

Example extraction:
```typescript
function extractFee(dryRunResponse: any, method: string, userAddress: string): string {
  const writes = dryRunResponse?.Data?.writes
  if (!writes) return '0'
  
  const feeKey = `\u0000GCFTU\u0000${method}\u0000${userAddress}\u0000`
  
  if (writes[feeKey]) {
    const feeData = typeof writes[feeKey] === 'string' 
      ? JSON.parse(writes[feeKey]) 
      : writes[feeKey]
    return feeData.cumulativeFeeQuantity || '0'
  }
  
  return '0'
}
```

**Example**:
```typescript
// Create DTO for fee estimation
const dto = {
  authorizedUser: 'eth|0x123...',
  collection: 'MyCollection',
  dtoExpiresAt: Date.now() + 60000,
  uniqueKey: 'tx-123'
}

const response = await fetch(`${baseUrl}/DryRun`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'accept': 'application/json'
  },
  body: JSON.stringify({
    method: 'GrantNftCollectionAuthorization',
    dto: JSON.stringify(dto),
    signerAddress: 'eth|0x123...'
  })
})
const result = await response.json()
const fee = extractFee(result, 'GrantNftCollectionAuthorization', 'eth|0x123...')
```

---

## DTO Reference

### Common Fields

#### `dtoExpiresAt`
- **Type**: `number`
- **Format**: Unix timestamp in **milliseconds** (13 digits)
- **Purpose**: Prevents replay attacks
- **Calculation**: `Date.now() + 60000` (current time + 60 seconds buffer)

#### `uniqueKey`
- **Type**: `string`
- **Purpose**: Prevents duplicate transactions
- **Format**: `{prefix}-{timestamp}-{random}`
- **Example**: `'tx-1234567890-abc123xyz'`

#### GalaChain Address Format
- **Format**: `eth|0x{40-character hex address}`
- **Example**: `'eth|0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'`

### Token Class Identifiers

All token classes are identified by a combination of:
- `collection`: Collection name
- `type`: Token type
- `category`: Token category
- `additionalKey`: Optional additional identifier (default: `'none'`)

These four fields together uniquely identify a token class.

---

## Complete Examples

### Example 1: Complete Collection Claim Flow

```typescript
async function claimCollection(walletAddress: string, collectionName: string) {
  const baseUrl = 'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken'
  
  // Step 1: Get unsigned DTO from backend
  const prepResponse = await fetch('/api/collections/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      collection: collectionName
    })
  })
  
  if (!prepResponse.ok) {
    throw new Error('Failed to prepare collection claim')
  }
  
  const { unsignedAuthDto } = await prepResponse.json()
  
  // Step 2: Sign with wallet
  const signedAuth = await walletClient.sign(
    'GrantNftCollectionAuthorization',
    unsignedAuthDto
  )
  
  // Step 3: Submit to GalaChain
  const submitResponse = await fetch(`${baseUrl}/GrantNftCollectionAuthorization`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify(signedAuth)
  })
  
  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    throw new Error(`GalaChain API error: ${submitResponse.status} - ${errorText}`)
  }
  
  const result = await submitResponse.json()
  return result.transactionId
}
```

### Example 2: Complete Token Class Creation Flow

```typescript
async function createTokenClass(
  walletAddress: string,
  collection: string,
  tokenClassData: {
    type: string
    category: string
    additionalKey?: string
    name: string
    description: string
    image: string
    symbol: string
    rarity: string
    maxSupply: string
    maxCapacity: string
  }
) {
  const baseUrl = 'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken'
  
  // Step 1: Get unsigned DTO
  const prepResponse = await fetch('/api/token-classes/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      collection,
      ...tokenClassData
    })
  })
  
  if (!prepResponse.ok) {
    throw new Error('Failed to prepare token class creation')
  }
  
  const { unsignedCreateDto } = await prepResponse.json()
  
  // Step 2: Sign
  const signedCreate = await walletClient.sign(
    'CreateNftCollection',
    unsignedCreateDto
  )
  
  // Step 3: Submit
  const submitResponse = await fetch(`${baseUrl}/CreateNftCollection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify(signedCreate)
  })
  
  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    throw new Error(`GalaChain API error: ${submitResponse.status} - ${errorText}`)
  }
  
  const result = await submitResponse.json()
  return result.transactionId
}
```

### Example 3: Complete Mint Flow

```typescript
async function mintTokens(
  walletAddress: string,
  tokenClass: {
    collection: string
    type: string
    category: string
    additionalKey?: string
  },
  owner: string,
  quantity: string
) {
  const baseUrl = 'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken'
  
  // Step 1: Get unsigned DTO
  const prepResponse = await fetch('/api/mint/tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      ...tokenClass,
      owner,
      quantity
    })
  })
  
  if (!prepResponse.ok) {
    throw new Error('Failed to prepare mint transaction')
  }
  
  const { unsignedMintDto } = await prepResponse.json()
  
  // Step 2: Sign
  const signedMint = await walletClient.sign(
    'MintTokenWithAllowance',
    unsignedMintDto
  )
  
  // Step 3: Submit
  const submitResponse = await fetch(`${baseUrl}/MintTokenWithAllowance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify(signedMint)
  })
  
  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    throw new Error(`GalaChain API error: ${submitResponse.status} - ${errorText}`)
  }
  
  const result = await submitResponse.json()
  return result.transactionId
}
```

### Example 4: Fetch Operations (No Signing)

```typescript
async function fetchUserCollections() {
  const baseUrl = 'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken'
  
  // Fetch collections (no signing required)
  const response = await fetch(
    `${baseUrl}/FetchNftCollectionAuthorizationsWithPagination`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        bookmark: '',
        limit: 100
      })
    }
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch collections')
  }
  
  const result = await response.json()
  return result.Data || []
}

async function fetchTokenClassSupply(
  collection: string,
  type: string,
  category: string,
  additionalKey: string = 'none'
) {
  const baseUrl = 'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken'
  
  const response = await fetch(`${baseUrl}/FetchTokenClassesWithSupply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      tokenClasses: [{
        collection,
        type,
        category,
        additionalKey
      }]
    })
  })
  
  if (!response.ok) {
    throw new Error('Failed to fetch token class supply')
  }
  
  const result = await response.json()
  return result.Data?.[0]?.totalSupply || '0'
}
```

---

## Error Handling

### Common Error Patterns

1. **HTTP Status Codes**
   - `200`: Success
   - `400`: Bad Request (invalid DTO)
   - `401`: Unauthorized (signature invalid)
   - `500`: Server Error

2. **Error Response Format**
   ```typescript
   // GalaChain may return errors in different formats
   // Always check response.ok and handle both JSON and text responses
   
   if (!response.ok) {
     let errorMessage = `API error: ${response.status}`
     try {
       const errorData = await response.json()
       errorMessage = errorData.message || errorData.error || errorMessage
     } catch (e) {
       const text = await response.text().catch(() => '')
       if (text) errorMessage = text
     }
     throw new Error(errorMessage)
   }
   ```

3. **Common Error Scenarios**

   **Expired DTO**:
   - Error: DTO expiration timestamp has passed
   - Solution: Request a new unsigned DTO from backend

   **Invalid Signature**:
   - Error: Signature validation failed
   - Solution: Ensure you're signing with the correct wallet address

   **Duplicate Transaction**:
   - Error: `uniqueKey` already used
   - Solution: Generate a new unique key

   **Insufficient Authorization**:
   - Error: User not authorized for collection
   - Solution: Claim collection authorization first

   **Invalid Token Class**:
   - Error: Token class doesn't exist
   - Solution: Create token class before minting

### Error Handling Best Practices

```typescript
async function safeGalaChainRequest(
  endpoint: string,
  dto: any,
  requiresSigning: boolean = false
) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify(dto)
    })
    
    if (!response.ok) {
      let errorMessage = `GalaChain API error: ${response.status}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        const text = await response.text().catch(() => '')
        if (text) errorMessage = text
      }
      throw new Error(errorMessage)
    }
    
    return await response.json()
  } catch (error) {
    console.error('GalaChain request failed:', error)
    throw error
  }
}
```

---

## Best Practices

### 1. Always Use Backend for Unsigned DTOs

**Why**: The backend handles:
- Unique key generation
- Expiration timestamp calculation
- DTO structure validation
- Business logic validation

**Don't**: Create DTOs directly in frontend  
**Do**: Request unsigned DTOs from backend, sign, then submit

### 2. Handle Expiration Gracefully

```typescript
// Check expiration before signing
if (dto.dtoExpiresAt < Date.now()) {
  // Request new DTO
  throw new Error('DTO expired, please try again')
}
```

### 3. Validate Before Signing

```typescript
// Validate required fields
if (!dto.collection || !dto.authorizedUser) {
  throw new Error('Invalid DTO: missing required fields')
}

// Validate address format
if (!dto.authorizedUser.startsWith('eth|0x')) {
  throw new Error('Invalid GalaChain address format')
}
```

### 4. Use Proper Number Formatting

```typescript
// For maxSupply and maxCapacity: whole numbers only
const formatBigNumber = (value: string | number): string => {
  const num = Math.floor(parseFloat(String(value)) || 0)
  return num.toString() // No decimals, no trailing zeros
}

// For quantity: string format
const quantity = '5' // Not 5 or 5.0
```

### 5. Validate Symbol and Rarity

```typescript
// Symbol and rarity must be letters only
const isValidAlpha = (str: string): boolean => {
  return /^[A-Za-z]+$/.test(str)
}

if (!isValidAlpha(symbol)) {
  throw new Error('Symbol must contain only letters')
}
```

### 6. Implement Retry Logic for Network Errors

```typescript
async function retryRequest(fn: () => Promise<any>, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
    }
  }
}
```

### 7. Cache Read-Only Data

```typescript
// Cache fetch results to reduce API calls
const collectionCache = new Map()

async function getCachedCollections() {
  const cacheKey = 'collections'
  if (collectionCache.has(cacheKey)) {
    const cached = collectionCache.get(cacheKey)
    if (Date.now() - cached.timestamp < 60000) { // 1 minute cache
      return cached.data
    }
  }
  
  const data = await fetchUserCollections()
  collectionCache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}
```

### 8. Log Transactions for Debugging

```typescript
async function submitTransaction(method: string, signedDto: any) {
  console.log('Submitting transaction:', {
    method,
    timestamp: new Date().toISOString(),
    // Don't log full DTO (may contain sensitive data)
    collection: signedDto.collection || signedDto.tokenClass?.collection
  })
  
  const response = await fetch(`${baseUrl}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify(signedDto)
  })
  
  const result = await response.json()
  console.log('Transaction result:', {
    method,
    transactionId: result.transactionId,
    success: response.ok
  })
  
  return result
}
```

### 9. Validate Token Class Before Minting

```typescript
async function validateTokenClass(
  collection: string,
  type: string,
  category: string,
  additionalKey: string = 'none'
) {
  const response = await fetch(`${baseUrl}/FetchTokenClassesWithSupply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      tokenClasses: [{ collection, type, category, additionalKey }]
    })
  })
  
  if (!response.ok) {
    throw new Error('Token class validation failed')
  }
  
  const result = await response.json()
  if (!result.Data || result.Data.length === 0) {
    throw new Error('Token class not found')
  }
  
  return result.Data[0]
}
```

### 10. Estimate Fees Before Transactions

```typescript
async function estimateAndConfirmFee(
  method: string,
  dto: any,
  userAddress: string
) {
  const feeResponse = await fetch(`${baseUrl}/DryRun`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      method,
      dto: JSON.stringify(dto),
      signerAddress: userAddress
    })
  })
  
  const result = await feeResponse.json()
  const fee = extractFee(result, method, userAddress)
  
  // Show fee to user and get confirmation
  const confirmed = await confirmWithUser(
    `This transaction will cost approximately ${fee} GALA. Continue?`
  )
  
  if (!confirmed) {
    throw new Error('Transaction cancelled by user')
  }
  
  return fee
}
```

---

## Summary

### Quick Reference

| Endpoint | Method | Signing | Purpose |
|----------|--------|---------|---------|
| `GrantNftCollectionAuthorization` | POST | ✅ | Claim collection |
| `CreateNftCollection` | POST | ✅ | Create token class |
| `MintTokenWithAllowance` | POST | ✅ | Mint tokens |
| `FetchNftCollectionAuthorizationsWithPagination` | POST | ❌ | Fetch collections |
| `FetchTokenClassesWithSupply` | POST | ❌ | Fetch token classes |
| `FetchBalances` | POST | ❌ | Fetch balances |
| `DryRun` | POST | ❌ | Estimate fees |

### Key Takeaways

1. **Write operations require signing** - Always sign DTOs for write operations
2. **Read operations don't require signing** - Fetch operations are read-only
3. **Use backend for DTOs** - Let backend generate unsigned DTOs with proper expiration
4. **Validate before signing** - Check DTO structure and expiration
5. **Handle errors gracefully** - GalaChain may return errors in different formats
6. **Format numbers correctly** - Whole numbers for supply/capacity, strings for quantities
7. **Validate inputs** - Symbol/rarity must be letters only
8. **Estimate fees** - Use DryRun to show users transaction costs

---

## Additional Resources

- GalaChain Documentation: [Official GalaChain Docs]
- Wallet Integration: See `WALLET_CONNECT_GUIDE.md` for wallet connection details
- Backend Service: See `backend/src/services/galachain.service.ts` for implementation

---

**Last Updated**: Based on current codebase implementation  
**Base URL**: `https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken`

