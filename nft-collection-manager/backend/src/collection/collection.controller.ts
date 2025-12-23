import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IsString, IsOptional, IsObject } from 'class-validator';
import { CollectionService } from './collection.service';

export class ClaimCollectionDto {
  @IsString()
  collection: string;

  @IsString()
  walletAddress: string;

  @IsObject()
  @IsOptional()
  signedAuthorization?: any;
}

@Controller('collections')
export class CollectionController {
  constructor(private readonly collectionService: CollectionService) {}

  @Post('claim')
  async claimCollection(@Body() body: ClaimCollectionDto) {
    try {
      const result = await this.collectionService.claimCollection(
        body.walletAddress,
        body.collection,
        body.signedAuthorization,
      );

      return {
        success: true,
        message: 'Collection claimed successfully',
        ...result,
      };
    } catch (error) {
      console.error('Error claiming collection:', error);
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || 'Failed to claim collection';
      throw new HttpException(
        {
          statusCode,
          message,
          error: error.stack || 'Unknown error',
        },
        statusCode,
      );
    }
  }

  @Get(':address')
  async getUserCollections(@Param('address') address: string) {
    try {
      try {
        await this.collectionService.syncCollectionsFromChain(address);
      } catch (syncError) {
      }
      
      const collections = await this.collectionService.getUserCollections(
        address,
      );

      return {
        success: true,
        collections,
      };
    } catch (error) {
      console.error('Error fetching collections:', error);
      throw new HttpException(
        error.message || 'Failed to fetch collections',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('single/:collectionName')
  async getCollection(@Param('collectionName') collectionName: string) {
    try {
      const collection = await this.collectionService.getCollection(
        collectionName,
      );

      return {
        success: true,
        collection,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch collection',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('estimate-fee')
  async estimateFee(@Body() body: ClaimCollectionDto) {
    try {
      const estimate = await this.collectionService.estimateClaimFee(
        body.walletAddress,
        body.collection,
      );

      return {
        success: true,
        ...estimate,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to estimate fee',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('estimate-fee/:address')
  async estimateFeeWithDummy(@Param('address') address: string) {
    try {
      const estimate = await this.collectionService.estimateClaimFee(
        address,
        'DUMMY',
      );

      return {
        success: true,
        ...estimate,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to estimate fee',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

