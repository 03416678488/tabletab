import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTransactionsAndRegister1787300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'register_sessions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'status', type: 'varchar', default: `'open'` },
          { name: 'openingBalance', type: 'double precision', default: 0 },
          { name: 'closingCountedBalance', type: 'double precision', isNullable: true },
          { name: 'expectedBalance', type: 'double precision', isNullable: true },
          { name: 'variance', type: 'double precision', isNullable: true },
          { name: 'note', type: 'varchar', isNullable: true },
          { name: 'openedBy', type: 'uuid', isNullable: true },
          { name: 'openedAt', type: 'timestamp', default: 'now()' },
          { name: 'closedAt', type: 'timestamp', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'transactions',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'type', type: 'varchar' },
          { name: 'method', type: 'varchar', default: `'cash'` },
          { name: 'amount', type: 'double precision', default: 0 },
          { name: 'orderId', type: 'uuid', isNullable: true },
          { name: 'registerSessionId', type: 'uuid', isNullable: true },
          { name: 'note', type: 'varchar', isNullable: true },
          { name: 'createdBy', type: 'uuid', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transactions_createdAt" ON "transactions" ("createdAt")`,
    );

    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'transactions',
      new TableForeignKey({
        columnNames: ['registerSessionId'],
        referencedTableName: 'register_sessions',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('transactions', true);
    await queryRunner.dropTable('register_sessions', true);
  }
}
