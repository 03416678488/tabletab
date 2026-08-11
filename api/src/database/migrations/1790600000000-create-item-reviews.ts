import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Menu-item reviews with admin moderation — guests submit a rating + comment
 * that stays `pending` until an admin approves it. Only approved reviews are
 * shown on the storefront and counted toward an item's average rating.
 */
export class CreateItemReviews1790600000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "item_reviews" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "menuItemId" uuid NOT NULL,
        "branchId" uuid,
        "rating" integer NOT NULL,
        "comment" text,
        "guestName" varchar NOT NULL,
        "guestEmail" varchar,
        "status" varchar NOT NULL DEFAULT 'pending',
        "source" varchar NOT NULL DEFAULT 'online',
        "moderatedAt" timestamptz,
        "moderatedBy" uuid,
        CONSTRAINT "PK_item_reviews" PRIMARY KEY ("id"),
        CONSTRAINT "FK_item_reviews_menuItem" FOREIGN KEY ("menuItemId")
          REFERENCES "menu_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_item_reviews_branch" FOREIGN KEY ("branchId")
          REFERENCES "branches"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_item_reviews_menuItem_status" ON "item_reviews" ("menuItemId", "status")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_item_reviews_menuItem_status"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "item_reviews"`);
  }
}
