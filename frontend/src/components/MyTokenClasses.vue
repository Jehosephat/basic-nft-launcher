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
            <h3>{{ tokenClass.collection }} - {{ tokenClass.category }} - {{ tokenClass.type }}{{ tokenClass.additionalKey ? ' - ' + tokenClass.additionalKey : '' }}</h3>
          </div>
          <div class="token-class-image" v-if="tokenClass.image">
            <img :src="tokenClass.image" :alt="`${tokenClass.collection} - ${tokenClass.type}`" />
          </div>
          <p v-if="tokenClass.currentSupply" class="token-class-supply">
            <strong>Current Supply:</strong> {{ tokenClass.currentSupply }}
          </p>
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

onMounted(() => {
  if (props.walletAddress) {
    fetchTokenClasses()
  }
})
</script>

<style scoped>
.token-classes-list {
  margin-top: 1.5rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.token-class-item {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 1rem;
  background: #f8f9fa;
  display: flex;
  flex-direction: column;
}

.token-class-header {
  margin-bottom: 0.75rem;
}

.token-class-header h3 {
  color: #667eea;
  margin: 0;
  font-size: 1rem;
  line-height: 1.3;
}

.token-class-image {
  width: 100%;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.token-class-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.token-class-supply {
  margin: 0 0 0.75rem 0;
  font-size: 0.9rem;
}

.token-class-actions {
  margin-top: auto;
}


.text-center {
  text-align: center;
  padding: 2rem;
}

.mt-3 {
  margin-top: 1rem;
}
</style>

