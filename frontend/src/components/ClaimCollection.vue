<template>
  <div class="card">
    <h2>🎨 Claim NFT Collection</h2>
    
    <div v-if="!walletAddress" class="status error">
      Please connect your wallet first.
    </div>
    
    <div v-else>
      <div class="wallet-info">
        <p><strong>Wallet:</strong> {{ walletAddress }}</p>
      </div>
      
      <form @submit.prevent="claimCollection" class="claim-form">
        <div class="form-group">
          <label for="collection">Collection Name *</label>
          <input
            id="collection"
            v-model="formData.collection"
            type="text"
            class="form-control"
            placeholder="e.g., MyAwesomeCollection"
            required
          />
          <small class="form-hint">
            This will grant you authorization for this collection name. You can create token classes for it later.
          </small>
        </div>
        
        <div class="form-actions">
          <button
            type="submit"
            :disabled="isProcessing || !formData.collection"
            class="btn btn-danger"
          >
            <span v-if="isProcessing" class="loading"></span>
            {{ isProcessing ? 'Processing...' : 'Claim Collection' }}
          </button>
        </div>
        
        <div v-if="estimatedFee" class="fee-text">
          Estimated Fee: {{ estimatedFee }}
        </div>
        
        <div v-if="status" class="status mt-3" :class="statusType">
          {{ status }}
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted, watch } from 'vue'
import { walletService } from '../services/walletService'
import { galachainService } from '../services/galachainService'

const props = defineProps<{
  walletAddress: string
}>()

const formData = ref({
  collection: '',
})

const isProcessing = ref(false)
const status = ref('')
const statusType = ref('')
const estimatedFee = ref('')

const loadFeeEstimate = async () => {
  if (!props.walletAddress) return

  try {
    const response = await fetch(`/api/collections/estimate-fee/${props.walletAddress}`)

    if (!response.ok) {
      throw new Error('Failed to estimate fees')
    }

    const result = await response.json()
    estimatedFee.value = result.estimatedFee || '0'
  } catch (error) {
    console.error('Error estimating fees:', error)
    // Don't show error to user, just fail silently
  }
}

// Load fee estimate when component mounts or wallet address changes
onMounted(() => {
  loadFeeEstimate()
})

watch(() => props.walletAddress, () => {
  loadFeeEstimate()
})

const claimCollection = async () => {
  if (!formData.value.collection || !walletService.client) {
    status.value = 'Please fill in required fields and connect wallet'
    statusType.value = 'error'
    return
  }

  try {
    isProcessing.value = true
    status.value = 'Preparing collection claim...'
    statusType.value = 'info'

    // Get unsigned DTO from backend
    const response = await fetch('/api/collections/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: props.walletAddress,
        collection: formData.value.collection,
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to prepare collection claim'
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

    // Sign the authorization DTO
    status.value = 'Please sign the authorization transaction in MetaMask...'
    statusType.value = 'info'
    
    const signedAuth = await walletService.client.sign(
      'GrantNftCollectionAuthorization',
      result.unsignedAuthDto
    )

    // Submit signed transaction
    status.value = 'Submitting transaction to GalaChain...'
    statusType.value = 'info'
    
    const submitResponse = await fetch('/api/collections/claim', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: props.walletAddress,
        collection: formData.value.collection,
        signedAuthorization: signedAuth,
      }),
    })

    if (!submitResponse.ok) {
      let errorMessage = `Failed to claim collection (${submitResponse.status})`
      try {
        const errorData = await submitResponse.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        // If response is not JSON, try to get text
        const text = await submitResponse.text().catch(() => '')
        if (text) errorMessage = text
      }
      throw new Error(errorMessage)
    }

    const submitResult = await submitResponse.json()

    status.value = `Successfully claimed collection "${formData.value.collection}"!`
    statusType.value = 'success'

    // Reset form
    formData.value = {
      collection: '',
    }
    estimatedFee.value = ''
  } catch (error) {
    console.error('Error claiming collection:', error)
    status.value = `Error: ${error instanceof Error ? error.message : 'Failed to claim collection'}`
    statusType.value = 'error'
  } finally {
    isProcessing.value = false
  }
}
</script>

<style scoped>
.claim-form {
  margin-top: 1.5rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.form-actions .btn {
  flex: 1;
}

.mt-3 {
  margin-top: 1rem;
}

textarea.form-control {
  resize: vertical;
  min-height: 80px;
}

.fee-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
  text-align: center;
}
</style>

