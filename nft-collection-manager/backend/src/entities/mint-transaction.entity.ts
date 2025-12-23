import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('mint_transactions')
export class MintTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'wallet_address' })
  @Index('idx_mint_transactions_wallet_address')
  walletAddress: string;

  @Column()
  @Index('idx_mint_transactions_collection')
  collection: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ name: 'additional_key', nullable: true })
  additionalKey: string;

  @Column()
  owner: string;

  @Column()
  quantity: string;

  @Column({ name: 'token_instance', default: '0' })
  tokenInstance: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  @Index('idx_mint_transactions_created_at')
  createdAt: Date;
}

