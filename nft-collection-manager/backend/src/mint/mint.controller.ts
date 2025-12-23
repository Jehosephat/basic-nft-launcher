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
import { MintService } from './mint.service';

export class MintTokensDto {
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
  owner: string;

  @IsString()
  quantity: string;

  @IsString()
  walletAddress: string;

  @IsObject()
  @IsOptional()
  signedTransaction?: any;
}

@Controller('mint')
export class MintController {
  constructor(private readonly mintService: MintService) {}

  @Post('tokens')
  async mintTokens(@Body() body: MintTokensDto) {
    try {
      const result = await this.mintService.mintTokens(
        body.walletAddress,
        {
          collection: body.collection,
          type: body.type,
          category: body.category,
          additionalKey: body.additionalKey,
          owner: body.owner,
          quantity: body.quantity,
        },
        body.signedTransaction,
      );

      return {
        success: true,
        message: 'Tokens minted successfully',
        ...result,
      };
    } catch (error) {
      console.error('Error minting tokens:', error);
      const statusCode = error.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.message || 'Failed to mint tokens';
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

  @Get('transactions/:address')
  async getMintTransactions(@Param('address') address: string) {
    try {
      const transactions = await this.mintService.getUserMintTransactions(
        address,
      );

      return {
        success: true,
        transactions,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch mint transactions',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('estimate-fee')
  async estimateFee(@Body() body: MintTokensDto) {
    try {
      const estimate = await this.mintService.estimateMintFee({
        collection: body.collection,
        type: body.type,
        category: body.category,
        additionalKey: body.additionalKey,
        owner: body.owner,
        quantity: body.quantity,
      });

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
      const estimate = await this.mintService.estimateMintFee({
        collection: 'DUMMY',
        type: 'DUMMY',
        category: 'DUMMY',
        additionalKey: 'none',
        owner: address,
        quantity: '1',
      });

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

