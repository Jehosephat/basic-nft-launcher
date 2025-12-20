import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findOrCreateUser(walletAddress: string): Promise<User> {
    let user = await this.userRepository.findOne({
      where: { walletAddress }
    });

    if (!user) {
      user = this.userRepository.create({
        walletAddress
      });
      await this.userRepository.save(user);
    }

    return user;
  }

  async validateWalletAddress(walletAddress: string): Promise<boolean> {
    // Basic validation for wallet address format
    // Accept both GalaChain format (eth|, client|) and standard Ethereum format (0x)
    return walletAddress.startsWith('eth|') || 
           walletAddress.startsWith('client|') || 
           walletAddress.startsWith('0x');
  }
}
