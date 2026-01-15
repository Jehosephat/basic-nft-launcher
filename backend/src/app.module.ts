import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
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
      database: process.env.DATABASE_PATH || (process.env.NODE_ENV === 'production' ? './data/nft-collection.db' : 'nft-collection.db'),
      entities: [User, Transaction, Collection, TokenClass, MintTransaction],
      synchronize: process.env.NODE_ENV !== 'production', // Disable in production for safety
      logging: process.env.NODE_ENV === 'development',
    }),
    WalletModule,
    TransactionModule,
    CollectionModule,
    TokenClassModule,
    MintModule,
  ],
})
export class AppModule {}
