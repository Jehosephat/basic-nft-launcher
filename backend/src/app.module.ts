import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { GemModule } from './gem/gem.module';
import { CollectionModule } from './collection/collection.module';
import { TokenClassModule } from './token-class/token-class.module';
import { MintModule } from './mint/mint.module';
import { User } from './entities/user.entity';
import { Transaction } from './entities/transaction.entity';
import { Collection } from './entities/collection.entity';
import { TokenClass } from './entities/token-class.entity';
import { MintTransaction } from './entities/mint-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'nft-collection.db',
      entities: [User, Transaction, Collection, TokenClass, MintTransaction],
      synchronize: true, // Only for development
      logging: true,
    }),
    WalletModule,
    TransactionModule,
    GemModule,
    CollectionModule,
    TokenClassModule,
    MintModule,
  ],
})
export class AppModule {}
