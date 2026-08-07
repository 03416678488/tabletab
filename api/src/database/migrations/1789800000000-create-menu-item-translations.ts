import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Per-language translations for menu items (name/description). One row per
 * (menu item, language); cascades when the item is deleted.
 */
export class CreateMenuItemTranslations1789800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'menu_item_translations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'menuItemId', type: 'uuid' },
          { name: 'locale', type: 'varchar' },
          { name: 'name', type: 'varchar', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'menu_item_translations',
      new TableIndex({
        name: 'UQ_menu_item_translations_item_locale',
        columnNames: ['menuItemId', 'locale'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'menu_item_translations',
      new TableForeignKey({
        columnNames: ['menuItemId'],
        referencedTableName: 'menu_items',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('menu_item_translations', true);
  }
}
