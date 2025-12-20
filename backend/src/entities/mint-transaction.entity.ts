import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('mint_transactions')
export class MintTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  walletAddress: string; // User who initiated the mint

  @Column()
  collection: string;

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  additionalKey: string;

  @Column()
  owner: string; // NFT owner address

  @Column()
  quantity: string;

  @Column({ nullable: true })
  tokenInstance: string;

  @Column()
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;
}

