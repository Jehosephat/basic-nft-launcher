<template>
  <div class="card">
    <h2>🎴 My Token Classes</h2>
    
    <div v-if="!walletAddress" class="status error">
      Please connect your wallet first.
    </div>
    
    <div v-else>
      <div class="wallet-info">
        <p><strong>Wallet:</strong> {{ walletAddress }}</p>
        <button @click="refreshTokenClasses" :disabled="isLoading" class="btn">
          <span v-if="isLoading" class="loading"></span>
          {{ isLoading ? 'Loading...' : 'Refresh' }}
        </button>
      </div>
      
      <div v-if="isLoading && tokenClasses.length === 0" class="text-center">
        <div class="loading"></div>
        <p>Loading token classes...</p>
      </div>
      
      <div v-else-if="tokenClasses.length === 0" class="status info">
        No token classes found. Create your first token class to get started!
      </div>
      
      <div v-else class="token-classes-list">
        <div
          v-for="tokenClass in tokenClasses"
          :key="tokenClass.id"
          class="token-class-item"
        >
          <div class="token-class-header">
            <h3>{{ tokenClass.collection }} - {{ tokenClass.type }}</h3>
          </div>
          
          <div class="token-class-content">
            <div class="token-class-details">
              <p><strong>Collection:</strong> {{ tokenClass.collection }}</p>
              <p><strong>Type:</strong> {{ tokenClass.type }}</p>
              <p><strong>Category:</strong> {{ tokenClass.category }}</p>
              <p v-if="tokenClass.additionalKey">
                <strong>Additional Key:</strong> {{ tokenClass.additionalKey }}
              </p>
              <p v-if="tokenClass.currentSupply">
                <strong>Current Supply:</strong> {{ tokenClass.currentSupply }}
              </p>
              <p class="token-class-date">
                <strong>Created:</strong> {{ formatDate(tokenClass.createdAt) }}
              </p>
              <p class="transaction-id">
                <strong>Transaction ID:</strong> {{ tokenClass.transactionId }}
              </p>
            </div>
            
            <div class="token-class-image" v-if="tokenClass.image">
              <img :src="tokenClass.image" :alt="`${tokenClass.collection} - ${tokenClass.type}`" />
            </div>
          </div>
          
          <div class="token-class-actions">
            <router-link
              :to="`/mint?collection=${tokenClass.collection}&type=${tokenClass.type}&category=${tokenClass.category}&additionalKey=${tokenClass.additionalKey || ''}`"
              class="btn"
            >
              Mint NFTs
            </router-link>
          </div>
        </div>
      </div>
      
      <div v-if="error" class="status error mt-3">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'

const props = defineProps<{
  walletAddress: string
}>()

const tokenClasses = ref([])
const isLoading = ref(false)
const error = ref('')

const fetchTokenClasses = async () => {
  if (!props.walletAddress) return

  try {
    isLoading.value = true
    error.value = ''

    const response = await fetch(`/api/token-classes/user/${props.walletAddress}`)

    if (!response.ok) {
      throw new Error('Failed to fetch token classes')
    }

    const result = await response.json()
    tokenClasses.value = result.tokenClasses || []
  } catch (err) {
    console.error('Error fetching token classes:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load token classes'
  } finally {
    isLoading.value = false
  }
}

const refreshTokenClasses = () => {
  fetchTokenClasses()
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString()
}


onMounted(() => {
  if (props.walletAddress) {
    fetchTokenClasses()
  }
})
</script>

<style scoped>
.token-classes-list {
  margin-top: 1.5rem;
}

.token-class-item {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  background: #f8f9fa;
}

.token-class-header {
  margin-bottom: 1rem;
}

.token-class-header h3 {
  color: #667eea;
  margin: 0;
}

.token-class-content {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.token-class-details {
  flex: 1;
}

.token-class-details p {
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

.token-class-date {
  color: #666;
}

.transaction-id {
  font-family: 'Courier New', monospace;
  font-size: 0.8rem;
  color: #666;
  word-break: break-all;
}

.token-class-image {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.token-class-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-class-actions {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e1e5e9;
}

.text-center {
  text-align: center;
  padding: 2rem;
}

.mt-3 {
  margin-top: 1rem;
}
</style>

