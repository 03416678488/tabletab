import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateOrders1786800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'orders',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'orderNumber', type: 'varchar', isUnique: true },
          { name: 'orderType', type: 'varchar', default: `'pos'` },
          { name: 'status', type: 'varchar', default: `'placed'` },
          { name: 'tableId', type: 'uuid', isNullable: true },
          { name: 'branchId', type: 'uuid', isNullable: true },
          { name: 'customerName', type: 'varchar', isNullable: true },
          { name: 'customerPhone', type: 'varchar', isNullable: true },
          { name: 'customerAddress', type: 'varchar', isNullable: true },
          { name: 'notes', type: 'varchar', isNullable: true },
          { name: 'subtotal', type: 'double precision', default: 0 },
          { name: 'tax', type: 'double precision', default: 0 },
          { name: 'discount', type: 'double precision', default: 0 },
          { name: 'total', type: 'double precision', default: 0 },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['tableId'],
        referencedTableName: 'tables',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
    await queryRunner.createForeignKey(
      'orders',
      new TableForeignKey({
        columnNames: ['branchId'],
        referencedTableName: 'branches',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'order_items',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'orderId', type: 'uuid' },
          { name: 'menuItemId', type: 'uuid', isNullable: true },
          { name: 'name', type: 'varchar' },
          { name: 'unitPrice', type: 'double precision', default: 0 },
          { name: 'quantity', type: 'int', default: 1 },
          { name: 'lineTotal', type: 'double precision', default: 0 },
          { name: 'notes', type: 'varchar', isNullable: true },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['orderId'],
        referencedTableName: 'orders',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'order_items',
      new TableForeignKey({
        columnNames: ['menuItemId'],
        referencedTableName: 'menu_items',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('order_items', true);
    await queryRunner.dropTable('orders', true);
  }
}
