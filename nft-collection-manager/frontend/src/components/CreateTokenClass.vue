<template>
  <div class="card">
    <h2>🎯 Create Token Class</h2>
    
    <div v-if="!walletAddress" class="status error">
      Please connect your wallet first.
    </div>
    
    <div v-else>
      <div class="wallet-info">
        <p><strong>Wallet:</strong> {{ walletAddress }}</p>
      </div>
      
      <form @submit.prevent="createTokenClass" class="token-class-form">
        <div class="form-group">
          <label for="collection">Collection *</label>
          <select
            id="collection"
            v-model="formData.collection"
            class="form-control"
            required
            @change="onCollectionChange"
          >
            <option value="">Select a collection...</option>
            <option
              v-for="collection in collections"
              :key="collection.id"
              :value="collection.collectionName"
            >
              {{ collection.name || collection.collectionName }}
            </option>
          </select>
          <small v-if="!formData.collection" class="form-hint">
            You need to claim a collection first before creating token classes.
          </small>
        </div>
        
        <div class="form-group">
          <label for="category">Category *</label>
          <input
            id="category"
            v-model="formData.category"
            type="text"
            class="form-control"
            placeholder="e.g., Art, Character, Item"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="type">Type *</label>
          <input
            id="type"
            v-model="formData.type"
            type="text"
            class="form-control"
            placeholder="e.g., Standard, Premium, Rare"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="additionalKey">Additional Key</label>
          <input
            id="additionalKey"
            v-model="formData.additionalKey"
            type="text"
            class="form-control"
            placeholder="Optional (defaults to 'none')"
          />
        </div>
        
        <div class="form-group">
          <label for="name">Name *</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            class="form-control"
            placeholder="e.g., My Token Class"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="description">Description *</label>
          <textarea
            id="description"
            v-model="formData.description"
            class="form-control"
            rows="3"
            placeholder="Token class description"
            required
          ></textarea>
        </div>
        
        <div class="form-group">
          <label for="image">Image URL *</label>
          <input
            id="image"
            v-model="formData.image"
            type="url"
            class="form-control"
            placeholder="https://example.com/image.png"
            required
          />
        </div>
        
        <div class="form-group">
          <label for="symbol">Symbol *</label>
          <input
            id="symbol"
            v-model="formData.symbol"
            type="text"
            class="form-control"
            placeholder="e.g., MTC"
            maxlength="10"
            pattern="[A-Za-z]+"
            required
            @input="validateSymbol"
          />
          <small class="form-hint">
            Required. Must contain only letters (a-z, A-Z), no numbers or special characters.
          </small>
          <div v-if="symbolError" class="status error" style="margin-top: 0.5rem; padding: 0.5rem;">
            {{ symbolError }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="rarity">Rarity *</label>
          <input
            id="rarity"
            v-model="formData.rarity"
            type="text"
            class="form-control"
            placeholder="e.g., Common, Rare, Epic"
            pattern="[A-Za-z]+"
            required
            @input="validateRarity"
          />
          <small class="form-hint">
            Required. Must contain only letters (a-z, A-Z), no numbers or special characters.
          </small>
          <div v-if="rarityError" class="status error" style="margin-top: 0.5rem; padding: 0.5rem;">
            {{ rarityError }}
          </div>
        </div>
        
        <div class="form-group">
          <label for="maxSupply">Max Supply *</label>
          <input
            id="maxSupply"
            v-model="formData.maxSupply"
            type="text"
            class="form-control"
            placeholder="e.g., 10000 (must be a whole number)"
            required
          />
          <small class="form-hint">
            Must be a whole number (no decimals, no scientific notation)
          </small>
        </div>
        
        <div class="form-group">
          <label for="maxCapacity">Max Capacity *</label>
          <input
            id="maxCapacity"
            v-model="formData.maxCapacity"
            type="text"
            class="form-control"
            placeholder="e.g., 10000 (must be a whole number)"
            required
          />
          <small class="form-hint">
            Must be a whole number (no decimals, no scientific notation)
          </small>
        </div>
        
        <div class="form-group">
          <label for="metadataAddress">Metadata Address</label>
          <input
            id="metadataAddress"
            v-model="formData.metadataAddress"
            type="text"
            class="form-control"
            placeholder="Optional metadata address"
          />
        </div>
        
        <div class="form-actions">
          <button
            type="submit"
            :disabled="isProcessing || !canCreate"
            class="btn btn-danger"
          >
            <span v-if="isProcessing" class="loading"></span>
            {{ isProcessing ? 'Processing...' : 'Create Token Class' }}
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
  collection: '',
  type: '',
  category: '',
  additionalKey: '',
  name: '',
  description: '',
  image: '',
  symbol: '',
  rarity: '',
  maxSupply: '',
  maxCapacity: '',
  metadataAddress: '',
})

const collections = ref([])
const isProcessing = ref(false)
const status = ref('')
const statusType = ref('')
const estimatedFee = ref('')
const symbolError = ref('')
const rarityError = ref('')

const validateSymbol = () => {
  symbolError.value = ''
  if (!formData.value.symbol) {
    symbolError.value = 'Symbol is required'
    return false
  }
  if (!/^[A-Za-z]+$/.test(formData.value.symbol)) {
    symbolError.value = 'Symbol must contain only letters (a-z, A-Z)'
    return false
  }
  return true
}

const validateRarity = () => {
  rarityError.value = ''
  if (!formData.value.rarity) {
    rarityError.value = 'Rarity is required'
    return false
  }
  if (!/^[A-Za-z]+$/.test(formData.value.rarity)) {
    rarityError.value = 'Rarity must contain only letters (a-z, A-Z)'
    return false
  }
  return true
}

const canCreate = computed(() => {
  return (
    formData.value.collection &&
    formData.value.type &&
    formData.value.category &&
    formData.value.name &&
    formData.value.description &&
    formData.value.image &&
    formData.value.symbol &&
    formData.value.rarity &&
    formData.value.maxSupply &&
    formData.value.maxCapacity &&
    /^[A-Za-z]+$/.test(formData.value.symbol) &&
    /^[A-Za-z]+$/.test(formData.value.rarity)
  )
})

const fetchCollections = async () => {
  if (!props.walletAddress) return

  try {
    const response = await fetch(`/api/collections/${props.walletAddress}`)

    if (!response.ok) {
      throw new Error('Failed to fetch collections')
    }

    const result = await response.json()
    collections.value = result.collections || []

    const collectionParam = route.query.collection as string
    if (collectionParam && collections.value.length > 0) {
      const found = collections.value.find(
        (c: any) => c.collectionName === collectionParam
      )
      if (found) {
        formData.value.collection = found.collectionName
      }
    }
  } catch (err) {
    console.error('Error fetching collections:', err)
    status.value = 'Failed to load collections'
    statusType.value = 'error'
  }
}

const onCollectionChange = () => {
  formData.value.type = ''
  formData.value.category = ''
  formData.value.additionalKey = ''
  formData.value.name = ''
  formData.value.description = ''
  formData.value.image = ''
  formData.value.symbol = ''
  formData.value.rarity = ''
  formData.value.maxSupply = ''
  formData.value.maxCapacity = ''
  formData.value.metadataAddress = ''
  symbolError.value = ''
  rarityError.value = ''
}

const loadFeeEstimate = async () => {
  if (!props.walletAddress) return

  try {
    const response = await fetch(`/api/token-classes/estimate-fee/${props.walletAddress}`)

    if (!response.ok) {
      throw new Error('Failed to estimate fees')
    }

    const result = await response.json()
    estimatedFee.value = result.estimatedFee || '0'
  } catch (error) {
    console.error('Error estimating fees:', error)
  }
}

onMounted(() => {
  loadFeeEstimate()
})

watch(() => props.walletAddress, () => {
  loadFeeEstimate()
})

const createTokenClass = async () => {
  if (!validateSymbol() || !validateRarity()) {
    status.value = 'Please fix validation errors'
    statusType.value = 'error'
    return
  }
  
  if (!canCreate.value || !walletService.client) {
    status.value = 'Please fill in all required fields and connect wallet'
    statusType.value = 'error'
    return
  }

  try {
    isProcessing.value = true
    status.value = 'Preparing token class creation...'
    statusType.value = 'info'

    const response = await fetch('/api/token-classes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: props.walletAddress,
        ...formData.value,
        additionalKey: formData.value.additionalKey || 'none',
      }),
    })

    if (!response.ok) {
      let errorMessage = 'Failed to prepare token class creation'
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

    status.value = 'Please sign the transaction in MetaMask...'
    statusType.value = 'info'
    
    const signedCreate = await walletService.client.sign(
      'CreateNftCollection',
      result.unsignedCreateDto
    )

    status.value = 'Submitting transaction to GalaChain...'
    statusType.value = 'info'
    
    const submitResponse = await fetch('/api/token-classes/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress: props.walletAddress,
        ...formData.value,
        signedTransaction: signedCreate,
      }),
    })

    if (!submitResponse.ok) {
      let errorMessage = `Failed to create token class (${submitResponse.status})`
      try {
        const errorData = await submitResponse.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        const text = await submitResponse.text().catch(() => '')
        if (text) errorMessage = text
      }
      throw new Error(errorMessage)
    }

    const submitResult = await submitResponse.json()

    status.value = `Successfully created token class!`
    statusType.value = 'success'

    const currentCollection = formData.value.collection
    formData.value = {
      collection: currentCollection,
      type: '',
      category: '',
      additionalKey: '',
      name: '',
      description: '',
      image: '',
      symbol: '',
      rarity: '',
      maxSupply: '',
      maxCapacity: '',
      metadataAddress: '',
    }
    estimatedFee.value = ''
    symbolError.value = ''
    rarityError.value = ''
  } catch (error) {
    console.error('Error creating token class:', error)
    status.value = `Error: ${error instanceof Error ? error.message : 'Failed to create token class'}`
    statusType.value = 'error'
  } finally {
    isProcessing.value = false
  }
}

onMounted(() => {
  if (props.walletAddress) {
    fetchCollections()
  }
})
</script>

<style scoped>
.token-class-form {
  margin-top: 1.5rem;
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

