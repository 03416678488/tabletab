import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Drop the vestigial `promotions.ctaHref` — the old landing-page button target.
 * Product-targeted promotions don't need it; the promo page's "Start ordering"
 * button now just links home.
 */
export class DropPromotionCta1794100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "promotions" DROP COLUMN IF EXISTS "ctaHref"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "promotions" ADD COLUMN IF NOT EXISTS "ctaHref" varchar`,
    );
  }
}
