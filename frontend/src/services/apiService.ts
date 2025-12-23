const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
}

export const apiService = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
      } catch {
        error = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          statusCode: response.status,
        };
      }
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  },

  // Collections
  collections: {
    claim: (data: {
      walletAddress: string;
      collection: string;
      signedAuthorization?: any;
    }) =>
      apiService.request('/collections/claim', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getUserCollections: (address: string) =>
      apiService.request(`/collections/${address}`),

    getCollection: (collectionName: string) =>
      apiService.request(`/collections/single/${collectionName}`),

    estimateFee: (data: { walletAddress: string; collection: string }) =>
      apiService.request('/collections/estimate-fee', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    estimateFeeGet: (address: string) =>
      apiService.request(`/collections/estimate-fee/${address}`),
  },

  // Token Classes
  tokenClasses: {
    create: (data: {
      walletAddress: string;
      collection: string;
      type: string;
      category: string;
      additionalKey?: string;
      name?: string;
      description?: string;
      image?: string;
      symbol?: string;
      rarity?: string;
      maxSupply?: string;
      maxCapacity?: string;
      metadataAddress?: string;
      signedTransaction?: any;
    }) =>
      apiService.request('/token-classes/create', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getUserTokenClasses: (address: string) =>
      apiService.request(`/token-classes/user/${address}`),

    getCollectionTokenClasses: (collection: string) =>
      apiService.request(`/token-classes/collection/${collection}`),

    estimateFee: (data: any) =>
      apiService.request('/token-classes/estimate-fee', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    estimateFeeGet: (address: string) =>
      apiService.request(`/token-classes/estimate-fee/${address}`),
  },

  // Mint
  mint: {
    mintTokens: (data: {
      walletAddress: string;
      collection: string;
      type: string;
      category: string;
      additionalKey?: string;
      owner: string;
      quantity: string;
      signedTransaction?: any;
    }) =>
      apiService.request('/mint/tokens', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    getUserMintTransactions: (address: string) =>
      apiService.request(`/mint/transactions/${address}`),

    estimateFee: (data: any) =>
      apiService.request('/mint/estimate-fee', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    estimateFeeGet: (address: string) =>
      apiService.request(`/mint/estimate-fee/${address}`),
  },
};

