import { DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Collection } from '../entities/collection.entity';
import { TokenClass } from '../entities/token-class.entity';
import { MintTransaction } from '../entities/mint-transaction.entity';
import { AppConfig } from './app';

export const getDatabaseConfig = (configService: ConfigService): DataSourceOptions => {
  const appConfig = configService.get<AppConfig>('app');
  const db = appConfig.database;
  
  return {
    type: 'postgres',
    host: db.host,
    port: db.port,
    username: db.user,
    password: db.password,
    database: db.name,
    entities: [Collection, TokenClass, MintTransaction],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: appConfig.nodeEnv === 'development',
    migrationsRun: appConfig.nodeEnv === 'production',
    logging: appConfig.nodeEnv === 'development',
    ssl: db.ssl ? { rejectUnauthorized: false } : false,
  };
};

