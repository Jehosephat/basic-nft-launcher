import { DataSource } from 'typeorm';
import { Collection } from './src/entities/collection.entity';
import { TokenClass } from './src/entities/token-class.entity';
import { MintTransaction } from './src/entities/mint-transaction.entity';

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432', 10),
  username: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_NAME || 'nft_collection',
  entities: [Collection, TokenClass, MintTransaction],
  migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

