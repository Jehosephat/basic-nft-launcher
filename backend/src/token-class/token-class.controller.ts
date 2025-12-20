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
import { TokenClassService } from './token-class.service';

export class CreateTokenClassDto {
  @IsString()
  collection: string;

  @IsString()
  type: string;

  @IsString()
  category: string;

  @IsString()
  @IsOptional()
  additionalKey?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  symbol?: string;

  @IsString()
  @IsOptional()
  rarity?: string;

  @IsString()
  @IsOptional()
  maxSupply?: string;

  @IsString()
  @IsOptional()
  maxCapacity?: string;

  @IsString()
  @IsOptional()
  metadataAddress?: string;

  @IsString()
  walletAddress: string;

  @IsObject()
  @IsOptional()
  signedTransaction?: any;
}

@Controller('token-classes')
export class TokenClassController {
  constructor(private readonly tokenClassService: TokenClassService) {}

  @Post('create')
  async createTokenClass(@Body() body: CreateTokenClassDto) {
    try {
      // Validate required fields
      if (!body.description || !body.image || !body.maxSupply || !body.maxCapacity || !body.symbol || !body.rarity) {
        throw new HttpException(
          'Missing required fields: description, image, symbol, rarity, maxSupply, and maxCapacity are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate symbol and rarity contain only letters
      if (!/^[A-Za-z]+$/.test(body.symbol)) {
        throw new HttpException(
          'Symbol must contain only letters (a-z, A-Z)',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!/^[A-Za-z]+$/.test(body.rarity)) {
        throw new HttpException(
          'Rarity must contain only letters (a-z, A-Z)',
          HttpStatus.BAD_REQUEST,
        );
      }

      const result = await this.tokenClassService.createTokenClass(
        body.walletAddress,
        {
          collection: body.collection,
          type: body.type,
          category: body.category,
          additionalKey: body.additionalKey,
          name: body.name,
          description: body.description,
          image: body.image,
          symbol: body.symbol,
          rarity: body.rarity,
          maxSupply: body.maxSupply,
          maxCapacity: body.maxCapacity,
          metadataAddress: body.metadataAddress,
        },
        body.signedTransaction,
      );

      return {
        success: true,
        message: 'Token class created successfully',
        ...result,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create token class',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('user/:address')
  async getUserTokenClasses(@Param('address') address: string) {
    try {
      // Sync from chain first
      await this.tokenClassService.syncTokenClassesFromChain(address);
      const tokenClasses = await this.tokenClassService.getUserTokenClasses(
        address,
      );

      return {
        success: true,
        tokenClasses,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch token classes',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('collection/:collection')
  async getCollectionTokenClasses(@Param('collection') collection: string) {
    try {
      const tokenClasses =
        await this.tokenClassService.getCollectionTokenClasses(collection);

      return {
        success: true,
        tokenClasses,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch token classes',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('estimate-fee')
  async estimateFee(@Body() body: CreateTokenClassDto) {
    try {
      const estimate = await this.tokenClassService.estimateCreateFee(
        body.walletAddress,
        {
          collection: body.collection,
          type: body.type,
          category: body.category,
          additionalKey: body.additionalKey,
          name: body.name,
          description: body.description,
          image: body.image,
          symbol: body.symbol,
          rarity: body.rarity,
          maxSupply: body.maxSupply,
          maxCapacity: body.maxCapacity,
          metadataAddress: body.metadataAddress,
        },
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
      // Use dummy values since fee doesn't depend on them
      const estimate = await this.tokenClassService.estimateCreateFee(
        address,
        {
          collection: 'DUMMY',
          type: 'DUMMY',
          category: 'DUMMY',
          additionalKey: 'none',
          name: 'DUMMY',
          description: 'DUMMY',
          image: 'https://example.com/dummy.jpg',
          symbol: 'DUM',
          rarity: 'Common',
          maxSupply: '1000',
          maxCapacity: '1000',
          metadataAddress: '',
        },
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

