import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('collections')
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  collectionName: string;

  @Column()
  walletAddress: string; // User who claimed it

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  symbol: string;

  @Column({ nullable: true })
  contractAddress: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  rarity: string;

  @Column({ nullable: true })
  maxSupply: string;

  @Column({ nullable: true })
  maxCapacity: string;

  @Column({ nullable: true })
  metadataAddress: string;

  @Column()
  transactionId: string; // From CreateNftCollection

  @Column({ default: 'pending' })
  status: string; // pending, completed, failed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

