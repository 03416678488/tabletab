import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Inventory module — hybrid stock tracking.
 *
 * Catalogue (`stock_items`) + per-branch on-hand (`stock_levels`) + an
 * append-only audit ledger (`stock_movements`), plus recipe lines linking
 * recipe-tracked menu items to their raw ingredients. `menu_items` gains the
 * `trackingType`/`stockItemId` columns that drive confirm-time deduction.
 */
export class CreateInventory1790700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" varchar NOT NULL,
        "unit" varchar NOT NULL DEFAULT 'pcs',
        "costPerUnit" numeric(12,3) NOT NULL DEFAULT 0,
        "reorderLevel" numeric(12,3) NOT NULL DEFAULT 0,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_stock_items" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_items_name" ON "stock_items" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_levels" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "stockItemId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "quantity" numeric(12,3) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_stock_levels" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_stock_levels_item_branch" UNIQUE ("stockItemId", "branchId"),
        CONSTRAINT "FK_stock_levels_item" FOREIGN KEY ("stockItemId")
          REFERENCES "stock_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_levels_branch" FOREIGN KEY ("branchId")
          REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_levels_branch" ON "stock_levels" ("branchId")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_movements" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "stockItemId" uuid NOT NULL,
        "branchId" uuid NOT NULL,
        "type" varchar NOT NULL,
        "direction" varchar NOT NULL,
        "quantity" numeric(12,3) NOT NULL DEFAULT 0,
        "orderId" uuid,
        "note" varchar,
        "createdBy" uuid,
        CONSTRAINT "PK_stock_movements" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_movements_item" FOREIGN KEY ("stockItemId")
          REFERENCES "stock_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_movements_item_branch" ON "stock_movements" ("stockItemId", "branchId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_movements_orderId" ON "stock_movements" ("orderId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_movements_createdAt" ON "stock_movements" ("createdAt")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "recipe_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "menuItemId" uuid NOT NULL,
        "stockItemId" uuid NOT NULL,
        "quantity" numeric(12,3) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_recipe_lines" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_recipe_lines_item_stock" UNIQUE ("menuItemId", "stockItemId"),
        CONSTRAINT "FK_recipe_lines_menu_item" FOREIGN KEY ("menuItemId")
          REFERENCES "menu_items"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_recipe_lines_stock_item" FOREIGN KEY ("stockItemId")
          REFERENCES "stock_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_recipe_lines_menuItemId" ON "recipe_lines" ("menuItemId")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_recipe_lines_stockItemId" ON "recipe_lines" ("stockItemId")`,
    );

    await queryRunner.query(
      `ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "trackingType" varchar NOT NULL DEFAULT 'none'`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "stockItemId" uuid`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "menu_items" DROP COLUMN IF EXISTS "stockItemId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_items" DROP COLUMN IF EXISTS "trackingType"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "recipe_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_movements"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_levels"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_items"`);
  }
}
