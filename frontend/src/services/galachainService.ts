const GALACHAIN_API =
  import.meta.env.VITE_GALACHAIN_API ||
  'https://gateway-mainnet.galachain.com/api/asset/token-contract';

export interface GrantCollectionAuthorizationDto {
  authorizedUser: string;
  collection: string;
  dtoExpiresAt: number;
  uniqueKey: string;
}

export interface CreateNftCollectionDto {
  additionalKey?: string;
  authorities: string[];
  category?: string;
  collection: string;
  contractAddress?: string;
  description?: string;
  dtoExpiresAt: number;
  image?: string;
  maxCapacity?: string;
  maxSupply?: string;
  metadataAddress?: string;
  name?: string;
  rarity?: string;
  symbol?: string;
  type?: string;
  uniqueKey: string;
}

export interface FetchCollectionAuthorizationsDto {
  bookmark?: string;
  dtoExpiresAt: number;
  limit: number;
}

export interface TokenClassDto {
  additionalKey?: string;
  category: string;
  collection: string;
  dtoExpiresAt?: number;
  type: string;
}

export interface FetchTokenClassesDto {
  dtoExpiresAt: number;
  prefix?: string;
  tokenClasses: TokenClassDto[];
}

export interface MintTokenDto {
  dtoExpiresAt: number;
  owner: string;
  quantity: string;
  tokenClass: {
    additionalKey?: string;
    category: string;
    collection: string;
    dtoExpiresAt: number;
    type: string;
  };
  tokenInstance?: string;
  uniqueKey: string;
}

export interface DryRunDto {
  dto: string;
  dtoExpiresAt: number;
  method: string;
}

export const galachainService = {
  /**
   * Generate a unique key for transactions
   */
  generateUniqueKey(prefix: string = 'tx'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get expiration timestamp (1 hour + 10 seconds from now)
   * Adding 10 seconds buffer to account for signing and submission delays
   */
  getExpirationTimestamp(): number {
    return Math.floor(Date.now() / 1000) + 3600 + 10; // Current time + 1 hour + 10 seconds
  },

  /**
   * Grant NFT Collection Authorization
   */
  async grantCollectionAuthorization(
    dto: GrantCollectionAuthorizationDto,
  ): Promise<any> {
    const response = await fetch(`${GALACHAIN_API}/GrantNftCollectionAuthorization`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GalaChain API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  /**
   * Create NFT Collection
   */
  async createNftCollection(dto: CreateNftCollectionDto): Promise<any> {
    const response = await fetch(`${GALACHAIN_API}/CreateNftCollection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GalaChain API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  /**
   * Fetch NFT Collection Authorizations with Pagination
   */
  async fetchCollectionAuthorizations(
    bookmark?: string,
    limit: number = 100,
  ): Promise<any> {
    const dto: FetchCollectionAuthorizationsDto = {
      bookmark: bookmark || '',
      dtoExpiresAt: this.getExpirationTimestamp(),
      limit,
    };

    const response = await fetch(
      `${GALACHAIN_API}/FetchNftCollectionAuthorizationsWithPagination`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(dto),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GalaChain API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  /**
   * Fetch Token Classes with Supply
   */
  async fetchTokenClassesWithSupply(
    tokenClasses: TokenClassDto[],
    prefix?: string,
  ): Promise<any> {
    const dto: FetchTokenClassesDto = {
      dtoExpiresAt: this.getExpirationTimestamp(),
      prefix: prefix || '',
      tokenClasses: tokenClasses.map((tc) => ({
        ...tc,
        dtoExpiresAt: this.getExpirationTimestamp(),
      })),
    };

    const response = await fetch(`${GALACHAIN_API}/FetchTokenClassesWithSupply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GalaChain API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  /**
   * Mint Token with Allowance
   */
  async mintTokenWithAllowance(dto: MintTokenDto): Promise<any> {
    const response = await fetch(`${GALACHAIN_API}/MintTokenWithAllowance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GalaChain API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  /**
   * Fetch Balances
   */
  async fetchBalances(owner: string): Promise<any> {
    const dto = {
      owner,
    };

    const response = await fetch(`${GALACHAIN_API}/FetchBalances`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GalaChain API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },

  /**
   * Dry Run - Estimate transaction fees
   */
  async dryRun(method: string, dto: any): Promise<any> {
    const dryRunDto: DryRunDto = {
      dto: typeof dto === 'string' ? dto : JSON.stringify(dto),
      dtoExpiresAt: this.getExpirationTimestamp(),
      method,
    };

    const response = await fetch(`${GALACHAIN_API}/DryRun`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(dryRunDto),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GalaChain API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  },
};

