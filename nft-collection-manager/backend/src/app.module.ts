import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CollectionModule } from './collection/collection.module';
import { TokenClassModule } from './token-class/token-class.module';
import { MintModule } from './mint/mint.module';
import { Collection } from './entities/collection.entity';
import { TokenClass } from './entities/token-class.entity';
import { MintTransaction } from './entities/mint-transaction.entity';
import { getDatabaseConfig } from './config/database';
import { getAppConfig, AppConfig } from './config/app';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      load: [() => ({ app: getAppConfig() })],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const appConfig = configService.get<AppConfig>('app');
        return getDatabaseConfig(configService);
      },
      inject: [ConfigService],
    }),
    CollectionModule,
    TokenClassModule,
    MintModule,
  ],
  controllers: [AppController],
})
export class AppModule {}

