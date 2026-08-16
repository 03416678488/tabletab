import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Global catalogue refactor: menu items + food types become GLOBAL (one
 * catalogue per tenant, no `branchId`), and an item's category membership moves
 * from the single `menu_items.categoryId` FK to a per-branch M2M
 * (`menu_item_categories`). Categories + menus stay per-branch — a branch
 * "carries" an item by placing it in one of its categories. Kills per-branch
 * item duplication.
 *
 * NOTE: this preserves each item's current single-category membership (backfill
 * below) but does NOT de-duplicate items that were copied per branch — for a
 * fresh dev catalogue re-run `db:seed:catalog` after migrating.
 */
export class GlobalCatalog1792000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1) item ↔ category membership pivot.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "menu_item_categories" (
        "menuItemId" uuid NOT NULL REFERENCES "menu_items"("id") ON DELETE CASCADE,
        "categoryId" uuid NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
        PRIMARY KEY ("menuItemId", "categoryId")
      )
    `);
    // Backfill from the existing single category FK.
    await queryRunner.query(`
      INSERT INTO "menu_item_categories" ("menuItemId", "categoryId")
      SELECT "id", "categoryId" FROM "menu_items" WHERE "categoryId" IS NOT NULL
      ON CONFLICT DO NOTHING
    `);

    // 2) Menu items go global — drop the single category FK column and branchId
    // (dropping the columns drops the dependent FK + the unique(branchId,name)
    // index automatically).
    await queryRunner.query(
      `ALTER TABLE "menu_items" DROP COLUMN IF EXISTS "categoryId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_items" DROP COLUMN IF EXISTS "branchId"`,
    );

    // 3) Food types go global — de-dup by name (keep the lowest id, repoint the
    // item links), drop branchId, add a global unique(name).
    await queryRunner.query(`
      UPDATE "menu_item_food_types" mift SET "foodTypeId" = keep.id
      FROM food_types dup
      JOIN (SELECT name, min(id::text)::uuid AS id FROM food_types GROUP BY name) keep
        ON keep.name = dup.name
      WHERE mift."foodTypeId" = dup.id AND dup.id <> keep.id
    `);
    await queryRunner.query(`
      DELETE FROM "food_types" f
      USING (SELECT name, min(id::text)::uuid AS id FROM food_types GROUP BY name) keep
      WHERE f.name = keep.name AND f.id <> keep.id
    `);
    await queryRunner.query(
      `ALTER TABLE "food_types" DROP COLUMN IF EXISTS "branchId"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_food_types_name" ON "food_types" ("name")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_food_types_name"`);
    await queryRunner.query(
      `ALTER TABLE "food_types" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );

    await queryRunner.query(
      `ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "branchId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "categoryId" uuid`,
    );
    // Restore a single category from the pivot (first membership).
    await queryRunner.query(`
      UPDATE "menu_items" mi SET "categoryId" = mic."categoryId"
      FROM (
        SELECT DISTINCT ON ("menuItemId") "menuItemId", "categoryId"
        FROM "menu_item_categories"
      ) mic
      WHERE mic."menuItemId" = mi."id"
    `);
    await queryRunner.query(`DROP TABLE IF EXISTS "menu_item_categories"`);
  }
}
