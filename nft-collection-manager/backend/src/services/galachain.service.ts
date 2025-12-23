import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GalaChainService {
  public readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.baseUrl =
      this.configService.get<string>('GALACHAIN_API') ||
      'https://gateway-testnet.galachain.com/api/testnet01/gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken';
  }

  generateUniqueKey(prefix: string = 'tx'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getExpirationTimestamp(): number {
    return Math.floor(Date.now() / 1000) + 3600 + 10;
  }

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

  async dryRun(method: string, dto: any): Promise<any> {
    let signerAddress: string | undefined;
    const dtoObj = typeof dto === 'string' ? JSON.parse(dto) : dto;
    
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

  extractFeeFromDryRunResponse(dryRunResponse: any, method: string, userAddress: string): string {
    try {
      if (!dryRunResponse?.Data?.writes) {
        return '0';
      }

      const writes = dryRunResponse.Data.writes;
      const feeKey = `\u0000GCFTU\u0000${method}\u0000${userAddress}\u0000`;
      
      if (writes[feeKey]) {
        const feeData = typeof writes[feeKey] === 'string' 
          ? JSON.parse(writes[feeKey]) 
          : writes[feeKey];
        return feeData.cumulativeFeeQuantity || '0';
      }
      
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
    } catch (error) {
      console.error('Error extracting fee from DryRun response:', error);
    }
    
    return '0';
  }
}

