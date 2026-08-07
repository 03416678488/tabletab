import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Per-customer saved menu items (storefront favorites). Cascade-deletes when the
 * owning customer or the referenced menu item is removed, and a unique index
 * keeps a customer from favoriting the same item twice.
 */
export class CreateCustomerFavorites1789900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'customer_favorites',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'customerId', type: 'uuid' },
          { name: 'menuItemId', type: 'uuid' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'customer_favorites',
      new TableIndex({
        name: 'UQ_customer_favorites_customer_item',
        columnNames: ['customerId', 'menuItemId'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKeys('customer_favorites', [
      new TableForeignKey({
        columnNames: ['customerId'],
        referencedTableName: 'customers',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
      new TableForeignKey({
        columnNames: ['menuItemId'],
        referencedTableName: 'menu_items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('customer_favorites', true);
  }
}
