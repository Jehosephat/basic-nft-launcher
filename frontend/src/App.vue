<template>
  <div id="app">
    <header class="header">
      <h1>🎨 NFT Collection Manager</h1>
      <p>GalaChain Testnet NFT Collection Management</p>
    </header>

    <div class="container">
      <nav class="nav">
        <router-link to="/" :class="{ active: $route.path === '/' }">
          Connect Wallet
        </router-link>
        <router-link 
          to="/claim-collection" 
          :class="{ active: $route.path === '/claim-collection' }"
          v-if="isWalletConnected"
        >
          Claim Collection
        </router-link>
        <router-link 
          to="/my-collections" 
          :class="{ active: $route.path === '/my-collections' }"
          v-if="isWalletConnected"
        >
          My Collections
        </router-link>
        <router-link 
          to="/create-token-class" 
          :class="{ active: $route.path === '/create-token-class' }"
          v-if="isWalletConnected"
        >
          Create Token Class
        </router-link>
        <router-link 
          to="/my-token-classes" 
          :class="{ active: $route.path === '/my-token-classes' }"
          v-if="isWalletConnected"
        >
          My Token Classes
        </router-link>
        <router-link 
          to="/mint" 
          :class="{ active: $route.path === '/mint' }"
          v-if="isWalletConnected"
        >
          Mint NFTs
        </router-link>
      </nav>

      <router-view 
        :wallet-address="walletAddress"
        :is-connected="isWalletConnected"
        @wallet-connected="handleWalletConnected"
        @wallet-disconnected="handleWalletDisconnected"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, provide } from 'vue'
import { walletService } from './services/walletService'

// Wallet state
const isWalletConnected = ref(false)
const walletAddress = ref('')

// Provide wallet state to child components
provide('walletAddress', walletAddress)
provide('isWalletConnected', isWalletConnected)
provide('walletService', walletService)

// Event handlers
const handleWalletConnected = (address: string) => {
  walletAddress.value = address
  isWalletConnected.value = true
}

const handleWalletDisconnected = () => {
  walletAddress.value = ''
  isWalletConnected.value = false
}
</script>
