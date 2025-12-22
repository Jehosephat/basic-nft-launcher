import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Collection } from './src/entities/collection.entity';
import { TokenClass } from './src/entities/token-class.entity';
import { MintTransaction } from './src/entities/mint-transaction.entity';

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USER', 'postgres'),
  password: configService.get<string>('DATABASE_PASSWORD', 'postgres'),
  database: configService.get<string>('DATABASE_NAME', 'nft_collection'),
  entities: [Collection, TokenClass, MintTransaction],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  ssl: configService.get<string>('DATABASE_SSL') === 'true' ? {
    rejectUnauthorized: false,
  } : false,
});

