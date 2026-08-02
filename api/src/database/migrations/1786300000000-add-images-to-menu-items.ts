import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddImagesToMenuItems1786300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "images" jsonb NOT NULL DEFAULT '[]'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "menu_items" DROP COLUMN IF EXISTS "images"`,
    );
  }
}
