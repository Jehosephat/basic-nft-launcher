<template>
  <div class="card">
    <h2>📚 My Collections</h2>
    
    <div v-if="!walletAddress" class="status error">
      Please connect your wallet first.
    </div>
    
    <div v-else>
      <div class="wallet-info">
        <p><strong>Wallet:</strong> {{ walletAddress }}</p>
      </div>
      
      <div v-if="isLoading && collections.length === 0" class="text-center">
        <div class="loading"></div>
        <p>Loading collections...</p>
      </div>
      
      <div v-else-if="collections.length === 0" class="status info">
        No collections found. Claim your first collection to get started!
      </div>
      
      <div v-else class="collections-list">
        <div
          v-for="collection in collections"
          :key="collection.id"
          class="collection-item"
        >
          <div class="collection-header">
            <h3>{{ collection.name || collection.collectionName }}</h3>
          </div>
          <div class="collection-details">
            <p v-if="collection.description">
              <strong>Description:</strong> {{ collection.description }}
            </p>
            <p v-if="collection.category">
              <strong>Category:</strong> {{ collection.category }}
            </p>
            <p v-if="collection.symbol">
              <strong>Symbol:</strong> {{ collection.symbol }}
            </p>
            <p v-if="collection.maxSupply">
              <strong>Max Supply:</strong> {{ collection.maxSupply }}
            </p>
          </div>
          <div class="collection-actions">
            <router-link
              :to="`/create-token-class?collection=${collection.collectionName}`"
              class="btn"
            >
              Create Token Class
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

const collections = ref([])
const isLoading = ref(false)
const error = ref('')

const fetchCollections = async () => {
  if (!props.walletAddress) return

  try {
    isLoading.value = true
    error.value = ''

    const response = await fetch(`/api/collections/${props.walletAddress}`)

    if (!response.ok) {
      let errorMessage = `Failed to fetch collections (${response.status})`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        const text = await response.text().catch(() => '')
        if (text) errorMessage = text
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()
    collections.value = result.collections || []
  } catch (err) {
    console.error('Error fetching collections:', err)
    error.value = err instanceof Error ? err.message : 'Failed to load collections'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  if (props.walletAddress) {
    fetchCollections()
  }
})
</script>

<style scoped>
.collections-list {
  margin-top: 1rem;
}

.collection-item {
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  padding: 0.75rem 1rem;
  margin-bottom: 0.75rem;
  background: #f8f9fa;
}

.collection-header {
  margin-bottom: 0.5rem;
}

.collection-header h3 {
  color: #667eea;
  margin: 0;
  font-size: 1.1rem;
}

.collection-details {
  margin-bottom: 0.5rem;
}

.collection-details p {
  margin: 0.2rem 0;
  font-size: 0.9rem;
}

.collection-actions {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
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

