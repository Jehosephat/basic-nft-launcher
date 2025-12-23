import { DataSource, DataSourceOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Collection } from '../entities/collection.entity';
import { TokenClass } from '../entities/token-class.entity';
import { MintTransaction } from '../entities/mint-transaction.entity';

export const getDatabaseConfig = (configService: ConfigService): DataSourceOptions => {
  return {
    type: 'postgres',
    host: configService.get<string>('DATABASE_HOST', 'localhost'),
    port: configService.get<number>('DATABASE_PORT', 5432),
    username: configService.get<string>('DATABASE_USER', 'postgres'),
    password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
    database: configService.get<string>('DATABASE_NAME', 'nft_collection'),
    entities: [Collection, TokenClass, MintTransaction],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    synchronize: configService.get<string>('NODE_ENV') === 'development',
    migrationsRun: configService.get<string>('NODE_ENV') !== 'development',
    logging: configService.get<string>('NODE_ENV') === 'development',
    ssl: configService.get<string>('DATABASE_SSL') === 'true' ? {
      rejectUnauthorized: false,
    } : false,
  };
};

// For TypeORM CLI
const configService = new ConfigService();
export const AppDataSource = new DataSource(getDatabaseConfig(configService));

