import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenClass } from '../entities/token-class.entity';
import { GalaChainService } from '../services/galachain.service';
import { CollectionService } from '../collection/collection.service';

@Injectable()
export class TokenClassService {
  constructor(
    @InjectRepository(TokenClass)
    private tokenClassRepository: Repository<TokenClass>,
    private galaChainService: GalaChainService,
    private collectionService: CollectionService,
  ) {}

  /**
   * Create a token class for a collection
   * This calls CreateNftCollection on GalaChain
   */
  async createTokenClass(
    walletAddress: string,
    tokenClassData: {
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
    },
    signedTransaction?: any,
  ): Promise<{ tokenClass: TokenClass; transactionId: string }> {
    try {
      // Verify collection exists and user owns it
      const collection = await this.collectionService.getCollection(
        tokenClassData.collection,
      );

      if (collection.walletAddress !== walletAddress) {
        throw new HttpException(
          'You do not own this collection',
          HttpStatus.FORBIDDEN,
        );
      }

      // Check if token class already exists
      const additionalKeyValue = tokenClassData.additionalKey || 'none';
      const existing = await this.tokenClassRepository.findOne({
        where: {
          collection: tokenClassData.collection,
          type: tokenClassData.type,
          category: tokenClassData.category,
          additionalKey: additionalKeyValue,
        },
      });

      if (existing) {
        throw new HttpException(
          'Token class already exists',
          HttpStatus.BAD_REQUEST,
        );
      }

      // If signed transaction is provided, submit it
      // Otherwise, return the unsigned DTO for client-side signing
      if (signedTransaction) {
        // Submit signed CreateNftCollection transaction directly to GalaChain
        const response = await fetch(
          `${this.galaChainService.baseUrl}/CreateNftCollection`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              accept: 'application/json',
            },
            body: JSON.stringify(signedTransaction),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`CreateNftCollection failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        // Create token class record in database
        const tokenClass = this.tokenClassRepository.create({
          collection: tokenClassData.collection,
          type: tokenClassData.type,
          category: tokenClassData.category,
          additionalKey: tokenClassData.additionalKey || 'none',
          walletAddress,
          transactionId: result.transactionId || `tx-${Date.now()}`,
          status: 'completed',
          currentSupply: '0',
          image: tokenClassData.image,
        });

        await this.tokenClassRepository.save(tokenClass);

        return {
          tokenClass,
          transactionId: tokenClass.transactionId,
        };
      } else {
        // Format maxSupply and maxCapacity as stringified whole numbers (no decimals, no trailing zeros)
        const formatBigNumber = (value: string | undefined): string => {
          if (!value) return '';
          // Remove any decimals, convert to integer, then back to string
          const num = Math.floor(parseFloat(value) || 0);
          return num.toString();
        };

        // Return unsigned DTO for client-side signing
        // Get expiration timestamp in milliseconds (13 digits) + 60 seconds buffer
        // This gives the user time to sign the transaction in MetaMask
        const dtoExpiresAt = Date.now() + 60000;
        
        const createDto = {
          collection: tokenClassData.collection,
          authorities: [walletAddress],
          category: tokenClassData.category,
          type: tokenClassData.type,
          additionalKey: tokenClassData.additionalKey || 'none',
          name: tokenClassData.name || tokenClassData.collection,
          description: tokenClassData.description || '',
          image: tokenClassData.image || '',
          symbol: tokenClassData.symbol || '',
          rarity: tokenClassData.rarity || '',
          maxSupply: formatBigNumber(tokenClassData.maxSupply),
          maxCapacity: formatBigNumber(tokenClassData.maxCapacity),
          metadataAddress: tokenClassData.metadataAddress || '',
          contractAddress: 'gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken',
          dtoExpiresAt: dtoExpiresAt,
          uniqueKey: this.galaChainService.generateUniqueKey('create'),
        };

        return {
          tokenClass: null,
          transactionId: null,
          unsignedCreateDto: createDto,
        } as any;
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create token class',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all token classes for a user
   */
  async getUserTokenClasses(walletAddress: string): Promise<TokenClass[]> {
    try {
      return await this.tokenClassRepository.find({
        where: { walletAddress },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch token classes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get token classes for a specific collection
   */
  async getCollectionTokenClasses(
    collection: string,
  ): Promise<TokenClass[]> {
    try {
      return await this.tokenClassRepository.find({
        where: { collection },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch token classes',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sync token classes from GalaChain
   */
  async syncTokenClassesFromChain(
    walletAddress: string,
  ): Promise<TokenClass[]> {
    try {
      // Get user's collections first
      const collections = await this.collectionService.getUserCollections(
        walletAddress,
      );

      const allTokenClasses: TokenClass[] = [];

      for (const collection of collections) {
        // Fetch token classes for this collection
        // Note: We need to know the token classes to fetch them
        // This is a simplified version - in practice, you'd need to track
        // which token classes exist for each collection

        // For now, we'll fetch from our database and update supply from chain
        const localClasses = await this.getCollectionTokenClasses(
          collection.collectionName,
        );

        for (const tokenClass of localClasses) {
          try {
            const chainData =
              await this.galaChainService.fetchTokenClassesWithSupply([
                {
                  collection: tokenClass.collection,
                  type: tokenClass.type,
                  category: tokenClass.category,
                  additionalKey: tokenClass.additionalKey,
                },
              ]);

            // Update supply and image from chain response
            if (chainData.Data && Array.isArray(chainData.Data) && chainData.Data.length > 0) {
              const chainTokenClass = chainData.Data[0];
              
              // Update supply from totalSupply
              if (chainTokenClass.totalSupply !== undefined && chainTokenClass.totalSupply !== null) {
                tokenClass.currentSupply = String(chainTokenClass.totalSupply);
              }
              
              // Update image from chain if available
              if (chainTokenClass.image) {
                tokenClass.image = chainTokenClass.image;
              }
              
              await this.tokenClassRepository.save(tokenClass);
            }

            allTokenClasses.push(tokenClass);
          } catch (error) {
            console.error(
              `Failed to sync token class ${tokenClass.id}:`,
              error,
            );
            // Still add the token class even if sync fails
            allTokenClasses.push(tokenClass);
          }
        }
      }

      return allTokenClasses;
    } catch (error) {
      throw new HttpException(
        'Failed to sync token classes from chain',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Estimate fee for creating a token class (CreateNftCollection)
   */
  async estimateCreateFee(
    walletAddress: string,
    tokenClassData: {
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
    },
  ): Promise<any> {
    try {
      // Format maxSupply and maxCapacity as stringified whole numbers (no decimals, no trailing zeros)
      const formatBigNumber = (value: string | undefined): string => {
        if (!value) return '';
        // Remove any decimals, convert to integer, then back to string
        const num = Math.floor(parseFloat(value) || 0);
        return num.toString();
      };

      // Get expiration timestamp in milliseconds (13 digits) + 60 seconds buffer
      // This gives the user time to sign the transaction in MetaMask
      const dtoExpiresAt = Date.now() + 60000;

      const createDto = {
        collection: tokenClassData.collection,
        authorities: [walletAddress],
        category: tokenClassData.category,
        type: tokenClassData.type,
        additionalKey: tokenClassData.additionalKey || '',
        name: tokenClassData.name || tokenClassData.collection,
        description: tokenClassData.description || '',
        image: tokenClassData.image || '',
        symbol: tokenClassData.symbol || '',
        rarity: tokenClassData.rarity || '',
        maxSupply: formatBigNumber(tokenClassData.maxSupply),
        maxCapacity: formatBigNumber(tokenClassData.maxCapacity),
        metadataAddress: tokenClassData.metadataAddress || '',
        contractAddress: 'gc-a9b8b472b035c0510508c248d1110d3162b7e5f4-GalaChainToken',
        dtoExpiresAt: dtoExpiresAt,
        uniqueKey: this.galaChainService.generateUniqueKey('create'),
      };

      const feeResponse = await this.galaChainService.dryRun(
        'CreateNftCollection',
        createDto,
      );

      // Extract fee from DryRun response
      const estimatedFee = this.galaChainService.extractFeeFromDryRunResponse(
        feeResponse,
        'CreateNftCollection',
        walletAddress,
      );

      return {
        estimatedFee,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to estimate fee',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

