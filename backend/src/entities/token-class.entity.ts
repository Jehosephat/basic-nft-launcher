import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('token_classes')
export class TokenClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  collection: string; // Collection name

  @Column()
  type: string;

  @Column()
  category: string;

  @Column({ nullable: true })
  additionalKey: string;

  @Column()
  walletAddress: string; // User who created it

  @Column()
  transactionId: string;

  @Column({ default: 'pending' })
  status: string;

  @Column({ nullable: true })
  currentSupply: string; // From FetchTokenClassesWithSupply

  @Column({ nullable: true })
  image: string; // Image URL for the token class

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

