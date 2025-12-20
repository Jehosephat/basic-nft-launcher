<template>
  <div class="card">
    <h2>✨ Mint NFTs</h2>
    
    <div v-if="!walletAddress" class="status error">
      Please connect your wallet first.
    </div>
    
    <div v-else>
      <div class="wallet-info">
        <p><strong>Wallet:</strong> {{ walletAddress }}</p>
      </div>
      
      <form @submit.prevent="mintTokens" class="mint-form">
        <div class="form-group">
          <label for="tokenClass">Token Class *</label>
          <select
            id="tokenClass"
            v-model="selectedTokenClassId"
            class="form-control"
            required
            @change="onTokenClassChange"
          >
            <option value="">Select a token class...</option>
            <option
              v-for="tokenClass in tokenClasses"
              :key="tokenClass.id"
              :value="tokenClass.id"
            >
              {{ tokenClass.collection }} - {{ tokenClass.category }} - {{ tokenClass.type }}{{ tokenClass.additionalKey && tokenClass.additionalKey !== 'none' ? ' - ' + tokenClass.additionalKey : '' }}
            </option>
          </select>
          <small v-if="!selectedTokenClassId" class="form-hint">
            You need to create a token class first before minting.
          </small>
        </div>
        
        <div v-if="selectedTokenClass" class="token-class-info">
          <div class="token-class-content">
            <div class="token-class-image" v-if="selectedTokenClass.image">
              <img :src="selectedTokenClass.image" :alt="`${selectedTokenClass.collection} - ${selectedTokenClass.type}`" />
            </div>
            <div class="token-class-details">
              <p><strong>Collection:</strong> {{ selectedTokenClass.collection }}</p>
              <p><strong>Type:</strong> {{ selectedTokenClass.type }}</p>
              <p><strong>Category:</strong> {{ selectedTokenClass.category }}</p>
              <p v-if="selectedTokenClass.additionalKey && selectedTokenClass.additionalKey !== 'none'">
                <strong>Additional Key:</strong> {{ selectedTokenClass.additionalKey }}
              </p>
              <p v-if="selectedTokenClass.currentSupply">
                <strong>Current Supply:</strong> {{ selectedTokenClass.currentSupply }}
              </p>
            </div>
          </div>
        </div>
        
        <div class="form-group">
          <label for="owner">Owner Address *</label>
          <input
            id="owner"
            v-model="formData.owner"
            type="text"
            class="form-control"
            :placeholder="walletAddress"
            required
          />
          <small class="form-hint">
            Address that will own the minted NFTs (defaults to your wallet)
          </small>
        </div>
        
        <div class="form-group">
          <label for="quantity">Quantity *</label>
          <input
            id="quantity"
            v-model="formData.quantity"
            type="text"
            class="form-control"
            placeholder="e.g., 1, 10, 100"
            required
          />
        </div>
        
        <div class="form-actions">
          <button
            type="submit"
            :disabled="isProcessing || !canMint"
            class="btn btn-danger"
          >
            <span v-if="isProcessing" class="loading"></span>
            {{ isProcessing ? 'Processing...' : 'Mint NFTs' }}
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
import { ref, computed, inject, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { walletService } from '../services/walletService'

const props = defineProps<{
  walletAddress: string
}>()

const route = useRoute()

const formData = ref({
  owner: '',
  quantity: '',
})

const tokenClasses = ref([])
const selectedTokenClassId = ref('')
const isProcessing = ref(false)
const status = ref('')
const statusType = ref('')
const estimatedFee = ref('')

const selectedTokenClass = computed(() => {
  if (!selectedTokenClassId.value) return null
  return tokenClasses.value.find(
    (tc: any) => tc.id === parseInt(selectedTokenClassId.value)
  )
})

const canMint = computed(() => {
  return (
    selectedTokenClass.value &&
    formData.value.owner &&
    formData.value.quantity
  )
})

const fetchTokenClasses = async () => {
  if (!props.walletAddress) return

  try {
    const response = await fetch(`/api/token-classes/user/${props.walletAddress}`)

    if (!response.ok) {
      throw new Error('Failed to fetch token classes')
    }

    const result = await response.json()
    tokenClasses.value = result.tokenClasses || []

    // Pre-fill from query parameters
    const collectionParam = route.query.collection as string
    const typeParam = route.query.type as string
    const categoryParam = route.query.category as string
    const additionalKeyParam = route.query.additionalKey as string

    if (collectionParam && typeParam && categoryParam) {
      const found = tokenClasses.value.find(
        (tc: any) =>
          tc.collection === collectionParam &&
          tc.type === typeParam &&
          tc.category === categoryParam &&
          (tc.additionalKey || '') === (additionalKeyParam || '')
      )
      if (found) {
        selectedTokenClassId.value = found.id.toString()
      }
    }

    // Set default owner
    if (!formData.value.owner) {
      formData.value.owner = props.walletAddress
    }
  } catch (err) {
    console.error('Error fetching token classes:', err)
    status.value = 'Failed to load token classes'
    statusType.value = 'error'
  }
}

const onTokenClassChange = () => {
  // Reset quantity when token class changes
  formData.value.quantity = ''
}

const loadFeeEstimate = async () => {
  if (!props.walletAddress) return

  try {
    const response = await fetch(`/api/mint/estimate-fee/${props.walletAddress}`)

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

const mintTokens = async () => {
  if (!canMint.value || !selectedTokenClass.value || !walletService.client) {
    status.value = 'Please fill in all required fields and connect wallet'
    statusType.value = 'error'
    return
  }

  try {
    isProcessing.value = true
    status.value = ''
    statusType.value = ''

    // Get unsigned DTO from backend
    const response = await fetch('/api/mint/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: props.walletAddress,
        collection: selectedTokenClass.value.collection,
        type: selectedTokenClass.value.type,
        category: selectedTokenClass.value.category,
        additionalKey: selectedTokenClass.value.additionalKey,
        owner: formData.value.owner,
        quantity: formData.value.quantity,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to prepare mint transaction')
    }

    const result = await response.json()

    // Sign the mint DTO
    const signedMint = await walletService.client.sign(
      'MintTokenWithAllowance',
      result.unsignedMintDto
    )

    // Submit signed transaction
    const submitResponse = await fetch('/api/mint/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: props.walletAddress,
        collection: selectedTokenClass.value.collection,
        type: selectedTokenClass.value.type,
        category: selectedTokenClass.value.category,
        additionalKey: selectedTokenClass.value.additionalKey,
        owner: formData.value.owner,
        quantity: formData.value.quantity,
        signedTransaction: signedMint,
      }),
    })

    if (!submitResponse.ok) {
      let errorMessage = `Failed to mint tokens (${submitResponse.status})`
      try {
        const errorData = await submitResponse.json()
        errorMessage = errorData.message || errorData.error || errorMessage
        // Log full error for debugging
        console.error('Mint error details:', errorData)
      } catch (e) {
        // If response is not JSON, try to get text
        const text = await submitResponse.text().catch(() => '')
        if (text) {
          errorMessage = text
          console.error('Mint error text:', text)
        }
      }
      throw new Error(errorMessage)
    }

    const submitResult = await submitResponse.json()

    status.value = `Successfully minted ${formData.value.quantity} NFT(s)!`
    statusType.value = 'success'

    // Reset form
    formData.value = {
      owner: props.walletAddress,
      quantity: '',
    }
    estimatedFee.value = ''
  } catch (error) {
    console.error('Error minting tokens:', error)
    status.value = `Error: ${error instanceof Error ? error.message : 'Failed to mint tokens'}`
    statusType.value = 'error'
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => {
  if (props.walletAddress) {
    fetchTokenClasses()
    formData.value.owner = props.walletAddress
  }
})
</script>

<style scoped>
.mint-form {
  margin-top: 1.5rem;
}

.token-class-info {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.token-class-content {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: start;
}

.token-class-image {
  width: 200px;
  aspect-ratio: 1;
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

.token-class-details {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.token-class-details p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  text-align: left;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.85rem;
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

select.form-control {
  cursor: pointer;
}

.fee-text {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #666;
  text-align: center;
}
</style>

