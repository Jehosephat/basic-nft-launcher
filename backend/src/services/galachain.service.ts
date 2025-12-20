import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class GalaChainService {
  public readonly baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.GALACHAIN_API ||
      'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken';
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
    const dryRunDto = {
      dto: typeof dto === 'string' ? dto : JSON.stringify(dto),
      dtoExpiresAt: this.getExpirationTimestamp(),
      method,
    };

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
}

