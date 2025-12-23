import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MintController } from './mint.controller';
import { MintService } from './mint.service';
import { MintTransaction } from '../entities/mint-transaction.entity';
import { TokenClass } from '../entities/token-class.entity';
import { GalaChainService } from '../services/galachain.service';
import { TokenClassModule } from '../token-class/token-class.module';

@Module({
  imports: [TypeOrmModule.forFeature([MintTransaction, TokenClass]), TokenClassModule],
  controllers: [MintController],
  providers: [MintService, GalaChainService],
  exports: [MintService],
})
export class MintModule {}

