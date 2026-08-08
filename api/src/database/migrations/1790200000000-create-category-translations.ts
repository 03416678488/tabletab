import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

/**
 * Per-language translations for categories (name/description). One row per
 * (category, language); cascades when the category is deleted.
 */
export class CreateCategoryTranslations1790200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'category_translations',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true, default: 'gen_random_uuid()' },
          { name: 'categoryId', type: 'uuid' },
          { name: 'locale', type: 'varchar' },
          { name: 'name', type: 'varchar', isNullable: true },
          { name: 'description', type: 'text', isNullable: true },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'category_translations',
      new TableIndex({
        name: 'UQ_category_translations_category_locale',
        columnNames: ['categoryId', 'locale'],
        isUnique: true,
      }),
    );

    await queryRunner.createForeignKey(
      'category_translations',
      new TableForeignKey({
        columnNames: ['categoryId'],
        referencedTableName: 'categories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('category_translations', true);
  }
}
