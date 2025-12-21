# 🎨 NFT Collection Manager - GalaChain Integration Example

A full-stack NFT collection management application that demonstrates how to connect to GalaChain using MetaMask and manage NFT collections, token classes, and minting operations.

## 🎯 Features

- **Claim NFT Collections**: Grant authorization for collection names
- **Create Token Classes**: Define NFT token classes with metadata
- **Mint NFTs**: Mint tokens from your created classes
- **View Collections & Classes**: Browse your claimed collections and created token classes
- **Transaction History**: Track all minting operations

## 🏗️ Architecture

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: NestJS + TypeScript
- **Database**: SQLite (for simplicity)
- **Wallet**: MetaMask + @gala-chain/connect
- **Blockchain**: GalaChain Testnet

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MetaMask browser extension
- GALA tokens in your MetaMask wallet (for transaction fees)

### Installation

1. **Install dependencies:**
   
   **Option A: Use the install script (recommended)**
   ```bash
   # On Windows
   install.bat
   
   # On Mac/Linux
   chmod +x install.sh
   ./install.sh
   ```
   
   **Option B: Manual installation**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   cp frontend/env.example frontend/.env
   
   # The default values should work for testnet
   # No editing required unless you want to customize
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:4000

### Usage

1. **Connect Wallet**: Click "Connect MetaMask" and approve the connection
2. **Claim Collection**: Grant authorization for a collection name
3. **Create Token Class**: Define an NFT token class for your collection
4. **Mint NFTs**: Mint tokens from your created classes
5. **View History**: Check your collections, classes, and mint transactions

## 📁 Project Structure

```
basic-nft-launcher/
├── frontend/                 # Vue.js frontend
│   ├── src/
│   │   ├── components/       # Vue components
│   │   │   ├── WalletConnect.vue
│   │   │   ├── ClaimCollection.vue
│   │   │   ├── MyCollections.vue
│   │   │   ├── CreateTokenClass.vue
│   │   │   ├── MyTokenClasses.vue
│   │   │   └── MintTokens.vue
│   │   ├── services/         # Service modules
│   │   │   ├── walletService.ts
│   │   │   └── galachainService.ts
│   │   ├── App.vue          # Main app component
│   │   ├── main.ts          # App entry point
│   │   └── style.css        # Global styles
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── entities/         # Database entities
│   │   ├── collection/      # Collection module
│   │   ├── token-class/     # Token class module
│   │   ├── mint/            # Minting module
│   │   ├── wallet/          # Wallet module
│   │   ├── transaction/     # Transaction module
│   │   └── main.ts          # App entry point
│   └── package.json
└── package.json              # Root package.json
```

## 🔧 Configuration

### Environment Variables

Create `frontend/.env` with:

```env
# GalaChain Testnet API
VITE_GALACHAIN_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken

# Project Configuration
VITE_PROJECT_API=http://localhost:4000
```

## 🔄 GalaChain Integration Flow

### 1. Wallet Connection
```typescript
// Connect to MetaMask
await metamaskClient.connect()
const address = metamaskClient.galaChainAddress
```

### 2. Claim Collection
```typescript
// Grant collection authorization
const authDto = {
  authorizedUser: walletAddress,
  collection: collectionName,
  dtoExpiresAt: Date.now() + 60000,
  uniqueKey: generateUniqueKey()
}

// Sign with MetaMask
const signedAuth = await metamaskClient.sign("GrantNftCollectionAuthorization", authDto)
```

### 3. Create Token Class
```typescript
// Create NFT collection (token class)
const createDto = {
  collection: collectionName,
  category: category,
  type: type,
  name: name,
  description: description,
  image: imageUrl,
  symbol: symbol,
  rarity: rarity,
  maxSupply: maxSupply,
  maxCapacity: maxCapacity,
  // ... other fields
}

// Sign with MetaMask
const signedCreate = await metamaskClient.sign("CreateNftCollection", createDto)
```

### 4. Mint Tokens
```typescript
// Mint NFTs
const mintDto = {
  owner: walletAddress,
  quantity: quantity,
  tokenClass: {
    collection: collection,
    category: category,
    type: type,
    additionalKey: additionalKey || 'none'
  }
}

// Sign with MetaMask
const signedMint = await metamaskClient.sign("MintTokenWithAllowance", mintDto)
```

## 🛠️ API Endpoints

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

## 🧪 Testing

### Manual Testing

1. **Wallet Connection**: Verify MetaMask connection
2. **Collection Claiming**: Test claiming a collection name
3. **Token Class Creation**: Test creating token classes with various metadata
4. **Minting**: Test minting NFTs from created classes
5. **Error Handling**: Test with invalid data, network errors

## 🚨 Error Handling

The application handles common error scenarios:

- **MetaMask not installed**: Clear error message with installation link
- **User rejects connection**: Graceful handling with retry option
- **Transaction failures**: Proper error logging and user notification
- **Network errors**: Retry mechanisms and user feedback
- **Validation errors**: Clear messages for invalid input

## 📚 Key Learning Points

1. **Wallet Integration**: Complete MetaMask connection flow
2. **NFT Collection Management**: Claiming and managing collections
3. **Token Class Creation**: Creating NFT token classes with metadata
4. **Transaction Signing**: MetaMask transaction signing patterns
5. **Error Handling**: Comprehensive error handling strategies
6. **API Design**: RESTful API design for blockchain integration

## 🔗 Related Resources

- [GalaChain Connect Library](https://github.com/GalaGames/gala-chain-connect)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Vue.js Documentation](https://vuejs.org/)
- [NestJS Documentation](https://nestjs.com/)

## 📝 Notes

- This is a **learning example** - not production-ready
- Uses SQLite for simplicity - use PostgreSQL/MySQL for production
- No authentication beyond wallet connection
- Minimal error handling for educational purposes
- Targets GalaChain Testnet

## 🤝 Contributing

This is an educational example. Feel free to:
- Report issues
- Suggest improvements
- Add more examples
- Improve documentation

## 📄 License

This project is for educational purposes. Please check GalaChain's licensing for production use.
