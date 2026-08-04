import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImageUrlToTaxonomyTables1786400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['categories', 'menus', 'food_types']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN IF NOT EXISTS "imageUrl" varchar`,
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ['categories', 'menus', 'food_types']) {
      await queryRunner.query(
        `ALTER TABLE "${table}" DROP COLUMN IF EXISTS "imageUrl"`,
      );
    }
  }
}
