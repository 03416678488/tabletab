import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Product-targeted promotions: a promotion can discount one or many specific
 * menu items. Sparse M2M pivot — no rows for a cart-wide promo. Promotions stay
 * global (no branch scoping); items are global too, so the link is tenant-wide.
 */
export class PromotionItems1794000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "promotion_items" (
        "promotionId" uuid NOT NULL REFERENCES "promotions"("id") ON DELETE CASCADE,
        "menuItemId"  uuid NOT NULL REFERENCES "menu_items"("id") ON DELETE CASCADE,
        PRIMARY KEY ("promotionId", "menuItemId")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_promotion_items_item" ON "promotion_items" ("menuItemId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "promotion_items"`);
  }
}
