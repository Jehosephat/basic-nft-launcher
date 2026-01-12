import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { GalaChainService } from '../services/galachain.service';

@Injectable()
export class CollectionService {
  constructor(
    @InjectRepository(Collection)
    private collectionRepository: Repository<Collection>,
    private galaChainService: GalaChainService,
  ) {}

  /**
   * Claim a collection (Grant authorization only)
   * This grants the user authorization for a collection name
   */
  async claimCollection(
    walletAddress: string,
    collectionName: string,
    signedAuthorization?: any,
  ): Promise<{ collection: Collection; transactionId: string }> {
    try {
      // Check if collection already exists
      const existing = await this.collectionRepository.findOne({
        where: { collectionName, walletAddress },
      });

      if (existing) {
        throw new HttpException(
          'You have already claimed this collection',
          HttpStatus.BAD_REQUEST,
        );
      }

      // If signed transaction is provided, submit it
      // Otherwise, return the unsigned DTO for client-side signing
      if (signedAuthorization) {
        // Submit signed authorization directly to GalaChain
        const authResponse = await fetch(
          `${this.galaChainService.baseUrl}/GrantNftCollectionAuthorization`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              accept: 'application/json',
            },
            body: JSON.stringify(signedAuthorization),
          },
        );

        if (!authResponse.ok) {
          const errorText = await authResponse.text();
          throw new Error(`Authorization failed: ${authResponse.status} - ${errorText}`);
        }

        const authResult = await authResponse.json();

        // Create collection record
        const collection = this.collectionRepository.create({
          collectionName,
          walletAddress,
          transactionId: authResult.transactionId || `tx-${Date.now()}`,
          status: 'completed',
        });

        await this.collectionRepository.save(collection);

        return {
          collection,
          transactionId: authResult.transactionId || `tx-${Date.now()}`,
        };
      } else {
        // Return unsigned DTO for client-side signing
        // Get expiration timestamp in milliseconds (13 digits) + 60 seconds buffer
        // This gives the user time to sign the transaction in MetaMask
        const dtoExpiresAt = Date.now() + 60000;
        
        const authDto = {
          authorizedUser: walletAddress,
          collection: collectionName,
          dtoExpiresAt: dtoExpiresAt,
          uniqueKey: this.galaChainService.generateUniqueKey('auth'),
        };

        return {
          collection: null,
          transactionId: null,
          unsignedAuthDto: authDto,
        } as any;
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to claim collection',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get all collections for a user
   */
  async getUserCollections(walletAddress: string): Promise<Collection[]> {
    try {
      return await this.collectionRepository.find({
        where: { walletAddress },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch collections',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get a single collection by name
   */
  async getCollection(collectionName: string): Promise<Collection> {
    try {
      const collection = await this.collectionRepository.findOne({
        where: { collectionName },
      });

      if (!collection) {
        throw new HttpException('Collection not found', HttpStatus.NOT_FOUND);
      }

      return collection;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch collection',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Fetch collections from GalaChain and sync with database
   */
  async syncCollectionsFromChain(walletAddress: string): Promise<Collection[]> {
    try {
      const chainData = await this.galaChainService.fetchCollectionAuthorizations();
      
      // Process and sync collections
      // Note: The API response structure may vary, adjust accordingly
      const collections: Collection[] = [];

      // Handle different possible response structures
      let dataArray = [];
      if (chainData.Data && Array.isArray(chainData.Data)) {
        dataArray = chainData.Data;
      } else if (Array.isArray(chainData)) {
        dataArray = chainData;
      } else if (chainData.collections && Array.isArray(chainData.collections)) {
        dataArray = chainData.collections;
      }

      for (const item of dataArray) {
        // Check if this collection belongs to the user
        const authorizedUser = item.authorizedUser || item.authorized_user || item.user;
        if (authorizedUser === walletAddress) {
          const collectionName = item.collection || item.collectionName;
          
          if (collectionName) {
            // Check if collection exists in DB
            let collection = await this.collectionRepository.findOne({
              where: { collectionName, walletAddress },
            });

            if (!collection) {
              collection = this.collectionRepository.create({
                collectionName,
                walletAddress,
                status: 'completed',
                transactionId: item.transactionId || item.transaction_id || `sync-${Date.now()}`,
              });
              await this.collectionRepository.save(collection);
            }

            collections.push(collection);
          }
        }
      }

      return collections;
    } catch (error) {
      console.error('Error syncing collections from chain:', error);
      // Don't throw - just return empty array or existing collections
      // This allows the app to still show locally stored collections
      return [];
    }
  }

  /**
   * Estimate fee for claiming a collection
   */
  async estimateClaimFee(
    walletAddress: string,
    collectionName: string,
  ): Promise<any> {
    try {
      // Get expiration timestamp in milliseconds (13 digits) + 60 seconds buffer
      // This gives the user time to sign the transaction in MetaMask
      const dtoExpiresAt = Date.now() + 60000;
      
      const authDto = {
        authorizedUser: walletAddress,
        collection: collectionName,
        dtoExpiresAt: dtoExpiresAt,
        uniqueKey: this.galaChainService.generateUniqueKey('auth'),
      };

      // Estimate fee for authorization
      const feeResponse = await this.galaChainService.dryRun(
        'GrantNftCollectionAuthorization',
        authDto,
      );

      // Extract fee from DryRun response
      const estimatedFee = this.galaChainService.extractFeeFromDryRunResponse(
        feeResponse,
        'GrantNftCollectionAuthorization',
        walletAddress,
      );

      return {
        estimatedFee,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to estimate fees: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

