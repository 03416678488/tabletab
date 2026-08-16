import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Per-branch availability overlay for the GLOBAL item catalogue. Items are
 * shared across branches (see the global-catalog migration), but a branch may
 * 86 / sell out an item independently. This sparse table stores only the
 * deviations: a row present = "this branch overrides the item's global
 * `isAvailable`". No row = the branch inherits the global flag, so an
 * all-available catalogue costs zero rows.
 */
export class MenuItemBranchAvailability1793000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "menu_item_branch_availability" (
        "menuItemId" uuid NOT NULL REFERENCES "menu_items"("id") ON DELETE CASCADE,
        "branchId"   uuid NOT NULL REFERENCES "branches"("id")   ON DELETE CASCADE,
        "isAvailable" boolean NOT NULL,
        PRIMARY KEY ("menuItemId", "branchId")
      )
    `);
    // Read path filters/joins by branch — index the branch side.
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_miba_branch" ON "menu_item_branch_availability" ("branchId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP TABLE IF EXISTS "menu_item_branch_availability"`,
    );
  }
}
