# NFT Collection Management Application - Transformation Plan

## Overview
Transform the gem store application into an NFT collection management application that allows users to:
1. Claim NFT collection names (one-step process)
2. View all their claimed collections
3. Create token classes based on their collections
4. View all their created token classes
5. Mint NFTs from their token classes

## Target Contract
- **Network**: GalaChain Testnet
- **Contract**: `gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken`
- **Base URL**: `https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken`

## Application Flow

### Step 1: Claim Collection Name
- User enters a collection name
- System performs two operations in sequence:
  1. `GrantNftCollectionAuthorization` - Authorize the user for the collection
  2. `CreateNftCollection` - Create the collection with provided details
- Show estimated fee using `DryRun` before execution
- Display success/error status

### Step 2: View Claimed Collections
- Display list of all collections the user has claimed
- Use `FetchNftCollectionAuthorizationsWithPagination` to fetch collections
- Show collection name, creation date, and status
- Allow user to select a collection for token class creation

### Step 3: Create Token Class
- User selects one of their claimed collections
- User provides token class details:
  - Type (required)
  - Category (required)
  - Additional Key (optional)
- Use `FetchTokenClassesWithSupply` to verify/create token class
- Show estimated fee using `DryRun`
- Display success/error status

### Step 4: View Token Classes
- Display list of all token classes the user has created
- Use `FetchTokenClassesWithSupply` to fetch classes
- Show collection, type, category, and supply information
- Allow user to select a class for minting

### Step 5: Mint NFTs
- User selects one of their token classes
- User provides minting details:
  - Owner address (defaults to connected wallet)
  - Quantity
  - Token Instance (optional)
- Use `MintTokenWithAllowance` to mint
- Show estimated fee using `DryRun`
- Display success/error status

## Database Schema Changes

### New Entities

#### Collection Entity
```typescript
@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  collectionName: string;

  @Column()
  walletAddress: string; // User who claimed it

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ nullable: true })
  contractAddress: string;

  @Column()
  transactionId: string; // From CreateNftCollection

  @Column({ default: 'pending' })
  status: string; // pending, completed, failed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### TokenClass Entity
```typescript
@Entity('token_classes')
export class TokenClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  collection: string; // Collection name

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  additionalKey: string;

  @Column()
  walletAddress: string; // User who created it

  @Column()
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  currentSupply: string; // From FetchTokenClassesWithSupply

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### MintTransaction Entity
```typescript
@Entity('mint_transactions')
export class MintTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletAddress: string;

  @Column()
  collection: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  additionalKey: string;

  @Column()
  owner: string; // NFT owner address

  @Column()
  quantity: string;

  @Column({ nullable: true })
  tokenInstance: string;

  @Column()
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

## Backend Changes

### New Modules

#### 1. Collection Module (`backend/src/collection/`)
- **collection.service.ts**: 
  - `claimCollection()` - Handles GrantNftCollectionAuthorization + CreateNftCollection
  - `fetchUserCollections()` - Uses FetchNftCollectionAuthorizationsWithPagination
  - `dryRunClaimCollection()` - Estimate fees
- **collection.controller.ts**: 
  - `POST /api/collections/claim` - Claim a collection
  - `GET /api/collections/:address` - Get user's collections
  - `POST /api/collections/dry-run` - Estimate claim fee

#### 2. TokenClass Module (`backend/src/token-class/`)
- **token-class.service.ts**:
  - `createTokenClass()` - Create token class for a collection
  - `fetchUserTokenClasses()` - Use FetchTokenClassesWithSupply
  - `dryRunCreateTokenClass()` - Estimate fees
- **token-class.controller.ts**:
  - `POST /api/token-classes/create` - Create token class
  - `GET /api/token-classes/:address` - Get user's token classes
  - `POST /api/token-classes/dry-run` - Estimate creation fee

#### 3. Mint Module (`backend/src/mint/`)
- **mint.service.ts**:
  - `mintTokens()` - Use MintTokenWithAllowance
  - `dryRunMint()` - Estimate minting fees
- **mint.controller.ts**:
  - `POST /api/mint/tokens` - Mint NFTs
  - `POST /api/mint/dry-run` - Estimate minting fee

### Updated Modules

#### Wallet Module
- Keep existing wallet connection functionality
- Add helper methods for GalaChain API calls
- Update to use testnet endpoints

#### Transaction Module
- Update to handle NFT-related transactions
- Add transaction types: collection_claim, token_class_create, mint

## Frontend Changes

### New Components

#### 1. ClaimCollection.vue
- Form to enter collection name and details
- Fields:
  - Collection name (required)
  - Description (optional)
  - Image URL (optional)
  - Category (optional)
  - Symbol (optional)
  - Max Supply (optional)
  - Max Capacity (optional)
- Shows estimated fee before submission
- Displays success/error messages

#### 2. MyCollections.vue
- Lists all collections claimed by the user
- Shows collection details
- "Create Token Class" button for each collection
- Refresh functionality

#### 3. CreateTokenClass.vue
- Dropdown to select a collection
- Form fields:
  - Collection (dropdown, pre-filled from selection)
  - Type (required)
  - Category (required)
  - Additional Key (optional)
- Shows estimated fee
- Displays success/error messages

#### 4. MyTokenClasses.vue
- Lists all token classes created by the user
- Shows collection, type, category, supply
- "Mint NFTs" button for each class
- Refresh functionality

#### 5. MintTokens.vue
- Dropdown to select a token class
- Form fields:
  - Token Class (dropdown, pre-filled)
  - Owner address (defaults to connected wallet)
  - Quantity (required)
  - Token Instance (optional)
- Shows estimated fee
- Displays success/error messages

### Updated Components

#### App.vue
- Update navigation:
  - "Claim Collection" (replaces "Gem Store")
  - "My Collections"
  - "Create Token Class"
  - "My Token Classes"
  - "Mint NFTs"
- Update header title to "NFT Collection Manager"

#### WalletConnect.vue
- Keep existing functionality
- Update messaging for NFT context

### New Services

#### galachainService.ts
- Centralized service for GalaChain API calls
- Methods:
  - `grantCollectionAuthorization()`
  - `createNftCollection()`
  - `fetchCollectionAuthorizations()`
  - `fetchTokenClasses()`
  - `mintTokenWithAllowance()`
  - `dryRun()`
  - `fetchBalances()`

## API Integration Details

### GrantNftCollectionAuthorization
```typescript
{
  authorizedUser: string, // Connected wallet address
  collection: string, // Collection name
  dtoExpiresAt: number, // Timestamp + 1 hour
  uniqueKey: string // Unique identifier
}
```

### CreateNftCollection
```typescript
{
  additionalKey: string,
  authorities: [string], // [authorizedUser]
  category: string,
  collection: string, // Same as in GrantNftCollectionAuthorization
  contractAddress: string, // Testnet contract
  description: string,
  dtoExpiresAt: number,
  image: string,
  maxCapacity: string,
  maxSupply: string,
  metadataAddress: string,
  name: string,
  rarity: string,
  symbol: string,
  type: string,
  uniqueKey: string
}
```

### FetchNftCollectionAuthorizationsWithPagination
```typescript
{
  bookmark: string, // For pagination
  dtoExpiresAt: number,
  limit: number // e.g., 100
}
```

### FetchTokenClassesWithSupply
```typescript
{
  dtoExpiresAt: number,
  prefix: string, // Optional filter
  tokenClasses: [
    {
      additionalKey: string,
      category: string,
      collection: string,
      dtoExpiresAt: number,
      type: string
    }
  ]
}
```

### MintTokenWithAllowance
```typescript
{
  dtoExpiresAt: number,
  owner: string, // NFT owner address
  quantity: string,
  tokenClass: {
    additionalKey: string,
    category: string,
    collection: string,
    dtoExpiresAt: number,
    type: string
  },
  tokenInstance: string,
  uniqueKey: string
}
```

### DryRun
```typescript
{
  dto: string, // JSON stringified unsigned DTO
  dtoExpiresAt: number,
  method: string // "GrantNftCollectionAuthorization", "CreateNftCollection", or "MintTokenWithAllowance"
}
```

## Environment Configuration

### Frontend (.env)
```env
# GalaChain Testnet API
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

# Project Configuration
VITE_PROJECT_API=http://localhost:4000
```

### Backend (.env)
```env
# GalaChain Testnet API
GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

# Database
DATABASE_PATH=./nft-collection.db
```

## Implementation Steps

### Phase 1: Database & Entities
1. Create new entities (Collection, TokenClass, MintTransaction)
2. Update database schema
3. Update app.module.ts to include new entities

### Phase 2: Backend Services
1. Create galachainService for API calls
2. Implement Collection module (service + controller)
3. Implement TokenClass module (service + controller)
4. Implement Mint module (service + controller)
5. Update Transaction module for new transaction types

### Phase 3: Frontend Services
1. Create galachainService.ts
2. Update walletService.ts if needed

### Phase 4: Frontend Components
1. Create ClaimCollection.vue
2. Create MyCollections.vue
3. Create CreateTokenClass.vue
4. Create MyTokenClasses.vue
5. Create MintTokens.vue
6. Update App.vue navigation
7. Update WalletConnect.vue messaging

### Phase 5: Integration & Testing
1. Test collection claiming flow
2. Test collection listing
3. Test token class creation
4. Test token class listing
5. Test minting flow
6. Test error handling
7. Test DryRun fee estimation

### Phase 6: Cleanup
1. Remove gem-related code
2. Remove unused entities/services
3. Update README.md
4. Update documentation

## Key Considerations

1. **Transaction Signing**: All transactions must be signed by the user's wallet before submission
2. **DTO Expiration**: Set `dtoExpiresAt` to current timestamp + 1 hour (3600 seconds)
3. **Unique Keys**: Generate unique keys for each transaction using timestamp + random string
4. **Error Handling**: Handle API errors gracefully and show user-friendly messages
5. **Fee Estimation**: Always show estimated fees using DryRun before executing transactions
6. **Pagination**: Implement pagination for collection and token class listings
7. **State Management**: Track transaction status (pending, completed, failed)
8. **Validation**: Validate all user inputs before creating DTOs

## Testing Checklist

- [ ] User can claim a collection name
- [ ] User can view their claimed collections
- [ ] User can create a token class for a collection
- [ ] User can view their token classes
- [ ] User can mint NFTs from a token class
- [ ] Fee estimation works for all operations
- [ ] Error handling works correctly
- [ ] Transaction status updates properly
- [ ] Pagination works for listings
- [ ] Wallet connection persists across pages

## Files to Remove

- `backend/src/gem/` (entire directory)
- `frontend/src/components/GemStore.vue`
- `frontend/src/components/TransactionHistory.vue` (or repurpose for NFT transactions)
- Gem-related database fields from User entity

## Files to Create

### Backend
- `backend/src/collection/collection.module.ts`
- `backend/src/collection/collection.service.ts`
- `backend/src/collection/collection.controller.ts`
- `backend/src/token-class/token-class.module.ts`
- `backend/src/token-class/token-class.service.ts`
- `backend/src/token-class/token-class.controller.ts`
- `backend/src/mint/mint.module.ts`
- `backend/src/mint/mint.service.ts`
- `backend/src/mint/mint.controller.ts`
- `backend/src/entities/collection.entity.ts`
- `backend/src/entities/token-class.entity.ts`
- `backend/src/entities/mint-transaction.entity.ts`

### Frontend
- `frontend/src/components/ClaimCollection.vue`
- `frontend/src/components/MyCollections.vue`
- `frontend/src/components/CreateTokenClass.vue`
- `frontend/src/components/MyTokenClasses.vue`
- `frontend/src/components/MintTokens.vue`
- `frontend/src/services/galachainService.ts`

