import { Controller, Get, Post, Param, Body, HttpException, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}


  @Post('connect')
  async connectWallet(@Body() body: { walletAddress: string }) {
    try {
      const { walletAddress } = body;
      
      const isValid = await this.walletService.validateWalletAddress(walletAddress);
      if (!isValid) {
        throw new HttpException('Invalid wallet address format', HttpStatus.BAD_REQUEST);
      }

      // Create or find user
      await this.walletService.findOrCreateUser(walletAddress);
      
      return { 
        success: true, 
        message: 'Wallet connected successfully',
        walletAddress 
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to connect wallet',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
