import { MigrationInterface, QueryRunner, Table, TableIndex, TableUnique } from 'typeorm';

export class InitialMigration1735000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create collections table
    await queryRunner.createTable(
      new Table({
        name: 'collections',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'collection_name',
            type: 'varchar',
            length: '255',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'wallet_address',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'image',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'symbol',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'contract_address',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'rarity',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'max_supply',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'max_capacity',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'metadata_address',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'collections',
      new TableIndex({
        name: 'idx_collections_wallet_address',
        columnNames: ['wallet_address'],
      }),
    );

    await queryRunner.createIndex(
      'collections',
      new TableIndex({
        name: 'idx_collections_collection_name',
        columnNames: ['collection_name'],
      }),
    );

    // Create token_classes table
    await queryRunner.createTable(
      new Table({
        name: 'token_classes',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'collection',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'additional_key',
            type: 'varchar',
            length: '255',
            default: "'none'",
          },
          {
            name: 'wallet_address',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'current_supply',
            type: 'varchar',
            length: '50',
            default: "'0'",
          },
          {
            name: 'image',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createUniqueConstraint(
      'token_classes',
      new TableUnique({
        name: 'UQ_token_classes_composite',
        columnNames: ['collection', 'type', 'category', 'additional_key'],
      }),
    );

    await queryRunner.createIndex(
      'token_classes',
      new TableIndex({
        name: 'idx_token_classes_wallet_address',
        columnNames: ['wallet_address'],
      }),
    );

    await queryRunner.createIndex(
      'token_classes',
      new TableIndex({
        name: 'idx_token_classes_collection',
        columnNames: ['collection'],
      }),
    );

    // Create mint_transactions table
    await queryRunner.createTable(
      new Table({
        name: 'mint_transactions',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'wallet_address',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'collection',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'type',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'additional_key',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'owner',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'quantity',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'token_instance',
            type: 'varchar',
            length: '50',
            default: "'0'",
          },
          {
            name: 'transaction_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'mint_transactions',
      new TableIndex({
        name: 'idx_mint_transactions_wallet_address',
        columnNames: ['wallet_address'],
      }),
    );

    await queryRunner.createIndex(
      'mint_transactions',
      new TableIndex({
        name: 'idx_mint_transactions_collection',
        columnNames: ['collection'],
      }),
    );

    await queryRunner.createIndex(
      'mint_transactions',
      new TableIndex({
        name: 'idx_mint_transactions_created_at',
        columnNames: ['created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('mint_transactions');
    await queryRunner.dropTable('token_classes');
    await queryRunner.dropTable('collections');
  }
}

