import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MintTransaction } from '../entities/mint-transaction.entity';
import { TokenClass } from '../entities/token-class.entity';
import { GalaChainService } from '../services/galachain.service';
import { TokenClassService } from '../token-class/token-class.service';

@Injectable()
export class MintService {
  constructor(
    @InjectRepository(MintTransaction)
    private mintTransactionRepository: Repository<MintTransaction>,
    @InjectRepository(TokenClass)
    private tokenClassRepository: Repository<TokenClass>,
    private galaChainService: GalaChainService,
    private tokenClassService: TokenClassService,
  ) {}

  async mintTokens(
    walletAddress: string,
    mintData: {
      collection: string;
      type: string;
      category: string;
      additionalKey?: string;
      owner: string;
      quantity: string;
    },
    signedTransaction?: any,
  ): Promise<{ transaction: MintTransaction; transactionId: string }> {
    try {
      const tokenClasses = await this.tokenClassService.getCollectionTokenClasses(
        mintData.collection,
      );

      let tokenClass = tokenClasses.find(
        (tc) =>
          tc.type === mintData.type &&
          tc.category === mintData.category &&
          (tc.additionalKey || null) === (mintData.additionalKey || null),
      );

      if (!tokenClass) {
        throw new HttpException(
          'Token class not found. Please create the token class first.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (signedTransaction) {
        const response = await fetch(
          `${this.galaChainService.baseUrl}/MintTokenWithAllowance`,
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
          throw new Error(`Minting failed: ${response.status} - ${errorText}`);
        }

        const result = await response.json();

        const transaction = this.mintTransactionRepository.create({
          walletAddress,
          collection: mintData.collection,
          type: mintData.type,
          category: mintData.category,
          additionalKey: mintData.additionalKey || null,
          owner: mintData.owner,
          quantity: mintData.quantity,
          tokenInstance: '0',
          transactionId: result.transactionId || `tx-${Date.now()}`,
          status: 'completed',
        });

        await this.mintTransactionRepository.save(transaction);

        if (tokenClass && tokenClass.status === 'pending') {
          tokenClass.status = 'completed';
          tokenClass.transactionId = result.transactionId || transaction.transactionId;
          await this.tokenClassRepository.save(tokenClass);
        }

        return {
          transaction,
          transactionId: transaction.transactionId,
        };
      } else {
        const dtoExpiresAt = Date.now() + 60000;
        
        const mintDto = {
          owner: mintData.owner,
          quantity: mintData.quantity,
          tokenClass: {
            collection: mintData.collection,
            type: mintData.type,
            category: mintData.category,
            additionalKey: mintData.additionalKey,
            dtoExpiresAt: dtoExpiresAt,
          },
          tokenInstance: '0',
          dtoExpiresAt: dtoExpiresAt,
          uniqueKey: this.galaChainService.generateUniqueKey('mint'),
        };

        return {
          transaction: null,
          transactionId: null,
          unsignedMintDto: mintDto,
        } as any;
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to mint tokens',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getUserMintTransactions(
    walletAddress: string,
  ): Promise<MintTransaction[]> {
    try {
      return await this.mintTransactionRepository.find({
        where: { walletAddress },
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to fetch mint transactions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async estimateMintFee(
    mintData: {
      collection: string;
      type: string;
      category: string;
      additionalKey?: string;
      owner: string;
      quantity: string;
    },
  ): Promise<any> {
    try {
      const dtoExpiresAt = Date.now() + 60000;
      
      const mintDto = {
        owner: mintData.owner,
        quantity: mintData.quantity,
        tokenClass: {
          collection: mintData.collection,
          type: mintData.type,
          category: mintData.category,
          additionalKey: mintData.additionalKey || 'none',
          dtoExpiresAt: dtoExpiresAt,
        },
        tokenInstance: '0',
        dtoExpiresAt: dtoExpiresAt,
        uniqueKey: this.galaChainService.generateUniqueKey('mint'),
      };

      const feeResponse = await this.galaChainService.dryRun(
        'MintTokenWithAllowance',
        mintDto,
      );

      const estimatedFee = this.galaChainService.extractFeeFromDryRunResponse(
        feeResponse,
        'MintTokenWithAllowance',
        mintData.owner,
      );

      return {
        estimatedFee,
      };
    } catch (error) {
      console.error('Error estimating mint fee:', error);
      throw new HttpException(
        error.message || 'Failed to estimate minting fee',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

