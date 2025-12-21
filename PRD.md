# NFT Collection Manager - GalaChain Integration Example

## Overview
A full-stack NFT collection management application that demonstrates how to connect to GalaChain using MetaMask and manage NFT collections, token classes, and minting operations.

## Core Learning Objectives
- Connect MetaMask wallet to GalaChain
- Claim NFT collection names
- Create NFT token classes
- Mint NFTs from token classes
- Handle transaction states and errors
- Display collections, token classes, and transaction history

## User Stories

### As a Developer Learning GalaChain Integration
- I want to see a complete wallet connection flow so I can understand the registration process
- I want to see transaction signing patterns so I can implement similar functionality
- I want to see error handling examples so I can build robust applications
- I want to see both frontend and backend code so I can understand the full stack

### As a User
- I want to connect my MetaMask wallet with one click
- I want to claim collection names for my NFTs
- I want to create token classes with metadata
- I want to mint NFTs from my token classes
- I want to see my collections, classes, and minting history

## Technical Requirements

### Frontend (Vue.js)
- **Wallet Connection Component**
  - Connect/disconnect MetaMask wallet
  - Display wallet address
  - Handle connection errors gracefully
  - Show loading states during connection

- **Claim Collection Component**
  - Input collection name
  - Grant authorization for collection
  - Display success/error messages

- **My Collections Component**
  - Display all claimed collections
  - Link to create token classes

- **Create Token Class Component**
  - Form for token class metadata
  - Collection, category, type, additional key
  - Name, description, image, symbol, rarity
  - Max supply and capacity
  - Create token class transaction

- **My Token Classes Component**
  - Display all created token classes
  - Show current supply
  - Link to minting

- **Mint Tokens Component**
  - Select token class
  - Enter quantity
  - Mint NFTs
  - Display transaction status

### Backend (NestJS)
- **Collection Service**
  - Handle collection authorization
  - Sync collections from chain
  - Store collection data

- **Token Class Service**
  - Create token classes
  - Sync token classes from chain
  - Store token class data

- **Mint Service**
  - Process mint transactions
  - Store mint transaction history
  - Validate token classes

- **Wallet Service**
  - Validate GalaChain addresses
  - Handle wallet operations

### Data Storage
- **Collection Table**
  - `id`, `collectionName`, `walletAddress`, `createdAt`, `updatedAt`

- **Token Class Table**
  - `id`, `collection`, `category`, `type`, `additionalKey`, `name`, `description`, `image`, `symbol`, `rarity`, `maxSupply`, `maxCapacity`, `currentSupply`, `walletAddress`, `createdAt`, `updatedAt`

- **Mint Transaction Table**
  - `id`, `walletAddress`, `collection`, `category`, `type`, `additionalKey`, `quantity`, `transactionId`, `createdAt`

## API Endpoints

### Collections
- `POST /api/collections/claim` - Claim a collection name
- `GET /api/collections/:address` - Get user's collections
- `GET /api/collections/single/:collectionName` - Get single collection
- `POST /api/collections/estimate-fee` - Estimate claim fee

### Token Classes
- `POST /api/token-classes/create` - Create a token class
- `GET /api/token-classes/user/:address` - Get user's token classes
- `GET /api/token-classes/collection/:collection` - Get collection's token classes
- `POST /api/token-classes/estimate-fee` - Estimate creation fee

### Minting
- `POST /api/mint/tokens` - Mint NFTs
- `GET /api/mint/transactions/:address` - Get mint transactions
- `POST /api/mint/estimate-fee` - Estimate minting fee

## GalaChain Integration Points

### Wallet Connection Flow
1. User clicks "Connect Wallet"
2. MetaMask prompts for connection
3. Get GalaChain address (format: `eth|...`)
4. Display connected state

### Collection Claiming Flow
1. User enters collection name
2. Create authorization DTO
3. Sign transaction with MetaMask
4. Submit signed transaction to GalaChain
5. Store collection record

### Token Class Creation Flow
1. User selects collection
2. Fill in token class metadata
3. Create DTO for CreateNftCollection
4. Sign transaction with MetaMask
5. Submit signed transaction to GalaChain
6. Store token class record

### Minting Flow
1. User selects token class
2. Enter quantity
3. Create mint DTO
4. Sign transaction with MetaMask
5. Submit signed transaction to GalaChain
6. Store mint transaction record

## Environment Configuration

```env
# GalaChain Testnet API
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

# Project Configuration
VITE_PROJECT_API=http://localhost:4000
```

## Success Criteria
- [ ] Users can connect MetaMask wallet successfully
- [ ] Users can claim collection names
- [ ] Users can create token classes with metadata
- [ ] Users can mint NFTs from token classes
- [ ] Transaction history is displayed correctly
- [ ] Error handling works for all failure scenarios
- [ ] Code is well-documented with learning comments
- [ ] Example can be run locally with minimal setup

## Out of Scope (Keep Minimal)
- User authentication beyond wallet connection
- Complex NFT mechanics or game features
- Advanced transaction types beyond basic operations
- Production-grade security features
- Complex UI/UX beyond basic functionality
- Database migrations or complex data relationships

## Technical Stack
- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: NestJS + TypeScript
- **Database**: SQLite (for simplicity)
- **Wallet**: MetaMask + @gala-chain/connect
- **Styling**: Basic CSS (no complex frameworks)

## File Structure
```
basic-nft-launcher/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── WalletConnect.vue
│   │   │   ├── ClaimCollection.vue
│   │   │   ├── MyCollections.vue
│   │   │   ├── CreateTokenClass.vue
│   │   │   ├── MyTokenClasses.vue
│   │   │   └── MintTokens.vue
│   │   ├── services/
│   │   │   ├── walletService.ts
│   │   │   └── galachainService.ts
│   │   └── main.ts
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── collection/
│   │   ├── token-class/
│   │   ├── mint/
│   │   ├── wallet/
│   │   └── main.ts
│   └── package.json
└── README.md
```

This example should serve as a clear, educational reference for anyone wanting to understand GalaChain NFT collection management patterns.
