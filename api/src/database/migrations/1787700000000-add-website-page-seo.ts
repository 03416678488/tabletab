import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWebsitePageSeo1787700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "website_pages" ADD COLUMN IF NOT EXISTS "seo" jsonb NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "website_pages" DROP COLUMN IF EXISTS "seo"`);
  }
}
