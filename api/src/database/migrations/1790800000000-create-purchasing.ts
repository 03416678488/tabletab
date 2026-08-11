import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Purchasing — suppliers and purchase orders. Receiving a PO increments the
 * per-branch stock levels created by the inventory migration; its lines record
 * what was bought at what unit cost.
 */
export class CreatePurchasing1790800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "name" varchar NOT NULL,
        "contactName" varchar,
        "phone" varchar,
        "email" varchar,
        "address" varchar,
        "notes" varchar,
        "isActive" boolean NOT NULL DEFAULT true,
        CONSTRAINT "PK_suppliers" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_suppliers_name" ON "suppliers" ("name")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_orders" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "reference" varchar NOT NULL,
        "supplierId" uuid,
        "branchId" uuid NOT NULL,
        "status" varchar NOT NULL DEFAULT 'draft',
        "total" numeric(12,2) NOT NULL DEFAULT 0,
        "notes" varchar,
        "orderedAt" TIMESTAMP WITH TIME ZONE,
        "receivedAt" TIMESTAMP WITH TIME ZONE,
        "createdBy" uuid,
        CONSTRAINT "PK_purchase_orders" PRIMARY KEY ("id"),
        CONSTRAINT "FK_purchase_orders_supplier" FOREIGN KEY ("supplierId")
          REFERENCES "suppliers"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_purchase_orders_branch" FOREIGN KEY ("branchId")
          REFERENCES "branches"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_purchase_orders_branch_status" ON "purchase_orders" ("branchId", "status")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "purchase_order_lines" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "purchaseOrderId" uuid NOT NULL,
        "stockItemId" uuid NOT NULL,
        "quantity" numeric(12,3) NOT NULL DEFAULT 0,
        "unitCost" numeric(12,3) NOT NULL DEFAULT 0,
        "lineTotal" numeric(12,2) NOT NULL DEFAULT 0,
        CONSTRAINT "PK_purchase_order_lines" PRIMARY KEY ("id"),
        CONSTRAINT "FK_po_lines_order" FOREIGN KEY ("purchaseOrderId")
          REFERENCES "purchase_orders"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_po_lines_stock_item" FOREIGN KEY ("stockItemId")
          REFERENCES "stock_items"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_po_lines_order" ON "purchase_order_lines" ("purchaseOrderId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_order_lines"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "purchase_orders"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "suppliers"`);
  }
}
