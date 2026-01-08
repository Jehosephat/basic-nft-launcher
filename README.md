# 🎨 NFT Collection Manager - GalaChain Integration

A complete NFT collection management application for GalaChain that demonstrates how to create, manage, and mint NFTs on the GalaChain network. This application provides a full-stack example for developers learning GalaChain NFT integration patterns.

## 🎯 Features

- **Wallet Connection**: Connect MetaMask wallet to GalaChain
- **Collection Management**: Claim and manage NFT collection names
- **Token Class Creation**: Create token classes within collections
- **NFT Minting**: Mint NFTs from your token classes
- **Transaction History**: View all your NFT-related transactions
- **Balance Tracking**: Monitor your NFT balances and collections

## 🏗️ Architecture

- **Frontend**: Vue 3 + TypeScript + Vite
- **Backend**: NestJS + TypeScript
- **Database**: SQLite (for local development)
- **Wallet**: MetaMask + @gala-chain/connect
- **Blockchain**: GalaChain Testnet/Mainnet

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
   
   # Edit frontend/.env if needed (defaults work for testnet)
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:4000

### Usage

1. **Connect Wallet**: Click "Connect MetaMask" and approve the connection
2. **Claim Collection**: Claim a unique collection name for your NFTs
3. **Create Token Class**: Create a token class within your collection
4. **Mint NFTs**: Mint NFTs from your token classes
5. **View Collections**: Browse your collections and token classes

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
│   │   ├── services/         # Service layer
│   │   │   ├── walletService.ts
│   │   │   └── galachainService.ts
│   │   ├── App.vue          # Main app component
│   │   └── main.ts          # App entry point
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # NestJS backend
│   ├── src/
│   │   ├── entities/         # Database entities
│   │   ├── collection/       # Collection module
│   │   ├── token-class/      # Token class module
│   │   ├── mint/            # Minting module
│   │   ├── wallet/          # Wallet module
│   │   ├── transaction/      # Transaction module
│   │   ├── services/         # Shared services
│   │   │   └── galachain.service.ts
│   │   └── main.ts          # App entry point
│   └── package.json
└── package.json              # Root package.json
```

## 🔧 Configuration

### Environment Variables

Create `frontend/.env` with:

```env
# GalaChain API Endpoints (Testnet)
VITE_TOKEN_GATEWAY_API=https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken
VITE_PUBLIC_KEY_GATEWAY_API=https://gateway-mainnet.galachain.com/api/asset/public-key-contract
VITE_CONNECT_API=https://api-galaswap.gala.com/galachain

# Project Configuration
VITE_PROJECT_ID=basic-nft-launcher
VITE_PROJECT_API=http://localhost:4000
```

For mainnet, update the `VITE_TOKEN_GATEWAY_API` to:
```
VITE_TOKEN_GATEWAY_API=https://gateway-mainnet.galachain.com/api/asset/token-contract
```

## 🔄 GalaChain NFT Workflow

### 1. Claim Collection Authorization
```typescript
// Grant authorization for a collection name
const authDto = {
  authorizedUser: walletAddress,
  collection: 'MyCollection',
  dtoExpiresAt: Date.now() + 60000,
  uniqueKey: `auth-${Date.now()}`
}

const signedDto = await client.sign("GrantNftCollectionAuthorization", authDto)
await fetch(`${GATEWAY_API}/GrantNftCollectionAuthorization`, {
  method: 'POST',
  body: JSON.stringify(signedDto)
})
```

### 2. Create Token Class
```typescript
// Create a token class within the collection
const createDto = {
  collection: 'MyCollection',
  authorities: [walletAddress],
  category: 'Art',
  type: 'Standard',
  maxSupply: '1000',
  // ... other fields
}

const signedDto = await client.sign("CreateNftCollection", createDto)
await fetch(`${GATEWAY_API}/CreateNftCollection`, {
  method: 'POST',
  body: JSON.stringify(signedDto)
})
```

### 3. Mint NFTs
```typescript
// Mint NFTs from the token class
const mintDto = {
  owner: recipientAddress,
  quantity: '5', // Number of NFTs to mint
  tokenClass: {
    collection: 'MyCollection',
    type: 'Standard',
    category: 'Art',
    // ...
  }
}

const signedDto = await client.sign("MintTokenWithAllowance", mintDto)
await fetch(`${GATEWAY_API}/MintTokenWithAllowance`, {
  method: 'POST',
  body: JSON.stringify(signedDto)
})
```

## 🛠️ API Endpoints

### Collections
- `POST /api/collections/claim` - Claim a collection name
- `GET /api/collections/user/:address` - Get user's collections
- `GET /api/collections/sync/:address` - Sync collections from chain

### Token Classes
- `POST /api/token-classes/create` - Create a token class
- `GET /api/token-classes/user/:address` - Get user's token classes
- `GET /api/token-classes/collection/:collection` - Get classes for a collection
- `POST /api/token-classes/estimate-fee` - Estimate creation fee

### Minting
- `POST /api/mint/tokens` - Mint NFTs
- `GET /api/mint/user/:address` - Get user's mint transactions
- `POST /api/mint/estimate-fee` - Estimate minting fee

### Wallet
- `GET /api/wallet/balance/:address` - Get wallet balance
- `POST /api/wallet/connect` - Validate wallet connection

## 🧪 Testing

### Manual Testing

1. **Wallet Connection**: Verify MetaMask connection and auto-registration
2. **Collection Claiming**: Test claiming collection names
3. **Token Class Creation**: Create token classes with various configurations
4. **NFT Minting**: Mint NFTs and verify they appear in balances
5. **Error Handling**: Test with insufficient balance, invalid inputs, etc.

### Test Scenarios

- ✅ Connect wallet successfully
- ✅ Auto-register new users
- ✅ Claim collection names
- ✅ Create token classes
- ✅ Mint NFTs successfully
- ✅ View collections and token classes
- ✅ Handle insufficient balance
- ✅ Display transaction history
- ✅ Handle network errors gracefully

## 🚨 Error Handling

The application handles common error scenarios:

- **MetaMask not installed**: Clear error message with installation link
- **User rejects connection**: Graceful handling with retry option
- **Insufficient balance**: Validation before transaction submission
- **Collection name taken**: Clear error message
- **Invalid token class data**: Validation and error feedback
- **Network errors**: Retry mechanisms and user feedback
- **Transaction failures**: Proper error logging and user notification

## 📚 Key Learning Points

1. **Wallet Integration**: Complete MetaMask connection flow for GalaChain
2. **User Registration**: Automatic GalaChain user registration
3. **NFT Collection Management**: Claim and manage collection names
4. **Token Class Creation**: Create NFT token classes with metadata
5. **NFT Minting**: Mint NFTs with proper transaction signing
6. **Transaction Signing**: MetaMask transaction signing patterns
7. **Error Handling**: Comprehensive error handling strategies
8. **State Management**: Wallet and transaction state management
9. **API Design**: RESTful API design for blockchain integration

## 📖 Documentation

- [GalaChain Integration Guide](./GALACHAIN_INTEGRATION_GUIDE.md) - Complete guide to GalaChain integration
- [GalaChain API Guide](./GALACHAIN_API_GUIDE.md) - Detailed API reference
- [Wallet Connect Guide](./WALLET_CONNECT_GUIDE.md) - Wallet connection patterns
- [Local Setup Guide](./LOCAL_SETUP.md) - Detailed setup instructions

## 🔗 Related Resources

- [GalaChain Connect Library](https://github.com/GalaGames/gala-chain-connect)
- [GalaChain API Documentation](https://docs.gala.com/)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Vue.js Documentation](https://vuejs.org/)
- [NestJS Documentation](https://nestjs.com/)

## 📝 Notes

- This is a **learning example** - not production-ready
- Uses SQLite for simplicity - use PostgreSQL/MySQL for production
- No authentication beyond wallet connection
- Default configuration uses GalaChain Testnet
- Transaction fees are paid in GALA tokens

## 🤝 Contributing

This is an educational example. Feel free to:
- Report issues
- Suggest improvements
- Add more examples
- Improve documentation

## 📄 License

This project is for educational purposes. Please check GalaChain's licensing for production use.
