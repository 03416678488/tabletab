import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class AddMenuItemOptionsAndRelations1786100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Option JSON columns on menu_items
    await queryRunner.query(
      `ALTER TABLE "menu_items"
        ADD COLUMN IF NOT EXISTS "sizes" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "variants" jsonb NOT NULL DEFAULT '[]',
        ADD COLUMN IF NOT EXISTS "addOns" jsonb NOT NULL DEFAULT '[]'`,
    );

    // menu_item ↔ food_type join table
    await queryRunner.createTable(
      new Table({
        name: 'menu_item_food_types',
        columns: [
          { name: 'menuItemId', type: 'uuid' },
          { name: 'foodTypeId', type: 'uuid' },
        ],
        foreignKeys: [
          {
            columnNames: ['menuItemId'],
            referencedTableName: 'menu_items',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['foodTypeId'],
            referencedTableName: 'food_types',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [{ columnNames: ['menuItemId', 'foodTypeId'], isUnique: true }],
      }),
      true,
    );

    // menu_item ↔ menu join table
    await queryRunner.createTable(
      new Table({
        name: 'menu_item_menus',
        columns: [
          { name: 'menuItemId', type: 'uuid' },
          { name: 'menuId', type: 'uuid' },
        ],
        foreignKeys: [
          {
            columnNames: ['menuItemId'],
            referencedTableName: 'menu_items',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['menuId'],
            referencedTableName: 'menus',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
        indices: [{ columnNames: ['menuItemId', 'menuId'], isUnique: true }],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('menu_item_menus', true);
    await queryRunner.dropTable('menu_item_food_types', true);
    await queryRunner.query(
      `ALTER TABLE "menu_items" DROP COLUMN IF EXISTS "sizes", DROP COLUMN IF EXISTS "variants", DROP COLUMN IF EXISTS "addOns"`,
    );
  }
}
