import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class GalaChainService {
  public readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.GALACHAIN_API ||
      'https://gateway-mainnet.galachain.com/api/asset/token-contract';
  }

  /**
   * Generate a unique key for transactions
   */
  generateUniqueKey(prefix: string = 'tx'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get expiration timestamp (1 hour + 10 seconds from now)
   * Adding 10 seconds buffer to account for signing and submission delays
   */
  getExpirationTimestamp(): number {
    return Math.floor(Date.now() / 1000) + 3600 + 10; // Current time + 1 hour + 10 seconds
  }

  /**
   * Grant NFT Collection Authorization
   */
  async grantCollectionAuthorization(
    authorizedUser: string,
    collection: string,
    uniqueKey: string,
  ): Promise<any> {
    const dto = {
      authorizedUser,
      collection,
      dtoExpiresAt: this.getExpirationTimestamp(),
      uniqueKey,
    };

    try {
      const response = await fetch(`${this.baseUrl}/GrantNftCollectionAuthorization`, {
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
    } catch (error) {
      throw new HttpException(
        `Failed to grant collection authorization: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Create NFT Collection
   */
  async createNftCollection(collectionData: {
    additionalKey?: string;
    authorities: string[];
    category?: string;
    collection: string;
    contractAddress?: string;
    description?: string;
    image?: string;
    maxCapacity?: string;
    maxSupply?: string;
    metadataAddress?: string;
    name?: string;
    rarity?: string;
    symbol?: string;
    type?: string;
    uniqueKey: string;
  }): Promise<any> {
    const dto = {
      ...collectionData,
      dtoExpiresAt: this.getExpirationTimestamp(),
    };

    try {
      const response = await fetch(`${this.baseUrl}/CreateNftCollection`, {
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
    } catch (error) {
      throw new HttpException(
        `Failed to create NFT collection: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch NFT Collection Authorizations with Pagination
   */
  async fetchCollectionAuthorizations(
    bookmark?: string,
    limit: number = 100,
  ): Promise<any> {
    const dto: any = {
      bookmark: bookmark || '',
      limit,
    };

    try {
      const response = await fetch(
        `${this.baseUrl}/FetchNftCollectionAuthorizationsWithPagination`,
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
    } catch (error) {
      throw new HttpException(
        `Failed to fetch collection authorizations: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch Token Classes with Supply
   */
  async fetchTokenClassesWithSupply(
    tokenClasses: Array<{
      additionalKey?: string;
      category: string;
      collection: string;
      type: string;
    }>,
  ): Promise<any> {
    const dto = {
      tokenClasses: tokenClasses.map((tc) => ({
        ...tc,
      })),
    };

    try {
      const response = await fetch(`${this.baseUrl}/FetchTokenClassesWithSupply`, {
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
    } catch (error) {
      throw new HttpException(
        `Failed to fetch token classes: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Mint Token with Allowance
   */
  async mintTokenWithAllowance(mintData: {
    owner: string;
    quantity: string;
    tokenClass: {
      additionalKey?: string;
      category: string;
      collection: string;
      type: string;
    };
    tokenInstance?: string;
    uniqueKey: string;
  }): Promise<any> {
    const dto = {
      ...mintData,
      tokenClass: {
        ...mintData.tokenClass,
        dtoExpiresAt: this.getExpirationTimestamp(),
      },
      dtoExpiresAt: this.getExpirationTimestamp(),
    };

    try {
      const response = await fetch(`${this.baseUrl}/MintTokenWithAllowance`, {
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
    } catch (error) {
      throw new HttpException(
        `Failed to mint token: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch Balances
   */
  async fetchBalances(owner: string): Promise<any> {
    const dto = {
      owner,
    };

    try {
      const response = await fetch(`${this.baseUrl}/FetchBalances`, {
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
    } catch (error) {
      throw new HttpException(
        `Failed to fetch balances: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Dry Run - Estimate transaction fees
   */
  async dryRun(method: string, dto: any): Promise<any> {
    // Extract owner/signerAddress from the DTO for DryRun
    let signerAddress: string | undefined;
    const dtoObj = typeof dto === 'string' ? JSON.parse(dto) : dto;
    
    // Try to find owner or authorizedUser in the DTO
    if (dtoObj.owner) {
      signerAddress = dtoObj.owner;
    } else if (dtoObj.authorizedUser) {
      signerAddress = dtoObj.authorizedUser;
    } else if (dtoObj.authorities && dtoObj.authorities.length > 0) {
      signerAddress = dtoObj.authorities[0];
    }
    
    const dryRunDto: any = {
      dto: typeof dto === 'string' ? dto : JSON.stringify(dto),
      method,
    };
    
    // Add signerAddress if we found it
    if (signerAddress) {
      dryRunDto.signerAddress = signerAddress;
    }

    try {
      const response = await fetch(`${this.baseUrl}/DryRun`, {
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
    } catch (error) {
      throw new HttpException(
        `Failed to dry run transaction: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Extract fee estimate from DryRun response
   * Looks for cumulativeFeeQuantity in the writes collection
   */
  extractFeeFromDryRunResponse(dryRunResponse: any, method: string, userAddress: string): string {
    try {
      if (!dryRunResponse?.Data?.writes) {
        return '0';
      }

      const writes = dryRunResponse.Data.writes;
      // Fee key pattern: \u0000GCFTU\u0000{method}\u0000{userAddress}\u0000
      const feeKey = `\u0000GCFTU\u0000${method}\u0000${userAddress}\u0000`;
      
      // Try exact match first
      if (writes[feeKey]) {
        const feeData = typeof writes[feeKey] === 'string' 
          ? JSON.parse(writes[feeKey]) 
          : writes[feeKey];
        return feeData.cumulativeFeeQuantity || '0';
      }
      
      // If exact match fails, try to find any key that starts with GCFTU and the method
      const feeKeyPrefix = `\u0000GCFTU\u0000${method}\u0000`;
      for (const key in writes) {
        if (key.startsWith(feeKeyPrefix)) {
          const feeData = typeof writes[key] === 'string' 
            ? JSON.parse(writes[key]) 
            : writes[key];
          if (feeData.cumulativeFeeQuantity) {
            return feeData.cumulativeFeeQuantity;
          }
        }
      }
      
      // Try to find any key containing GCFTU
      for (const key in writes) {
        if (key.includes('GCFTU')) {
          const feeData = typeof writes[key] === 'string' 
            ? JSON.parse(writes[key]) 
            : writes[key];
          if (feeData.cumulativeFeeQuantity) {
            return feeData.cumulativeFeeQuantity;
          }
        }
      }
    } catch (error) {
      console.error('Error extracting fee from DryRun response:', error);
    }
    
    return '0';
  }
}

