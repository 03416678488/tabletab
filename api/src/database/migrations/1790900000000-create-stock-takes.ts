import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Stock takes — physical count reconciliation. Completing a take turns each
 * line's variance (counted − system) into an `adjustment` stock movement, so
 * on-hand matches reality.
 */
export class CreateStockTakes1790900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_takes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "reference" varchar NOT NULL,
        "branchId" uuid NOT NULL,
        "status" varchar NOT NULL DEFAULT 'draft',
        "notes" varchar,
        "completedAt" TIMESTAMP WITH TIME ZONE,
        "createdBy" uuid,
        CONSTRAINT "PK_stock_takes" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_takes_branch" FOREIGN KEY ("branchId")
          REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_takes_branch_status" ON "stock_takes" ("branchId", "status")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "stock_take_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "stockTakeId" uuid NOT NULL,
        "stockItemId" uuid NOT NULL,
        "systemQty" numeric(12,3) NOT NULL DEFAULT 0,
        "countedQty" numeric(12,3) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_stock_take_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_stock_take_lines_take" FOREIGN KEY ("stockTakeId")
          REFERENCES "stock_takes"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_stock_take_lines_item" FOREIGN KEY ("stockItemId")
          REFERENCES "stock_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_stock_take_lines_take" ON "stock_take_lines" ("stockTakeId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_take_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "stock_takes"`);
  }
}
