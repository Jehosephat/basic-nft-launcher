import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WalletModule } from './wallet/wallet.module';
import { TransactionModule } from './transaction/transaction.module';
import { CollectionModule } from './collection/collection.module';
import { TokenClassModule } from './token-class/token-class.module';
import { MintModule } from './mint/mint.module';
import { Collection } from './entities/collection.entity';
import { TokenClass } from './entities/token-class.entity';
import { MintTransaction } from './entities/mint-transaction.entity';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    WalletModule,
    TransactionModule,
    CollectionModule,
    TokenClassModule,
    MintModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
