import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
import { Collection } from '../entities/collection.entity';
import { GalaChainService } from '../services/galachain.service';

@Module({
  imports: [TypeOrmModule.forFeature([Collection])],
  controllers: [CollectionController],
  providers: [CollectionService, GalaChainService],
  exports: [CollectionService],
})
export class CollectionModule {}

