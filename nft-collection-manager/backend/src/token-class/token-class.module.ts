import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TokenClassController } from './token-class.controller';
import { TokenClassService } from './token-class.service';
import { TokenClass } from '../entities/token-class.entity';
import { GalaChainService } from '../services/galachain.service';
import { CollectionModule } from '../collection/collection.module';

@Module({
  imports: [TypeOrmModule.forFeature([TokenClass]), CollectionModule],
  controllers: [TokenClassController],
  providers: [TokenClassService, GalaChainService],
  exports: [TokenClassService],
})
export class TokenClassModule {}

