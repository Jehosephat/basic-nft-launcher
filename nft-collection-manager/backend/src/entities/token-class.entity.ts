import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('token_classes')
@Unique(['collection', 'type', 'category', 'additionalKey'])
export class TokenClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index('idx_token_classes_collection')
  collection: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ name: 'additional_key', default: 'none' })
  additionalKey: string;

  @Column({ name: 'wallet_address' })
  @Index('idx_token_classes_wallet_address')
  walletAddress: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'current_supply', default: '0' })
  currentSupply: string;

  @Column({ nullable: true })
  image: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

