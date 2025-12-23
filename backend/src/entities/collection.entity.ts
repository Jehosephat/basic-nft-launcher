import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'collection_name', unique: true })
  collectionName: string;

  @Column({ name: 'wallet_address' })
  @Index('idx_collections_wallet_address')
  walletAddress: string; // User who claimed it

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ name: 'contract_address', nullable: true })
  contractAddress: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  rarity: string;

  @Column({ name: 'max_supply', nullable: true })
  maxSupply: string;

  @Column({ name: 'max_capacity', nullable: true })
  maxCapacity: string;

  @Column({ name: 'metadata_address', nullable: true })
  metadataAddress: string;

  @Column({ name: 'transaction_id' })
  transactionId: string; // From CreateNftCollection

  @Column({ default: 'pending' })
  status: string; // pending, completed, failed

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

